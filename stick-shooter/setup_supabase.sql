-- Stick Shooter Game - Supabase Setup SQL
-- This file contains all the SQL commands needed to set up your Supabase database
-- for the Stick Shooter game's score and email collection system.

-- Create the match_results table
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email TEXT NOT NULL,
  game_name TEXT NOT NULL DEFAULT 'stick-shooter',
  winner TEXT NOT NULL,
  match_duration NUMERIC NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  p1_stats JSONB NOT NULL
);

-- Create an index on the email field for faster lookups
CREATE INDEX match_results_email_idx ON match_results (email);

-- Create an index on the date field for chronological sorting
CREATE INDEX match_results_date_idx ON match_results (date);

-- Add a comment to the table for documentation
COMMENT ON TABLE match_results IS 'Stores match results and statistics for the Stick Shooter game';

-- Add comments to the columns
COMMENT ON COLUMN match_results.id IS 'Unique identifier for each match record';
COMMENT ON COLUMN match_results.created_at IS 'Timestamp when the record was created in the database';
COMMENT ON COLUMN match_results.email IS 'Player email address for sending match results';
COMMENT ON COLUMN match_results.game_name IS 'Name of the game (stick-shooter)';
COMMENT ON COLUMN match_results.winner IS 'The winner of the match (player or enemy)';
COMMENT ON COLUMN match_results.match_duration IS 'Duration of the match in seconds';
COMMENT ON COLUMN match_results.date IS 'Date and time when the match was played';
COMMENT ON COLUMN match_results.p1_stats IS 'JSON object containing Player statistics';

-- Create a view for easier querying of match statistics
CREATE VIEW match_statistics AS
SELECT
  id,
  email,
  game_name,
  winner,
  match_duration,
  date,
  p1_stats->>'shots_fired' AS shots_fired,
  p1_stats->>'shots_hit' AS shots_hit,
  p1_stats->>'damage_dealt' AS damage_dealt,
  p1_stats->>'score' AS score,
  p1_stats->>'power_ups_collected' AS power_ups_collected
FROM match_results
WHERE game_name = 'stick-shooter';

-- Set up Row Level Security (RLS)
-- Enable row level security
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows inserting new records (for the game client)
CREATE POLICY "Allow anonymous inserts" ON match_results
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows users to view only their own match results
CREATE POLICY "Users can view their own match results" ON match_results
  FOR SELECT USING (auth.email() = email);

-- Create a function to send email with match results
-- Note: This is a placeholder. You'll need to set up an actual email service
-- through Supabase Edge Functions or a third-party service.
CREATE OR REPLACE FUNCTION send_match_results_email()
RETURNS TRIGGER AS $$
BEGIN
  -- This is where you would integrate with an email service
  -- For now, we'll just log that an email would be sent
  RAISE NOTICE 'Would send email to % with match results for match %', NEW.email, NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the email function when a new match result is inserted
CREATE TRIGGER after_match_result_insert
  AFTER INSERT ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION send_match_results_email();

-- Create a function to calculate player statistics
CREATE OR REPLACE FUNCTION get_player_stats(player_email TEXT)
RETURNS TABLE (
  total_matches BIGINT,
  highest_score BIGINT,
  avg_score NUMERIC,
  total_shots_fired BIGINT,
  total_shots_hit BIGINT,
  accuracy NUMERIC,
  total_damage_dealt BIGINT,
  total_power_ups_collected BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH player_matches AS (
    SELECT
      id,
      winner,
      match_duration,
      (p1_stats->>'shots_fired')::NUMERIC AS shots_fired,
      (p1_stats->>'shots_hit')::NUMERIC AS shots_hit,
      (p1_stats->>'damage_dealt')::NUMERIC AS damage_dealt,
      (p1_stats->>'score')::NUMERIC AS score,
      (p1_stats->>'power_ups_collected')::NUMERIC AS power_ups_collected
    FROM match_results
    WHERE email = player_email AND game_name = 'stick-shooter'
  )
  SELECT
    COUNT(*)::BIGINT AS total_matches,
    COALESCE(MAX(score), 0)::BIGINT AS highest_score,
    COALESCE(AVG(score), 0) AS avg_score,
    COALESCE(SUM(shots_fired), 0)::BIGINT AS total_shots_fired,
    COALESCE(SUM(shots_hit), 0)::BIGINT AS total_shots_hit,
    CASE 
      WHEN COALESCE(SUM(shots_fired), 0) > 0 THEN 
        (COALESCE(SUM(shots_hit), 0)::NUMERIC / COALESCE(SUM(shots_fired), 0)::NUMERIC) * 100
      ELSE 0
    END AS accuracy,
    COALESCE(SUM(damage_dealt), 0)::BIGINT AS total_damage_dealt,
    COALESCE(SUM(power_ups_collected), 0)::BIGINT AS total_power_ups_collected
  FROM player_matches;
END;
$$ LANGUAGE plpgsql;

-- Create a secure API for the game to use
CREATE SCHEMA api;

-- Create a function to submit match results through the API
CREATE OR REPLACE FUNCTION api.submit_match_results(
  player_email TEXT,
  game_name TEXT,
  match_winner TEXT,
  match_duration NUMERIC,
  player_stats JSONB
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO match_results (
    email, 
    game_name,
    winner, 
    match_duration, 
    p1_stats
  ) VALUES (
    player_email,
    game_name,
    match_winner,
    match_duration,
    player_stats
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 