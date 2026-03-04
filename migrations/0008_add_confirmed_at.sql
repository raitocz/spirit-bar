-- Track when confirmation email was sent to a team
ALTER TABLE quiz_teams ADD COLUMN confirmed_at TEXT;
