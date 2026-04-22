import { headObject, putObject, getPublicUrl } from './r2';
import { synthesizeToBuffer } from './edge-tts';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns a public R2 URL for the TTS audio.
 * The R2 key is derived deterministically from (text, language, voice) —
 * no cache_key column in D1 needed.
 *
 * Flow:
 *  1. Compute key = audio/tts/{sha256(text|language|voice)}.mp3
 *  2. headObject(R2, key) — if exists, return public URL immediately
 *  3. Cache miss → synthesize via Edge TTS → upload to R2 → return public URL
 */
export async function getOrGenerateTTS(
  env: App.Locals['env'],
  text: string,
  language: string,
  voice: string
): Promise<string> {
  const key = await r2Key(text, language, voice);

  const existing = await headObject(env, key);
  if (existing) {
    return getPublicUrl(env, key);
  }

  const audioBuffer = await synthesizeToBuffer({ text, voice });
  await putObject(env, key, audioBuffer, 'audio/mpeg');

  return getPublicUrl(env, key);
}

/** Deterministic R2 key for a TTS sound — sha256(text|language|voice) */
async function r2Key(text: string, language: string, voice: string): Promise<string> {
  const hash = await sha256(`${text}|${language}|${voice}`);
  return `audio/tts/${hash}.mp3`;
}