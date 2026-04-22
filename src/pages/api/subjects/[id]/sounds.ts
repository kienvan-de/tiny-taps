import type { APIContext } from 'astro';
import { queryAll } from '../../../../lib/db';
import { getPublicUrl } from '../../../../lib/r2';
import { getOrGenerateTTS } from '../../../../lib/tts';

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
};

type ResolvedSound = {
  id: string;
  sortOrder: number;
  delayBeforeMs: number;
  url: string;
};

export async function GET(context: APIContext) {
  const env = context.locals.env;
  const db = env.DB;
  const { id: subjectId } = context.params;

  if (!subjectId) {
    return Response.json({ error: 'Subject ID is required' }, { status: 400 });
  }

  const sounds = await queryAll<SoundRow>(
    db,
    'SELECT * FROM sounds WHERE subject_id = ? ORDER BY sort_order ASC',
    [subjectId]
  );

  const resolved: ResolvedSound[] = [];

  for (const sound of sounds) {
    try {
      let url: string;

      if (sound.type === 'file') {
        if (!sound.file_key) continue;
        url = getPublicUrl(env, sound.file_key);
      } else {
        // type === 'text'
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

      resolved.push({
        id: sound.id,
        sortOrder: sound.sort_order,
        delayBeforeMs: sound.delay_before_ms,
        url,
      });
    } catch {
      // Skip any sound that fails to resolve
      continue;
    }
  }

  return Response.json({ sounds: resolved });
}