-- Add thumbnail R2 keys to gallery_photos
ALTER TABLE gallery_photos ADD COLUMN thumb_r2_key TEXT;
ALTER TABLE gallery_photos ADD COLUMN cover_thumb_r2_key TEXT;
