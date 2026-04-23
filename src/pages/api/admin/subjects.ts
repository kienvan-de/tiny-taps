import type { APIContext } from 'astro';
import { queryAll, queryFirst, execute, generateId } from '../../../lib/db';


type SubjectRow = {
  id: string;
  topic_id: string;
  title: string;
  image_key: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function GET(context: APIContext) {
  const db = context.locals.env.DB;
  const url = new URL(context.request.url);
  const topicId = url.searchParams.get('topic_id');
  if (!topicId) {
    return Response.json({ error: 'topic_id query param is required' }, { status: 400 });
  }
  const subjects = await queryAll<SubjectRow>(
    db,
    'SELECT * FROM subjects WHERE topic_id = ? ORDER BY sort_order ASC',
    [topicId]
  );
  return Response.json(subjects);
}

export async function POST(context: APIContext) {
  const db = context.locals.env.DB;
  let body: { topic_id: string; title: string; image_key?: string; sort_order?: number };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.topic_id || !body.title) {
    return Response.json({ error: 'topic_id and title are required' }, { status: 400 });
  }

  const id = generateId();
  await execute(
    db,
    'INSERT INTO subjects (id, topic_id, title, image_key, sort_order) VALUES (?, ?, ?, ?, ?)',
    [id, body.topic_id, body.title, body.image_key ?? null, body.sort_order ?? 0]
  );

  const subject = await queryFirst<SubjectRow>(db, 'SELECT * FROM subjects WHERE id = ?', [id]);
  return Response.json(subject, { status: 201 });
}

export async function PUT(context: APIContext) {
  const db = context.locals.env.DB;
  let body: { id: string; title?: string; image_key?: string; sort_order?: number };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });

  const existing = await queryFirst<SubjectRow>(db, 'SELECT * FROM subjects WHERE id = ?', [body.id]);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  const updates: string[] = ["updated_at = datetime('now')"];
  const params: unknown[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title);
  }
  if (body.image_key !== undefined) {
    updates.push('image_key = ?');
    params.push(body.image_key);
  }
  if (body.sort_order !== undefined) {
    updates.push('sort_order = ?');
    params.push(body.sort_order);
  }

  params.push(body.id);
  await execute(db, `UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`, params);

  const updated = await queryFirst<SubjectRow>(db, 'SELECT * FROM subjects WHERE id = ?', [body.id]);
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

  const existing = await queryFirst<SubjectRow>(db, 'SELECT * FROM subjects WHERE id = ?', [body.id]);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  await execute(db, 'DELETE FROM subjects WHERE id = ?', [body.id]);
  return Response.json({ ok: true });
}