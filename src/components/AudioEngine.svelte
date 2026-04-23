<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export interface ResolvedSound {
    id: string;
    sortOrder: number;
    delayBeforeMs: number;
    url: string;
  }

  export interface SubjectAudio {
    subjectId: string;
    sounds: ResolvedSound[];
  }

  export interface AudioEngineAPI {
    play: (subjectId: string, onDone?: () => void) => Promise<void>;
    stop: () => void;
    loadSubject: (subjectId: string, sounds: ResolvedSound[]) => Promise<void>;
  }

  interface Props {
    onReady?: (engine: AudioEngineAPI) => void;
  }

  let { onReady }: Props = $props();

  // AudioContext — created on first interaction
  let audioCtx: AudioContext | null = null;

  // Decoded buffers cache: subjectId → decoded sounds
  type DecodedSound = ResolvedSound & { buffer: AudioBuffer | null };
  const decodedMap = new Map<string, DecodedSound[]>();
  // Track which subjects are currently being loaded (avoid duplicate fetches)
  const loadingSet = new Set<string>();

  // Playback state
  let currentSubjectId: string | null = null;
  let currentSources: AudioBufferSourceNode[] = [];
  let currentTimeouts: ReturnType<typeof setTimeout>[] = [];

  function getOrCreateContext(): AudioContext {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  function stopCurrent() {
    for (const t of currentTimeouts) clearTimeout(t);
    currentTimeouts = [];
    for (const source of currentSources) {
      try { source.onended = null; source.stop(); source.disconnect(); } catch {}
    }
    currentSources = [];
    currentSubjectId = null;
  }

  // ── Load + decode sounds for one subject ──────────────────────────────
  async function loadSubject(subjectId: string, sounds: ResolvedSound[]): Promise<void> {
    if (decodedMap.has(subjectId)) return; // already loaded
    if (loadingSet.has(subjectId)) return;  // already in flight
    loadingSet.add(subjectId);

    const ctx = getOrCreateContext();
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch {} }

    const decoded: DecodedSound[] = sounds.map(s => ({ ...s, buffer: null }));
    decodedMap.set(subjectId, decoded);

    await Promise.all(
      sounds.map(async (sound, i) => {
        try {
          const res = await fetch(sound.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuf = await res.arrayBuffer();
          decoded[i].buffer = await ctx.decodeAudioData(arrayBuf);
        } catch (err) {
          console.warn('[AudioEngine] Failed to decode', sound.url, err);
        }
      })
    );

    loadingSet.delete(subjectId);
  }

  // ── Play ──────────────────────────────────────────────────────────────
  export async function play(subjectId: string, onDone?: () => void): Promise<void> {
    stopCurrent();

    const ctx = getOrCreateContext();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const decoded = decodedMap.get(subjectId);
    if (!decoded || decoded.length === 0) { onDone?.(); return; }

    currentSubjectId = subjectId;
    const playable = decoded.filter(s => s.buffer !== null);
    if (playable.length === 0) { onDone?.(); return; }

    let scheduleAt = 0;
    for (let i = 0; i < playable.length; i++) {
      const sound = playable[i];
      const durationMs = sound.buffer!.duration * 1000;
      const isLast = i === playable.length - 1;
      scheduleAt += sound.delayBeforeMs;

      const capturedStart = scheduleAt;
      const capturedBuffer = sound.buffer!;
      const capturedSubjectId = subjectId;

      const t = setTimeout(() => {
        if (currentSubjectId !== capturedSubjectId) return;
        try {
          const source = ctx.createBufferSource();
          source.buffer = capturedBuffer;
          source.connect(ctx.destination);
          source.start();
          currentSources.push(source);
          source.onended = () => {
            const idx = currentSources.indexOf(source);
            if (idx !== -1) currentSources.splice(idx, 1);
            try { source.disconnect(); } catch {}
            if (isLast) onDone?.();
          };
        } catch (err) {
          console.warn('[AudioEngine] Playback error:', err);
          if (isLast) onDone?.();
        }
      }, capturedStart);

      currentTimeouts.push(t);
      scheduleAt += durationMs;
    }
  }

  export function stop() {
    stopCurrent();
  }

  function getAPI(): AudioEngineAPI {
    return { play, stop, loadSubject };
  }

  onMount(() => {
    onReady?.(getAPI());
  });

  onDestroy(() => {
    stopCurrent();
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  });
</script>

<!-- headless component — no DOM output -->
