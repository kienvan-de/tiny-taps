import type { APIContext } from 'astro';
import { putObject, getPublicUrl } from '../../../lib/r2';
import { generateId } from '../../../lib/db';

export const prerender = false;

export async function POST(context: APIContext) {
  const env = context.locals.env;

  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  const prefix = (formData.get('prefix') as string | null) ?? 'uploads';
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin';
  const id = generateId();
  const key = `${prefix}/${id}.${ext}`;

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return Response.json({ error: 'Failed to read file' }, { status: 400 });
  }

  const contentType = file.type || inferContentType(ext);

  try {
    await putObject(env, key, buffer, contentType);
  } catch (err) {
    return Response.json({ error: 'Failed to upload to R2' }, { status: 500 });
  }

  const url = getPublicUrl(env, key);
  return Response.json({ key, url }, { status: 201 });
}

function inferContentType(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp3: 'audio/mpeg',
    mp4: 'audio/mp4',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
  };
  return map[ext] ?? 'application/octet-stream';
}