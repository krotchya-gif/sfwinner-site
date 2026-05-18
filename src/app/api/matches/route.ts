import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const teamSlug = searchParams.get('team');
    
    let query = supabase
      .from('matches')
      .select(`
        id, match_date, venue, status, score_home, score_away,
        tournament: tournaments!inner(id, name, slug),
        team_home: teams!team_home_id_fkey(id, name, slug, logo_url),
        team_away: teams!team_away_id_fkey(id, name, slug, logo_url),
        age_class: age_classes!inner(name)
      `)
      .order('match_date', { ascending: false });
    
    if (teamSlug) {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('slug', teamSlug)
        .single();
      
      if (team) {
        query = query.or(`team_home_id.eq.${team.id},team_away_id.eq.${team.id}`);
      }
    }
    
    const { data, error } = await query.limit(50);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { data },
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