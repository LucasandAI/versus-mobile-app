-- Create or replace the view for full match information
CREATE OR REPLACE VIEW public.view_full_match_info AS
SELECT 
    m.id,
    m.created_at,
    m.updated_at,
    m.start_date,
    m.end_date,
    m.status,
    m.home_club_id,
    home_club.name AS home_club_name,
    home_club.logo AS home_club_logo,
    m.away_club_id,
    away_club.name AS away_club_name,
    away_club.logo AS away_club_logo,
    m.home_score,
    m.away_score,
    m.league_id,
    l.name AS league_name,
    l.name_before_match AS league_name_before_match,
    l.name_after_match AS league_name_after_match,
    m.division,
    m.tier,
    m.is_playoff,
    m.playoff_round,
    m.winner_club_id,
    m.loser_club_id,
    m.home_stats,
    m.away_stats,
    m.metadata
FROM 
    matches m
LEFT JOIN 
    clubs home_club ON m.home_club_id = home_club.id
LEFT JOIN 
    clubs away_club ON m.away_club_id = away_club.id
LEFT JOIN
    leagues l ON m.league_id = l.id;

-- Grant permissions
GRANT SELECT ON public.view_full_match_info TO authenticated, anon;

-- Add a comment
COMMENT ON VIEW public.view_full_match_info IS 'Comprehensive view of match information including club and league details';
