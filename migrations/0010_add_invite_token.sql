-- Add invite token columns for user registration flow
ALTER TABLE admins ADD COLUMN invite_token TEXT;
ALTER TABLE admins ADD COLUMN invite_expires TEXT;
