CREATE TABLE galleries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date_from TEXT NOT NULL,
  date_to TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
