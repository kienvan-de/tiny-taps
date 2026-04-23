/**
 * Local dev R2 proxy — serves objects from miniflare R2 bucket directly.
 *
 * In production, R2_PUBLIC_BASE_URL points to a real R2 public domain
 * so this route is never reached. In local dev R2_PUBLIC_BASE_URL is set
 * to http://localhost:4321/api/r2 so all R2 URLs resolve through here.
 */
import type { APIContext } from 'astro';


// Content-type map for common asset types
const MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export async function GET(context: APIContext) {
  const env = context.locals.env;

  // Only available in local dev — block in production
  if (env.CF_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  const key = context.params.key;
  if (!key) return new Response('Missing key', { status: 400 });

  const object = await env.R2.get(key);

  if (!object) {
    return new Response(`R2 object not found: ${key}`, { status: 404 });
  }

  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  const contentType = MIME[ext] ?? 'application/octet-stream';

  const arrayBuffer = await object.arrayBuffer();

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Content-Length': String(arrayBuffer.byteLength),
    },
  });
}
