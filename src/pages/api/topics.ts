import type { APIContext } from 'astro';
import { queryAll } from '../../lib/db';

export const prerender = false;

type TagRow = {
  id: string;
  name: string;
  category: string;
  sort_order: number;
  icon: string | null;
};

type TopicRow = {
  id: string;
  title: string;
  slug: string;
  background_key: string | null;
  created_at: string;
  updated_at: string;
  tags?: { id: string; name: string; category: string }[];
  backgroundUrl?: string | null;
};

export async function GET(context: APIContext) {
  // ── Cloudflare Cache API (public topics, 5-min TTL) ───────────────────
  // Skip entirely in local dev — miniflare persists cache to disk and serves
  // stale responses after clean:cf + re-seed. Use CF_ENV=production to enable.
  const isProd = (context.locals.env as any).CF_ENV === 'production';
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = context.request;
  if (isProd) {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) return cachedResponse;
  }

  const env = context.locals.env;
  const db = env.DB;
  const url = new URL(context.request.url);

  const tagId = url.searchParams.get('tag') ?? null;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10)));
  const offset = (page - 1) * pageSize;

  const r2Base = (env.R2_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');

  // ── Count + fetch topics (flat, deduplicated via DISTINCT) ────────────
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

  const countResult = tagId
    ? await db.prepare(countSql).bind(tagId).first<{ count: number }>()
    : await db.prepare(countSql).first<{ count: number }>();
  const total = countResult?.count ?? 0;

  const topicRows = await queryAll<TopicRow>(db, topicsSql, params);

  // ── Attach tags + backgroundUrl to each topic ─────────────────────────
  for (const topic of topicRows) {
    const tagRows = await queryAll<TagRow>(
      db,
      `SELECT tg.id, tg.name, tg.category, tg.icon
       FROM tags tg
       JOIN topic_tags tt ON tt.tag_id = tg.id
       WHERE tt.topic_id = ?
       ORDER BY tg.sort_order ASC`,
      [topic.id]
    );
    topic.tags = tagRows.map(t => ({ id: t.id, name: t.name, category: t.category, icon: t.icon }));
    topic.backgroundUrl = topic.background_key ? `${r2Base}/${topic.background_key}` : null;
  }

  // ── All tags for filter chips ─────────────────────────────────────────
  const allTagRows = await queryAll<TagRow>(
    db,
    'SELECT id, name, category, icon FROM tags ORDER BY sort_order ASC, name ASC'
  );

  const response = Response.json(
    {
      topics: topicRows.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        backgroundUrl: t.backgroundUrl ?? null,
        tags: t.tags ?? [],
      })),
      allTags: allTagRows.map(t => ({ id: t.id, name: t.name, category: t.category, icon: t.icon ?? null })),
      pagination: { page, pageSize, total },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    }
  );

  // Store in Cloudflare Cache API — non-blocking, production only
  if (isProd) {
    context.locals.cfContext?.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}
