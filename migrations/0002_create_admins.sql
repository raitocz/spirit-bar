-- Admin users for /dungeon panel
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed admin user (change password after first login via cm db:seed)
INSERT INTO admins (username, password_hash) VALUES (
  'raito',
  'pbkdf2:100000:1649c51a8021e5c0b552d724d9bf6cdd:20bef672c04a13e2f4b2d9116ba209f3f0403394286a1a620f6e12d9abe93ff2'
);
