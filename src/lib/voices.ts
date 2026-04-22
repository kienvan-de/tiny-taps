export interface Voice {
  id: string;
  label: string;
  language: string;
}

export const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English',
  'vi-VN': 'Tiếng Việt',
  'de-DE': 'Deutsch',
  'ja-JP': '日本語',
};

export const VOICES: Voice[] = [
  { id: 'en-US-AvaMultilingualNeural',        label: 'Ava (English)',       language: 'en-US' },
  { id: 'en-US-AndrewMultilingualNeural',     label: 'Andrew (English)',    language: 'en-US' },
  { id: 'vi-VN-HoaiMyNeural',                 label: 'Hoài My (Tiếng Việt)', language: 'vi-VN' },
  { id: 'de-DE-SeraphinaMultilingualNeural',  label: 'Seraphina (Deutsch)', language: 'de-DE' },
  { id: 'ja-JP-NanamiNeural',                 label: 'Nanami (日本語)',      language: 'ja-JP' },
  { id: 'ja-JP-KeitaNeural',                  label: 'Keita (日本語)',       language: 'ja-JP' },
];

export const LANGUAGES = [...new Set(VOICES.map(v => v.language))];

export function voicesForLanguage(language: string): Voice[] {
  return VOICES.filter(v => v.language === language);
}

export function defaultVoiceForLanguage(language: string): string {
  return voicesForLanguage(language)[0]?.id ?? VOICES[0].id;
}