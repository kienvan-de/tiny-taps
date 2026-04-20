-- db/schema.sql
-- TinyTaps D1 Schema Migration

CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  category   TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  background_key TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topic_tags (
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, tag_id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id         TEXT PRIMARY KEY,
  topic_id   TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  image_key  TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sounds (
  id              TEXT PRIMARY KEY,
  subject_id      TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  delay_before_ms INTEGER NOT NULL DEFAULT 0,
  type            TEXT NOT NULL CHECK(type IN ('text', 'file')),
  -- For type='text'
  text_content    TEXT,
  language        TEXT DEFAULT 'en-US',
  voice           TEXT DEFAULT 'en-US-AvaMultilingualNeural',
  -- For type='file'
  file_key        TEXT,
  -- TTS cache
  cache_key       TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subjects_topic ON subjects(topic_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_sounds_subject ON sounds(subject_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_topic_tags_tag ON topic_tags(tag_id);