-- 
-- Waste Detection Web App - Database Setup
-- Run this script in the Supabase SQL Editor
--

-- Create the detections table for storing waste detection events
CREATE TABLE IF NOT EXISTS detections (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waste_type TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  inference_speed FLOAT NOT NULL,
  zone_id TEXT,
  zone_type TEXT,
  confidence FLOAT
);

-- Create an index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections (timestamp);

-- Create a view for daily statistics
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
  DATE_TRUNC('day', timestamp) AS day,
  waste_type,
  COUNT(*) AS total_detections,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_disposals,
  SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) AS incorrect_disposals,
  ROUND(AVG(inference_speed)::numeric, 2) AS avg_inference_speed
FROM detections
GROUP BY DATE_TRUNC('day', timestamp), waste_type
ORDER BY day DESC, waste_type;

-- Create a function to get recent statistics
CREATE OR REPLACE FUNCTION get_recent_stats(days_back integer DEFAULT 7)
RETURNS TABLE (
  day date,
  waste_type text,
  total_detections bigint,
  correct_disposals bigint,
  incorrect_disposals bigint,
  accuracy numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('day', timestamp)::date AS day,
    waste_type,
    COUNT(*) AS total_detections,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_disposals,
    SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) AS incorrect_disposals,
    ROUND((SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100), 1) AS accuracy
  FROM detections
  WHERE timestamp > (CURRENT_DATE - days_back * INTERVAL '1 day')
  GROUP BY DATE_TRUNC('day', timestamp), waste_type
  ORDER BY day DESC, waste_type;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In a production environment, you would want to restrict this
CREATE POLICY "Allow all operations for now" ON detections
  FOR ALL 
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Enable realtime for the detections table
-- Note: You need to enable this in the Supabase dashboard as well
-- by going to Database -> Replication -> Realtime and adding "detections"
-- to the tables enabled for realtime

COMMENT ON TABLE detections IS 'Table storing waste detection events from the YOLOv11 model';
COMMENT ON COLUMN detections.waste_type IS 'Type of waste detected (Glass, Metal, Paper, Plastic)';
COMMENT ON COLUMN detections.is_correct IS 'Whether the item was disposed in the correct bin';
COMMENT ON COLUMN detections.inference_speed IS 'Time taken for the model to detect the waste item (in ms)';

-- Show a success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Remember to enable realtime for the "detections" table in the Supabase dashboard.';
END $$; 