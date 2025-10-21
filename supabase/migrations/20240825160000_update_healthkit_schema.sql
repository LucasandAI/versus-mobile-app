-- This migration updates the healthkit_samples table schema
-- It's designed to be idempotent and safe to run multiple times

-- Drop any existing constraints that might conflict
ALTER TABLE healthkit_samples 
  DROP CONSTRAINT IF EXISTS healthkit_samples_sample_uuid_key;

-- Add any missing columns with proper existence checks
DO $$
BEGIN
  -- Add source_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'healthkit_samples' AND column_name = 'source_name') THEN
    ALTER TABLE healthkit_samples ADD COLUMN source_name TEXT;
  END IF;

  -- Add processed if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'healthkit_samples' AND column_name = 'processed') THEN
    ALTER TABLE healthkit_samples ADD COLUMN processed BOOLEAN DEFAULT false;
  END IF;

  -- Add created_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'healthkit_samples' AND column_name = 'created_at') THEN
    ALTER TABLE healthkit_samples ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- Add source_bundle_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'healthkit_samples' AND column_name = 'source_bundle_id') THEN
    ALTER TABLE healthkit_samples ADD COLUMN source_bundle_id TEXT;
  END IF;

  -- Add duration_seconds if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'healthkit_samples' AND column_name = 'duration_seconds') THEN
    ALTER TABLE healthkit_samples ADD COLUMN duration_seconds NUMERIC;
  END IF;
END $$;

-- Ensure the unique constraint exists with the correct columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'healthkit_samples' 
    AND constraint_name = 'healthkit_samples_user_id_sample_uuid_key'
  ) THEN
    ALTER TABLE healthkit_samples 
    ADD CONSTRAINT healthkit_samples_user_id_sample_uuid_key 
    UNIQUE (user_id, sample_uuid);
  END IF;
END $$;

-- Create or replace the index on user_id and start_time
CREATE INDEX IF NOT EXISTS idx_healthkit_samples_user_time 
  ON healthkit_samples(user_id, start_time);

-- Drop old indices if they exist
DROP INDEX IF EXISTS idx_healthkit_samples_user_id;
DROP INDEX IF EXISTS idx_healthkit_samples_start_date;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION process_healthkit_samples()
RETURNS TRIGGER AS $$
BEGIN
  -- Your trigger logic here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'process_healthkit_trigger'
  ) THEN
    CREATE TRIGGER process_healthkit_trigger 
    BEFORE INSERT OR UPDATE ON healthkit_samples 
    FOR EACH ROW 
    WHEN (NEW.processed = false)
    EXECUTE FUNCTION process_healthkit_samples();
  END IF;
END $$;
