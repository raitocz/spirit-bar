-- Add role column to admins (admin, quizmaster, staff)
-- Note: In some local DBs this was already applied as 0008_add_admin_roles.sql
ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'staff';

-- Set existing user 'raito' as admin
UPDATE admins SET role = 'admin' WHERE username = 'raito';
