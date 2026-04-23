import type { APIContext } from 'astro';
import { queryAll, queryFirst, execute, generateId, slugify } from '../../../lib/db';


type TopicRow = {
  id: string;
  title: string;
  slug: string;
  background_key: string | null;
  created_at: string;
  updated_at: string;
  subject_count?: number;
  tags?: unknown[];
};

async function attachTags(db: D1Database, topics: TopicRow[]): Promise<TopicRow[]> {
  for (const topic of topics) {
    topic.tags = await queryAll(
      db,
      'SELECT tg.* FROM tags tg JOIN topic_tags tt ON tt.tag_id = tg.id WHERE tt.topic_id = ? ORDER BY tg.sort_order ASC',
      [topic.id]
    );
  }
  return topics;
}

export async function GET(context: APIContext) {
  const db = context.locals.env.DB;
  const topics = await queryAll<TopicRow>(
    db,
    `SELECT t.*, (SELECT COUNT(*) FROM subjects s WHERE s.topic_id = t.id) AS subject_count
     FROM topics t
     ORDER BY t.created_at DESC`
  );
  await attachTags(db, topics);
  return Response.json(topics);
}

export async function POST(context: APIContext) {
  const db = context.locals.env.DB;
  let body: { title: string; slug?: string; background_key?: string; tag_ids?: string[] };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.title) return Response.json({ error: 'title is required' }, { status: 400 });

  const id = generateId();
  const slug = body.slug?.trim() || slugify(body.title);

  await execute(
    db,
    'INSERT INTO topics (id, title, slug, background_key) VALUES (?, ?, ?, ?)',
    [id, body.title, slug, body.background_key ?? null]
  );

  if (body.tag_ids?.length) {
    for (const tagId of body.tag_ids) {
      await execute(
        db,
        'INSERT OR IGNORE INTO topic_tags (topic_id, tag_id) VALUES (?, ?)',
        [id, tagId]
      );
    }
  }

  const topic = await queryFirst<TopicRow>(db, 'SELECT * FROM topics WHERE id = ?', [id]);
  if (topic) {
    topic.tags = await queryAll(
      db,
      'SELECT tg.* FROM tags tg JOIN topic_tags tt ON tt.tag_id = tg.id WHERE tt.topic_id = ? ORDER BY tg.sort_order ASC',
      [id]
    );
  }
  return Response.json(topic, { status: 201 });
}

export async function PUT(context: APIContext) {
  const db = context.locals.env.DB;
  let body: {
    id: string;
    title?: string;
    slug?: string;
    background_key?: string;
    tag_ids?: string[];
  };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });

  const existing = await queryFirst(db, 'SELECT * FROM topics WHERE id = ?', [body.id]);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  const updates: string[] = ["updated_at = datetime('now')"];
  const params: unknown[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title);
  }
  if (body.slug !== undefined) {
    updates.push('slug = ?');
    params.push(body.slug);
  }
  if (body.background_key !== undefined) {
    updates.push('background_key = ?');
    params.push(body.background_key);
  }

  params.push(body.id);
  await execute(db, `UPDATE topics SET ${updates.join(', ')} WHERE id = ?`, params);

  if (body.tag_ids !== undefined) {
    await execute(db, 'DELETE FROM topic_tags WHERE topic_id = ?', [body.id]);
    for (const tagId of body.tag_ids) {
      await execute(
        db,
        'INSERT OR IGNORE INTO topic_tags (topic_id, tag_id) VALUES (?, ?)',
        [body.id, tagId]
      );
    }
  }

  const updated = await queryFirst<TopicRow>(db, 'SELECT * FROM topics WHERE id = ?', [body.id]);
  if (updated) {
    updated.tags = await queryAll(
      db,
      'SELECT tg.* FROM tags tg JOIN topic_tags tt ON tt.tag_id = tg.id WHERE tt.topic_id = ? ORDER BY tg.sort_order ASC',
      [body.id]
    );
  }
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

  const existing = await queryFirst(db, 'SELECT * FROM topics WHERE id = ?', [body.id]);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

  await execute(db, 'DELETE FROM topics WHERE id = ?', [body.id]);
  return Response.json({ ok: true });
}