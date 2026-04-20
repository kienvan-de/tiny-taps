import type { APIContext } from 'astro';
import { queryAll, execute } from '../../../../lib/db';
import { getPublicUrl } from '../../../../lib/r2';
import { getOrGenerateTTS, computeCacheKey } from '../../../../lib/tts';

export const prerender = false;

type SubjectRow = {
  id: string;
  topic_id: string;
  title: string;
  image_key: string | null;
  sort_order: number;
};

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
  cache_key: string | null;
};

export async function GET(context: APIContext) {
  const env = context.locals.env;
  const db = env.DB;
  const { slug } = context.params;

  if (!slug) {
    return Response.json({ error: 'slug is required' }, { status: 400 });
  }

  const r2Base = (env.R2_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');

  // Resolve topic by slug
  const topic = await db
    .prepare('SELECT * FROM topics WHERE slug = ?')
    .bind(slug)
    .first<{ id: string; title: string; slug: string; background_key: string | null }>();

  if (!topic) {
    return Response.json({ error: 'Topic not found' }, { status: 404 });
  }

  // Fetch all subjects for this topic
  const subjects = await queryAll<SubjectRow>(
    db,
    'SELECT * FROM subjects WHERE topic_id = ? ORDER BY sort_order ASC',
    [topic.id]
  );

  const result = [];

  for (const subject of subjects) {
    // Fetch all sounds for this subject
    const sounds = await queryAll<SoundRow>(
      db,
      'SELECT * FROM sounds WHERE subject_id = ? ORDER BY sort_order ASC',
      [subject.id]
    );

    const resolvedSounds = [];

    for (const sound of sounds) {
      try {
        let url: string;

        if (sound.type === 'file') {
          if (!sound.file_key) continue;
          url = `${r2Base}/${sound.file_key}`;
        } else {
          // type === 'text'
          const text = sound.text_content;
          const language = sound.language ?? 'en-US';
          const voice = sound.voice ?? 'en-US-AvaMultilingualNeural';

          if (!text) continue;

          if (sound.cache_key) {
            url = `${r2Base}/${sound.cache_key}`;
          } else {
            try {
              url = await getOrGenerateTTS(env, text, language, voice);
              const cacheKey = await computeCacheKey(text, language, voice);
              await execute(db, 'UPDATE sounds SET cache_key = ? WHERE id = ?', [
                cacheKey,
                sound.id,
              ]);
            } catch {
              // TTS not yet implemented — skip gracefully
              continue;
            }
          }
        }

        resolvedSounds.push({
          id: sound.id,
          sortOrder: sound.sort_order,
          delayBeforeMs: sound.delay_before_ms,
          url,
        });
      } catch {
        continue;
      }
    }

    result.push({
      id: subject.id,
      title: subject.title,
      imageUrl: subject.image_key ? `${r2Base}/${subject.image_key}` : null,
      sortOrder: subject.sort_order,
      sounds: resolvedSounds,
    });
  }

  return Response.json({
    topic: {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      backgroundUrl: topic.background_key ? `${r2Base}/${topic.background_key}` : null,
    },
    subjects: result,
  });
}