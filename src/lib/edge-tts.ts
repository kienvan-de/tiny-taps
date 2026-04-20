/**
 * CF-native Microsoft Edge TTS client.
 *
 * Adapted from lang-mirror/src/worker/services/edge-tts.ts.
 * Removed EdgeTTSConfig dependency — all config comes from edge-tts-constants.ts.
 */

import {
  BASE_URL,
  TRUSTED_CLIENT_TOKEN,
  CHROMIUM_FULL_VERSION,
  WSS_HEADERS,
} from "./edge-tts-constants";

// ── DRM — Sec-MS-GEC token ────────────────────────────────────────────────────

const WIN_EPOCH = 11644473600;
const S_TO_NS   = 1e9;

let clockSkewSeconds = 0;

function getUnixTimestamp(): number {
  return Date.now() / 1e3 + clockSkewSeconds;
}

async function generateSecMsGec(): Promise<string> {
  let ticks = getUnixTimestamp();
  ticks += WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= S_TO_NS / 100;

  const strToHash = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(strToHash),
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function syncClockFromResponse(response: Response): void {
  try {
    const serverDate = response.headers.get("date");
    if (!serverDate) return;
    const serverTs = new Date(serverDate).getTime() / 1e3;
    clockSkewSeconds = serverTs - (Date.now() / 1e3);
  } catch { /* ignore */ }
}

// ── ID / timestamp helpers ────────────────────────────────────────────────────

function connectId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  array[6] = (array[6]! & 0x0f) | 0x40;
  array[8] = (array[8]! & 0x3f) | 0x80;
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

function generateMuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function dateToString(): string {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, -1);
}

// ── SSML builder ──────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function speedToRate(speed: number): string {
  const pct = Math.round((speed - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function pitchToHz(semitones: number): string {
  return semitones >= 0 ? `+${semitones}Hz` : `${semitones}Hz`;
}

function mkssml(
  voice: string, rate: string, volume: string, pitch: string, text: string,
): string {
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${voice}'>` +
    `<prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>${escapeXml(text)}</prosody>` +
    `</voice></speak>`
  );
}

// ── Message builders ──────────────────────────────────────────────────────────

function speechConfigMessage(): string {
  const payload = JSON.stringify({
    context: {
      synthesis: {
        audio: {
          metadataoptions: {
            sentenceBoundaryEnabled: "false",
            wordBoundaryEnabled:     "true",
          },
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
      },
    },
  });
  return (
    `X-Timestamp:${dateToString()}Z\r\n` +
    `Content-Type:application/json; charset=utf-8\r\n` +
    `Path:speech.config\r\n\r\n` +
    payload + "\r\n"
  );
}

function ssmlHeadersPlusData(requestId: string, ssml: string): string {
  return (
    `X-RequestId:${requestId}\r\n` +
    `Content-Type:application/ssml+xml\r\n` +
    `X-Timestamp:${dateToString()}Z\r\n` +
    `Path:ssml\r\n\r\n` +
    ssml
  );
}

// ── Binary frame parser ───────────────────────────────────────────────────────

interface BinaryFrameHeaders { [key: string]: string }

function parseBinaryFrame(bytes: Uint8Array): [BinaryFrameHeaders, Uint8Array] {
  const headerLength = (bytes[0]! << 8) | bytes[1]!;
  const headers: BinaryFrameHeaders = {};
  if (headerLength > 0 && headerLength + 2 <= bytes.length) {
    const headerStr = new TextDecoder().decode(bytes.slice(2, headerLength + 2));
    for (const line of headerStr.split("\r\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        headers[line.slice(0, colonIdx)] = line.slice(colonIdx + 1).trim();
      }
    }
  }
  return [headers, bytes.slice(headerLength + 2)];
}

function parseTextFrame(data: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerEnd = data.indexOf("\r\n\r\n");
  const block = headerEnd !== -1 ? data.substring(0, headerEnd) : data;
  for (const line of block.split("\r\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      headers[line.slice(0, colonIdx)] = line.slice(colonIdx + 1).trim();
    }
  }
  return headers;
}

// ── WebSocket connection ──────────────────────────────────────────────────────

async function openWebSocket(
  url: string,
  headers: Record<string, string>,
): Promise<{ ws: WebSocket; response: Response }> {
  const resp = await fetch(url.replace("wss://", "https://"), {
    headers: {
      "Upgrade": "websocket",
      ...headers,
    },
  });

  const cfWs = (resp as unknown as { webSocket?: WebSocket }).webSocket;
  if (!cfWs) {
    const err = Object.assign(
      new Error(`Edge TTS: WebSocket upgrade failed (HTTP ${resp.status})`),
      { status: resp.status, response: resp },
    );
    throw err;
  }

  (cfWs as unknown as { accept(): void }).accept();
  return { ws: cfWs, response: resp };
}

// ── Core synthesize (single attempt) ─────────────────────────────────────────

async function synthesizeOnce(
  text: string,
  voice: string,
  rate: string,
  pitch: string,
  volume: string,
): Promise<ReadableStream<Uint8Array>> {
  const secMsGec        = await generateSecMsGec();
  const secMsGecVersion = `1-${CHROMIUM_FULL_VERSION}`;
  const reqId           = connectId();
  const url =
    `wss://${BASE_URL}/edge/v1` +
    `?TrustedClientToken=${encodeURIComponent(TRUSTED_CLIENT_TOKEN)}` +
    `&Sec-MS-GEC=${encodeURIComponent(secMsGec)}` +
    `&Sec-MS-GEC-Version=${encodeURIComponent(secMsGecVersion)}` +
    `&ConnectionId=${reqId}`;

  const { ws } = await openWebSocket(url, {
    ...WSS_HEADERS,
    Cookie: `muid=${generateMuid()};`,
  });

  const ssml = mkssml(voice, rate, volume, pitch, text);

  ws.send(speechConfigMessage());
  ws.send(ssmlHeadersPlusData(reqId, ssml));

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const timeout = setTimeout(() => {
        controller.error(new Error("Edge TTS: synthesis timed out after 30s"));
        try { ws.close(); } catch { /* ignore */ }
      }, 30_000);

      const processBinary = (bytes: Uint8Array) => {
        const [headers, audioData] = parseBinaryFrame(bytes);
        if (headers["Path"] !== "audio") return;
        if (headers["Content-Type"] !== "audio/mpeg") return;
        if (audioData.length === 0) return;
        controller.enqueue(audioData);
      };

      ws.addEventListener("message", (event: MessageEvent) => {
        const data = event.data;

        if (typeof data === "string") {
          const headers = parseTextFrame(data);
          if (headers["Path"] === "turn.end") {
            clearTimeout(timeout);
            try { controller.close(); } catch { /* already closed */ }
          }
        } else if (typeof Blob !== "undefined" && data instanceof Blob) {
          data.arrayBuffer().then(buf => processBinary(new Uint8Array(buf)));
        } else if (data instanceof ArrayBuffer) {
          processBinary(new Uint8Array(data));
        } else if (data instanceof Uint8Array) {
          processBinary(data);
        }
      });

      ws.addEventListener("error", (event) => {
        clearTimeout(timeout);
        controller.error(new Error(`Edge TTS WebSocket error: ${JSON.stringify(event)}`));
      });

      ws.addEventListener("close", () => {
        clearTimeout(timeout);
        try { controller.close(); } catch { /* already closed */ }
      });
    },

    cancel() {
      try { ws.close(); } catch { /* ignore */ }
    },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SynthesizeOptions {
  text: string;
  voice: string;
  speed?: number;   // 0.5–2.0, default 1.0
  pitch?: number;   // semitones, default 0
  volume?: number;  // 0–100, default 100
}

/**
 * Synthesise speech via Edge TTS and return audio as a ReadableStream<Uint8Array>.
 *
 * On 403/404: syncs clock skew from the server Date header and retries once.
 */
export async function synthesize(opts: SynthesizeOptions): Promise<ReadableStream<Uint8Array>> {
  const {
    text,
    voice,
    speed  = 1.0,
    pitch  = 0,
    volume = 100,
  } = opts;

  const rate      = speedToRate(speed);
  const pitchStr  = pitchToHz(pitch);
  const volumeStr = `+${Math.max(0, Math.min(100, volume))}%`;

  try {
    return await synthesizeOnce(text, voice, rate, pitchStr, volumeStr);
  } catch (err) {
    const status = (err as { status?: number }).status;

    if (status === 403 || status === 404) {
      const resp = (err as { response?: Response }).response;
      if (resp) {
        syncClockFromResponse(resp);
        console.warn(`[edge-tts] ${status} — clock synced from server Date header, retrying once`);
      }
      return await synthesizeOnce(text, voice, rate, pitchStr, volumeStr);
    }

    throw err;
  }
}

/**
 * Convenience helper: synthesise and collect the full audio into an ArrayBuffer.
 * Useful for R2 uploads where a complete buffer is needed.
 */
export async function synthesizeToBuffer(opts: SynthesizeOptions): Promise<ArrayBuffer> {
  const stream = await synthesize(opts);
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}