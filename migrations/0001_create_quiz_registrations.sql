CREATE TABLE quiz_registrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  phone      TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_quiz_registrations_email      ON quiz_registrations (email);
CREATE INDEX idx_quiz_registrations_created_at ON quiz_registrations (created_at);
