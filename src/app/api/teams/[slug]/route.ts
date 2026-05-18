import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    
    // Get team info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        id, name, slug, logo_url, branch_location,
        sport: sports!inner(id, name, slug, logo_url)
      `)
      .eq('slug', slug)
      .single();
    
    if (teamError) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Get public player fields only
    const { data: players } = await supabase
      .from('players')
      .select('id, display_name, photo_url, jersey_number, position, status')
      .eq('team_id', team.id)
      .eq('status', 'active')
      .order('jersey_number');
    
    // Get achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('id, tournament_name, description, award, date')
      .in('player_id', (players || []).map((p: any) => p.id))
      .order('date', { ascending: false });
    
    // Get recent matches (last 5)
    const { data: recentMatches } = await supabase
      .from('matches')
      .select(`
        id, match_date, venue, status, score_home, score_away,
        tournament: tournaments!inner(name),
        team_home: teams!team_home_id_fkey(name, slug),
        team_away: teams!team_away_id_fkey(name, slug)
      `)
      .or(`team_home_id.eq.${team.id},team_away_id.eq.${team.id}`)
      .order('match_date', { ascending: false })
      .limit(5);
    
    return NextResponse.json(
      { 
        data: {
          ...team,
          players: players || [],
          achievements: achievements || [],
          recent_matches: recentMatches || []
        }
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}