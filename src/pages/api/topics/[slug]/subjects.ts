import type { APIContext } from 'astro';
import { queryAll } from '../../../../lib/db';

import { getOrGenerateTTS } from '../../../../lib/tts';


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
          // Always call getOrGenerateTTS — it does headObject on R2 first.
          // R2 key is derived from (text, language, voice) — no DB column needed.
          const text = sound.text_content;
          const language = sound.language ?? 'en-US';
          const voice = sound.voice ?? 'en-US-AvaMultilingualNeural';
          if (!text) continue;

          try {
            url = await getOrGenerateTTS(env, text, language, voice);
          } catch {
            continue;
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