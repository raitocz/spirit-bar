CREATE TABLE quiz_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🧠',
  email TEXT NOT NULL,
  payment_status TEXT CHECK(payment_status IN ('cash', 'bank', 'card', 'free')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_quiz_teams_quiz_id ON quiz_teams(quiz_id);

CREATE TABLE quiz_team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES quiz_teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
CREATE INDEX idx_quiz_team_members_team_id ON quiz_team_members(team_id);
