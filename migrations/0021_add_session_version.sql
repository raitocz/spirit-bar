-- Add session_version for server-side session invalidation (force-logout)
ALTER TABLE admins ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;
