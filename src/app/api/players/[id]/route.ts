import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: player, error } = await supabase
      .from('players')
      .select(`
        id, display_name, photo_url, jersey_number, position, status,
        age_class:age_classes(id, name),
        team:teams(id, name, slug)
      `)
      .eq('id', id)
      .single();

    if (error || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('id, award, tournament_name, date')
      .eq('player_id', id)
      .order('date', { ascending: false });

    // Get match stats aggregated
    const { data: matchStats } = await supabase
      .from('player_matches')
      .select(`
        goals, assists, points, rebounds
      `)
      .eq('player_id', id);

    // Calculate totals
    const totals = matchStats?.reduce((acc: any, stat: any) => ({
      goals: (acc.goals || 0) + (stat.goals || 0),
      assists: (acc.assists || 0) + (stat.assists || 0),
      points: (acc.points || 0) + (stat.points || 0),
      rebounds: (acc.rebounds || 0) + (stat.rebounds || 0),
      matches_played: (acc.matches_played || 0) + 1
    }), {}) || { goals: 0, assists: 0, points: 0, rebounds: 0, matches_played: 0 };

    return NextResponse.json({
      data: {
        ...player,
        achievements: achievements || [],
        career_stats: totals
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}