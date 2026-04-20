import type { APIContext } from 'astro';
import { queryAll } from '../../lib/db';

export const prerender = false;

type TagRow = {
  id: string;
  name: string;
  category: string;
  sort_order: number;
};

type TopicRow = {
  id: string;
  title: string;
  slug: string;
  background_key: string | null;
  created_at: string;
  updated_at: string;
  tags?: TagRow[];
  backgroundUrl?: string | null;
};

export async function GET(context: APIContext) {
  const env = context.locals.env;
  const db = env.DB;
  const url = new URL(context.request.url);

  const tagId = url.searchParams.get('tag') ?? null;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10)));
  const offset = (page - 1) * pageSize;

  const r2Base = (env.R2_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');

  // Build base query depending on tag filter
  let countSql: string;
  let topicsSql: string;
  let params: unknown[];

  if (tagId) {
    countSql = `
      SELECT COUNT(DISTINCT t.id) AS count
      FROM topics t
      JOIN topic_tags tt ON tt.topic_id = t.id
      WHERE tt.tag_id = ?
    `;
    topicsSql = `
      SELECT DISTINCT t.*
      FROM topics t
      JOIN topic_tags tt ON tt.topic_id = t.id
      WHERE tt.tag_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params = [tagId, pageSize, offset];
  } else {
    countSql = `SELECT COUNT(*) AS count FROM topics`;
    topicsSql = `
      SELECT * FROM topics
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params = [pageSize, offset];
  }

  // Total count
  const countResult = tagId
    ? await db.prepare(countSql).bind(tagId).first<{ count: number }>()
    : await db.prepare(countSql).first<{ count: number }>();
  const total = countResult?.count ?? 0;

  // Fetch topics
  const topics = await queryAll<TopicRow>(db, topicsSql, params);

  // Attach tags + backgroundUrl to each topic
  for (const topic of topics) {
    topic.tags = await queryAll<TagRow>(
      db,
      `SELECT tg.*
       FROM tags tg
       JOIN topic_tags tt ON tt.tag_id = tg.id
       WHERE tt.topic_id = ?
       ORDER BY tg.sort_order ASC`,
      [topic.id]
    );
    topic.backgroundUrl = topic.background_key ? `${r2Base}/${topic.background_key}` : null;
  }

  // Group topics by tag (all tags, ordered by sort_order)
  // If a tag filter is active, only return that tag's group.
  let tags: TagRow[];
  if (tagId) {
    const tag = await db
      .prepare('SELECT * FROM tags WHERE id = ?')
      .bind(tagId)
      .first<TagRow>();
    tags = tag ? [tag] : [];
  } else {
    // Only include tags that have at least one topic on this page
    const tagIds = new Set<string>();
    for (const topic of topics) {
      for (const tag of topic.tags ?? []) {
        tagIds.add(tag.id);
      }
    }
    if (tagIds.size > 0) {
      const placeholders = [...tagIds].map(() => '?').join(', ');
      tags = await queryAll<TagRow>(
        db,
        `SELECT * FROM tags WHERE id IN (${placeholders}) ORDER BY sort_order ASC`,
        [...tagIds]
      );
    } else {
      tags = [];
    }
  }

  // Build groups
  const groups = tags.map(tag => ({
    tag: { id: tag.id, name: tag.name, category: tag.category },
    topics: topics
      .filter(t => t.tags?.some(tg => tg.id === tag.id))
      .map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        backgroundUrl: t.backgroundUrl,
        tags: t.tags?.map(tg => ({ id: tg.id, name: tg.name, category: tg.category })) ?? [],
      })),
  })).filter(g => g.topics.length > 0);

  // Topics with no tags go into an "uncategorized" group
  const taggedTopicIds = new Set(groups.flatMap(g => g.topics.map(t => t.id)));
  const untagged = topics.filter(t => !taggedTopicIds.has(t.id));
  if (untagged.length > 0) {
    groups.push({
      tag: { id: '', name: 'Other', category: 'general' },
      topics: untagged.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        backgroundUrl: t.backgroundUrl,
        tags: [],
      })),
    });
  }

  return Response.json({
    groups,
    pagination: { page, pageSize, total },
  });
}