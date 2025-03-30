-- Simple script to create the detections table in Supabase
-- Run this in the Supabase SQL Editor

-- Create the detections table for storing waste detection events
CREATE TABLE IF NOT EXISTS public.detections (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waste_type TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  inference_speed FLOAT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations for now" 
  ON public.detections
  FOR ALL 
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Enable realtime for this table
-- Note: You also need to enable this in the Supabase dashboard
-- by going to Database → Replication → Tables and enabling "detections" 