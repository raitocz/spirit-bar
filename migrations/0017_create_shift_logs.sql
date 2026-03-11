-- Shift log entries (staff records actual worked hours)
CREATE TABLE IF NOT EXISTS shift_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  time_from TEXT NOT NULL,
  time_to TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(date, user_id)
);
