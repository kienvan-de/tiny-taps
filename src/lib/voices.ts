export interface Voice {
  id: string;
  label: string;
  language: string;
}

export const VOICES: Voice[] = [
  { id: 'en-US-AvaMultilingualNeural',        label: 'Ava (English)',       language: 'en-US' },
  { id: 'en-US-AndrewMultilingualNeural',     label: 'Andrew (English)',    language: 'en-US' },
  { id: 'vi-VN-HoaiMyNeural',                 label: 'HoaiMy (Vietnamese)', language: 'vi-VN' },
  { id: 'de-DE-SeraphinaMultilingualNeural',  label: 'Seraphina (German)',  language: 'de-DE' },
];

export const LANGUAGES = [...new Set(VOICES.map(v => v.language))];

export function voicesForLanguage(language: string): Voice[] {
  return VOICES.filter(v => v.language === language);
}

export function defaultVoiceForLanguage(language: string): string {
  return voicesForLanguage(language)[0]?.id ?? VOICES[0].id;
}