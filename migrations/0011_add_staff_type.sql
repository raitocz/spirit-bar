-- Staff type for shift assignments: hookah (dýmkař), bartender (barman), both (barodýmkař)
ALTER TABLE admins ADD COLUMN staff_type TEXT;
