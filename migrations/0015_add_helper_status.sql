-- Add 'helper' as allowed status in shift_availability
-- SQLite can't ALTER CHECK constraints, so recreate the table
CREATE TABLE shift_availability_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'helper')),
  UNIQUE(date, user_id)
);

INSERT INTO shift_availability_new (id, date, user_id, status)
  SELECT id, date, user_id, status FROM shift_availability;

DROP TABLE shift_availability;
ALTER TABLE shift_availability_new RENAME TO shift_availability;
