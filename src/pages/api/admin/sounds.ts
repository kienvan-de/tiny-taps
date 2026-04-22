import type { APIContext } from 'astro';
import { queryAll, queryFirst, execute, generateId } from '../../../lib/db';

export const prerender = false;

type SoundRow = {
  id: string;
  subject_id: string;
  sort_order: number;
  delay_before_ms: number;
  type: 'text' | 'file';
  text_content: string | null;
  language: string | null;
  voice: string | null;
  file_key: string | null;
  created_at: string;
};

export async function GET(context: APIContext) {
  const db = context.locals.env.DB;
  const url = new URL(context.request.url);
  const subjectId = url.searchParams.get('subject_id');
  if (!subjectId) {
    return Response.json({ error: 'subject_id query param is required' }, { status: 400 });
  }
  const sounds = await queryAll<SoundRow>(
    db,
    'SELECT * FROM sounds WHERE subject_id = ? ORDER BY sort_order ASC',
    [subjectId]
  );
  return Response.json(sounds);
}

export async function POST(context: APIContext) {
  const db = context.locals.env.DB;
  let body: {
    subject_id: string;
    type: 'text' | 'file';
    sort_order?: number;
    delay_before_ms?: number;
    text_content?: string;
    language?: string;
    voice?: string;
    file_key?: string;
  };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.subject_id || !body.type) {
    return Response.json({ error: 'subject_id and type are required' }, { status: 400 });
  }
  if (!['text', 'file'].includes(body.type)) {
    return Response.json({ error: 'type must be "text" or "file"' }, { status: 400 });
  }

  const id = generateId();
  await execute(
    db,
    `INSERT INTO sounds
       (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice, file_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      body.subject_id,
      body.sort_order ?? 0,
      body.delay_before_ms ?? 0,
      body.type,
      body.text_content ?? null,
      body.language ?? 'en-US',
      body.voice ?? 'en-US-AvaMultilingualNeural',
      body.file_key ?? null,
    ]
  );

  const sound = await queryFirst<SoundRow>(db, 'SELECT * FROM sounds WHERE id = ?', [id]);
  return Response.json(sound, { status: 201 });
}

export async function PUT(context: APIContext) {
  const db = context.locals.env.DB;
  let body: {
    id: string;
    sort_order?: number;
    delay_before_ms?: number;
    type?: 'text' | 'file';
    text_content?: string | null;
    language?: string;
    voice?: string;
    file_key?: string | null;
  };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });

  const existing = await queryFirst<SoundRow>(db, 'SELECT * FROM sounds WHERE id = ?', [body.id]);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  const updatableFields = [
    'sort_order',
    'delay_before_ms',
    'type',
    'text_content',
    'language',
    'voice',
    'file_key',
  ] as const;

  const updates: string[] = [];
  const params: unknown[] = [];

  for (const field of updatableFields) {
    if (field in body && (body as Record<string, unknown>)[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push((body as Record<string, unknown>)[field]);
    }
  }

  if (updates.length === 0) {
    return Response.json(existing);
  }

  params.push(body.id);
  await execute(db, `UPDATE sounds SET ${updates.join(', ')} WHERE id = ?`, params);

  const updated = await queryFirst<SoundRow>(db, 'SELECT * FROM sounds WHERE id = ?', [body.id]);
  return Response.json(updated);
}

export async function DELETE(context: APIContext) {
  const db = context.locals.env.DB;
  let body: { id: string };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });

  const existing = await queryFirst<SoundRow>(db, 'SELECT * FROM sounds WHERE id = ?', [body.id]);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  await execute(db, 'DELETE FROM sounds WHERE id = ?', [body.id]);
  return Response.json({ ok: true });
}