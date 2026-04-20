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
 * Returns a public URL for the TTS audio.
 * Checks R2 cache first; if miss, generates via Edge TTS and caches.
 *
 * Cache key: audio/tts/{sha256(text|language|voice)}.mp3
 */
export async function getOrGenerateTTS(
  env: App.Locals['env'],
  text: string,
  language: string,
  voice: string
): Promise<string> {
  const cacheKey = await computeCacheKey(text, language, voice);

  // 1. Check R2 cache
  const existing = await headObject(env, cacheKey);
  if (existing) {
    return getPublicUrl(env, cacheKey);
  }

  // 2. Cache miss → generate via Edge TTS
  const audioBuffer = await synthesizeToBuffer({ text, voice });

  // 3. Store in R2
  await putObject(env, cacheKey, audioBuffer, 'audio/mpeg');

  return getPublicUrl(env, cacheKey);
}

/**
 * Computes the deterministic R2 cache key for a given TTS request
 * without generating audio. Used by the sounds API to update the DB
 * cache_key field after generation.
 */
export async function computeCacheKey(
  text: string,
  language: string,
  voice: string
): Promise<string> {
  const hash = await sha256(`${text}|${language}|${voice}`);
  return `audio/tts/${hash}.mp3`;
}