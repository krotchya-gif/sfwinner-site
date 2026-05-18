import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    
    // Get tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        id, name, slug, description, location, start_date, end_date,
        sport: sports!inner(id, name, slug, logo_url)
      `)
      .eq('slug', slug)
      .single();
    
    if (tournamentError) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    
    // Get matches for this tournament
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id, match_date, venue, status, score_home, score_away,
        team_home: teams!team_home_id_fkey(id, name, slug, logo_url),
        team_away: teams!team_away_id_fkey(id, name, slug, logo_url),
        age_class: age_classes!inner(name)
      `)
      .eq('tournament_id', tournament.id)
      .order('match_date', { ascending: true });
    
    return NextResponse.json(
      { 
        data: {
          ...tournament,
          matches: matches || []
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