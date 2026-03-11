-- Shift assignments (one row per day, hookah + bar positions)
CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  hookah_user_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  bar_user_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Shift availability (backup / unavailable, many users per day)
CREATE TABLE IF NOT EXISTS shift_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable')),
  UNIQUE(date, user_id)
);
