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
      .select('id')
      .eq('slug', slug)
      .single();

    if (tournamentError) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Get age_class_id from query if provided
    const { searchParams } = new URL(request.url);
    const ageClassId = searchParams.get('age_class_id');

    // Build query for player stats
    let query = supabase
      .from('player_tournament_stats')
      .select(`
        id, goals, assists, yellow_cards, red_cards,
        player:players!inner(
          id, display_name, photo_url, jersey_number, position,
          team:teams!inner(id, name, slug),
          age_class:age_classes!inner(id, name)
        )
      `)
      .eq('tournament_id', tournament.id);

    if (ageClassId) {
      query = query.eq('age_class_id', ageClassId);
    }

    const { data: stats } = await query;

    // Get all age classes for this tournament's sport
    const { data: ageClasses } = await supabase
      .from('age_classes')
      .select('id, name')
      .eq('team_id', (await getTeamIdForTournament(supabase, tournament.id)));

    // Sort by goals desc, then assists desc
    const sortedStats = (stats || []).sort((a: any, b: any) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return b.assists - a.assists;
    });

    // Add rank
    sortedStats.forEach((s: any, index: number) => {
      s.rank = index + 1;
    });

    return NextResponse.json(
      {
        data: {
          tournament_id: tournament.id,
          stats: sortedStats,
          age_classes: ageClasses || [],
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

async function getTeamIdForTournament(supabase: any, tournamentId: string): Promise<string | null> {
  const { data } = await supabase
    .from('tournaments')
    .select('sport_id')
    .eq('id', tournamentId)
    .single();

  if (!data?.sport_id) return null;

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('sport_id', data.sport_id)
    .limit(1)
    .single();

  return team?.id || null;
}