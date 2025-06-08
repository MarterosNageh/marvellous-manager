-- Add drive_type column to hard_drives table
ALTER TABLE hard_drives
ADD COLUMN drive_type VARCHAR(10) NOT NULL DEFAULT 'backup'
CHECK (drive_type IN ('backup', 'taxi', 'passport'));

-- Update existing records to have the default value
UPDATE hard_drives SET drive_type = 'backup' WHERE drive_type IS NULL;
