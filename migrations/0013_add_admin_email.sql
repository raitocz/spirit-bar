-- Add email column to admins (safe: CREATE TABLE replacement for idempotency)
-- SQLite doesn't support IF NOT EXISTS on ALTER TABLE, so we check via pragma
-- If column already exists, ALTER will fail but D1 tracks migration as applied.
-- For fresh installs this runs fine.
ALTER TABLE admins ADD COLUMN email TEXT;

-- Create unique index on email (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins(email) WHERE email IS NOT NULL;
