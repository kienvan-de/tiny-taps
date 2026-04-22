import type { APIContext } from 'astro';
import { queryAll, queryFirst, execute, generateId } from '../../../lib/db';

export const prerender = false;

export async function GET(context: APIContext) {
  const db = context.locals.env.DB;
  const tags = await queryAll(db, 'SELECT * FROM tags ORDER BY sort_order ASC, name ASC');
  return Response.json(tags);
}

export async function POST(context: APIContext) {
  const db = context.locals.env.DB;
  let body: { name: string; category: string; sort_order?: number; icon?: string };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.name || !body.category) {
    return Response.json({ error: 'name and category are required' }, { status: 400 });
  }
  const id = generateId();
  await execute(db, 'INSERT INTO tags (id, name, category, sort_order, icon) VALUES (?, ?, ?, ?, ?)', [
    id,
    body.name,
    body.category,
    body.sort_order ?? 0,
    body.icon ?? null,
  ]);
  const tag = await queryFirst(db, 'SELECT * FROM tags WHERE id = ?', [id]);
  return Response.json(tag, { status: 201 });
}

export async function PUT(context: APIContext) {
  const db = context.locals.env.DB;
  let body: { id: string; name?: string; category?: string; sort_order?: number; icon?: string | null };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });

  const existing = await queryFirst(db, 'SELECT * FROM tags WHERE id = ?', [body.id]);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  const updates: string[] = [];
  const params: unknown[] = [];
  if (body.name !== undefined) {
    updates.push('name = ?');
    params.push(body.name);
  }
  if (body.category !== undefined) {
    updates.push('category = ?');
    params.push(body.category);
  }
  if (body.sort_order !== undefined) {
    updates.push('sort_order = ?');
    params.push(body.sort_order);
  }
  if (body.icon !== undefined) {
    updates.push('icon = ?');
    params.push(body.icon);
  }
  if (updates.length === 0) {
    return Response.json(existing);
  }
  params.push(body.id);
  await execute(db, `UPDATE tags SET ${updates.join(', ')} WHERE id = ?`, params);
  const updated = await queryFirst(db, 'SELECT * FROM tags WHERE id = ?', [body.id]);
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
  const existing = await queryFirst(db, 'SELECT * FROM tags WHERE id = ?', [body.id]);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
  await execute(db, 'DELETE FROM tags WHERE id = ?', [body.id]);
  return Response.json({ ok: true });
}