export type Locale = 'en' | 'vi' | 'de' | 'ja';

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English',      flag: '🇬🇧' },
  { code: 'vi', label: 'Tiếng Việt',   flag: '🇻🇳' },
  { code: 'de', label: 'Deutsch',      flag: '🇩🇪' },
  { code: 'ja', label: '日本語',        flag: '🇯🇵' },
];

export const TRANSLATIONS: Record<Locale, {
  // Home page
  loading:        string;
  oops:           string;
  noTopics:       string;
  checkBackSoon:  string;
  // Tag filter
  all:            string;
  filterByTag:    string;
  showAllTopics:  string;
  // Topic card
  openTopic:      string;
  // Nav
  goHome:         string;
  // Lang picker
  language:       string;
}> = {
  en: {
    loading:       'Loading topics',
    oops:          'Oops!',
    noTopics:      'No topics yet!',
    checkBackSoon: 'Check back soon for new content.',
    all:           'All',
    filterByTag:   'Filter by tag',
    showAllTopics: 'Show all topics',
    openTopic:     'Open topic',
    goHome:        'Go home',
    language:      'Language',
  },
  vi: {
    loading:       'Đang tải chủ đề',
    oops:          'Ối!',
    noTopics:      'Chưa có chủ đề nào!',
    checkBackSoon: 'Quay lại sau để xem nội dung mới nhé.',
    all:           'Tất cả',
    filterByTag:   'Lọc theo nhãn',
    showAllTopics: 'Hiển thị tất cả chủ đề',
    openTopic:     'Mở chủ đề',
    goHome:        'Về trang chủ',
    language:      'Ngôn ngữ',
  },
  de: {
    loading:       'Themen werden geladen',
    oops:          'Hoppla!',
    noTopics:      'Noch keine Themen!',
    checkBackSoon: 'Schau bald wieder vorbei für neue Inhalte.',
    all:           'Alle',
    filterByTag:   'Nach Schlagwort filtern',
    showAllTopics: 'Alle Themen anzeigen',
    openTopic:     'Thema öffnen',
    goHome:        'Zur Startseite',
    language:      'Sprache',
  },
  ja: {
    loading:       'トピックを読み込み中',
    oops:          'おっと！',
    noTopics:      'まだトピックがありません！',
    checkBackSoon: '新しいコンテンツをお楽しみに。',
    all:           'すべて',
    filterByTag:   'タグで絞り込む',
    showAllTopics: 'すべてのトピックを表示',
    openTopic:     'トピックを開く',
    goHome:        'ホームへ',
    language:      '言語',
  },
};

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'tt-locale';

export function getT(locale: Locale) {
  return TRANSLATIONS[locale] ?? TRANSLATIONS[DEFAULT_LOCALE];
}

export function isValidLocale(v: unknown): v is Locale {
  return typeof v === 'string' && v in TRANSLATIONS;
}
