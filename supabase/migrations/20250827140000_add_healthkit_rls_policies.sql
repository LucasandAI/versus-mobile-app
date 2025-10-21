-- Enable RLS on healthkit_samples table if not already enabled
ALTER TABLE public.healthkit_samples ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.healthkit_samples;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.healthkit_samples;
DROP POLICY IF EXISTS "Enable read access for service role" ON public.healthkit_samples;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.healthkit_samples;

-- Policy to allow users to read their own health data
CREATE POLICY "Users can read their own health data"
ON public.healthkit_samples
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy to allow users to insert their own health data
CREATE POLICY "Users can insert their own health data"
ON public.healthkit_samples
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow service role to read all health data (for server-side operations)
CREATE POLICY "Service role can read all health data"
ON public.healthkit_samples
FOR SELECT
TO service_role
USING (true);

-- Policy to allow service role to insert health data (for server-side operations)
CREATE POLICY "Service role can insert health data"
ON public.healthkit_samples
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS healthkit_samples_user_id_idx ON public.healthkit_samples (user_id);
CREATE INDEX IF NOT EXISTS healthkit_samples_start_time_idx ON public.healthkit_samples (start_time);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON TABLE public.healthkit_samples TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.healthkit_samples TO service_role;

-- Add a comment to document the RLS setup
COMMENT ON TABLE public.healthkit_samples IS 'Stores health kit samples with RLS for user data isolation';
