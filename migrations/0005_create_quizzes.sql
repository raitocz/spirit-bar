CREATE TABLE quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_number INTEGER NOT NULL,
  date TEXT NOT NULL,
  max_participants INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
