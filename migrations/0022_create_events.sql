-- Events / bar actions calendar
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_r2_key TEXT,
  cover_width INTEGER,
  cover_height INTEGER,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  has_competitions INTEGER NOT NULL DEFAULT 0,
  has_special_drinks INTEGER NOT NULL DEFAULT 0,
  has_costume_reward INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
