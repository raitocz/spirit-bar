-- Key-value settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default hourly wage
INSERT INTO settings (key, value) VALUES ('hourly_wage', '140');
