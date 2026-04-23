import type { APIContext } from 'astro';
import { queryAll } from '../../../../lib/db';

type SubjectRow = {
  id: string;
  topic_id: string;
  title: string;
  image_key: string | null;
  sort_order: number;
};

export async function GET(context: APIContext) {
  const env = context.locals.env;
  const db = env.DB;
  const { slug } = context.params;

  if (!slug) {
    return Response.json({ error: 'slug is required' }, { status: 400 });
  }

  const r2Base = (env.R2_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');

  const topic = await db
    .prepare('SELECT * FROM topics WHERE slug = ?')
    .bind(slug)
    .first<{ id: string; title: string; slug: string; background_key: string | null }>();

  if (!topic) {
    return Response.json({ error: 'Topic not found' }, { status: 404 });
  }

  const subjects = await queryAll<SubjectRow>(
    db,
    'SELECT * FROM subjects WHERE topic_id = ? ORDER BY sort_order ASC',
    [topic.id]
  );

  return Response.json({
    topic: {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      backgroundUrl: topic.background_key ? `${r2Base}/${topic.background_key}` : null,
    },
    // Subjects without sounds — sounds are loaded lazily per subject on first tap
    subjects: subjects.map(s => ({
      id: s.id,
      title: s.title,
      imageUrl: s.image_key ? `${r2Base}/${s.image_key}` : null,
      sortOrder: s.sort_order,
    })),
  });
}
