-- Add explicit date indexes for LIKE prefix queries on shift tables
CREATE INDEX IF NOT EXISTS idx_shift_availability_date ON shift_availability(date);
CREATE INDEX IF NOT EXISTS idx_shift_logs_date ON shift_logs(date);
