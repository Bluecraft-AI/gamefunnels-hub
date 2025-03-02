-- Stick Fighter Game - Supabase Setup SQL
-- This file contains all the SQL commands needed to set up your Supabase database
-- for the Stick Fighter game's match results tracking system.

-- Create the match_results table
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email TEXT NOT NULL,
  winner TEXT NOT NULL,
  match_duration NUMERIC NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  p1_stats JSONB NOT NULL,
  p2_stats JSONB NOT NULL
);

-- Create an index on the email field for faster lookups
CREATE INDEX match_results_email_idx ON match_results (email);

-- Create an index on the date field for chronological sorting
CREATE INDEX match_results_date_idx ON match_results (date);

-- Add a comment to the table for documentation
COMMENT ON TABLE match_results IS 'Stores match results and statistics for the Stick Fighter game';

-- Add comments to the columns
COMMENT ON COLUMN match_results.id IS 'Unique identifier for each match record';
COMMENT ON COLUMN match_results.created_at IS 'Timestamp when the record was created in the database';
COMMENT ON COLUMN match_results.email IS 'Player email address for sending match results';
COMMENT ON COLUMN match_results.winner IS 'The winner of the match (Player 1 or Player 2)';
COMMENT ON COLUMN match_results.match_duration IS 'Duration of the match in seconds';
COMMENT ON COLUMN match_results.date IS 'Date and time when the match was played';
COMMENT ON COLUMN match_results.p1_stats IS 'JSON object containing Player 1 statistics';
COMMENT ON COLUMN match_results.p2_stats IS 'JSON object containing Player 2 statistics';

-- Create a view for easier querying of match statistics
CREATE VIEW match_statistics AS
SELECT
  id,
  email,
  winner,
  match_duration,
  date,
  p1_stats->>'punches_thrown' AS p1_punches_thrown,
  p1_stats->>'punches_landed' AS p1_punches_landed,
  p1_stats->>'blocks_performed' AS p1_blocks_performed,
  p1_stats->>'damage_dealt' AS p1_damage_dealt,
  p1_stats->>'jumps_performed' AS p1_jumps_performed,
  p1_stats->>'time_spent_ducking' AS p1_time_spent_ducking,
  p2_stats->>'punches_thrown' AS p2_punches_thrown,
  p2_stats->>'punches_landed' AS p2_punches_landed,
  p2_stats->>'blocks_performed' AS p2_blocks_performed,
  p2_stats->>'damage_dealt' AS p2_damage_dealt,
  p2_stats->>'jumps_performed' AS p2_jumps_performed,
  p2_stats->>'time_spent_ducking' AS p2_time_spent_ducking
FROM match_results;

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

-- Create a function to calculate win rates for players
CREATE OR REPLACE FUNCTION get_player_stats(player_email TEXT)
RETURNS TABLE (
  total_matches BIGINT,
  matches_won BIGINT,
  win_rate NUMERIC,
  avg_match_duration NUMERIC,
  total_punches_thrown BIGINT,
  total_punches_landed BIGINT,
  accuracy NUMERIC,
  total_blocks BIGINT,
  total_damage_dealt BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH player_matches AS (
    SELECT
      id,
      winner = 'Player 1' AS p1_won,
      winner = 'Player 2' AS p2_won,
      match_duration,
      (p1_stats->>'punches_thrown')::NUMERIC AS p1_punches_thrown,
      (p1_stats->>'punches_landed')::NUMERIC AS p1_punches_landed,
      (p1_stats->>'blocks_performed')::NUMERIC AS p1_blocks_performed,
      (p1_stats->>'damage_dealt')::NUMERIC AS p1_damage_dealt,
      (p2_stats->>'punches_thrown')::NUMERIC AS p2_punches_thrown,
      (p2_stats->>'punches_landed')::NUMERIC AS p2_punches_landed,
      (p2_stats->>'blocks_performed')::NUMERIC AS p2_blocks_performed,
      (p2_stats->>'damage_dealt')::NUMERIC AS p2_damage_dealt
    FROM match_results
    WHERE email = player_email
  )
  SELECT
    COUNT(*)::BIGINT AS total_matches,
    COUNT(*) FILTER (WHERE p1_won OR p2_won)::BIGINT AS matches_won,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE p1_won OR p2_won)::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0
    END AS win_rate,
    COALESCE(AVG(match_duration), 0) AS avg_match_duration,
    COALESCE(SUM(p1_punches_thrown + p2_punches_thrown), 0)::BIGINT AS total_punches_thrown,
    COALESCE(SUM(p1_punches_landed + p2_punches_landed), 0)::BIGINT AS total_punches_landed,
    CASE 
      WHEN COALESCE(SUM(p1_punches_thrown + p2_punches_thrown), 0) > 0 THEN 
        (COALESCE(SUM(p1_punches_landed + p2_punches_landed), 0)::NUMERIC / 
         COALESCE(SUM(p1_punches_thrown + p2_punches_thrown), 0)::NUMERIC) * 100
      ELSE 0
    END AS accuracy,
    COALESCE(SUM(p1_blocks_performed + p2_blocks_performed), 0)::BIGINT AS total_blocks,
    COALESCE(SUM(p1_damage_dealt + p2_damage_dealt), 0)::BIGINT AS total_damage_dealt
  FROM player_matches;
END;
$$ LANGUAGE plpgsql;

-- Create a secure API for the game to use
-- This is optional but recommended for production use
CREATE SCHEMA api;

-- Create a function to submit match results through the API
CREATE OR REPLACE FUNCTION api.submit_match_results(
  player_email TEXT,
  match_winner TEXT,
  match_duration NUMERIC,
  match_date TIMESTAMP WITH TIME ZONE,
  player1_stats JSONB,
  player2_stats JSONB
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO match_results (
    email, 
    winner, 
    match_duration, 
    date, 
    p1_stats, 
    p2_stats
  ) VALUES (
    player_email,
    match_winner,
    match_duration,
    match_date,
    player1_stats,
    player2_stats
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 