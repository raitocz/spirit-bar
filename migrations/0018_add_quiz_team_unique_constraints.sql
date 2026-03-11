-- Prevent race condition: enforce unique team name and icon per quiz at DB level
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_teams_quiz_name ON quiz_teams(quiz_id, team_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_teams_quiz_icon ON quiz_teams(quiz_id, icon);
