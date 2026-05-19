import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single() as any;

    const { data: match } = await supabase
      .from('matches')
      .select('team_home_id')
      .eq('id', matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (userData.role !== 'super_admin' && match.team_home_id !== userData.team_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { player_stats } = body as {
      player_stats: Array<{
        player_id: string
        goals: number
        assists: number
        points: number
        rebounds: number
        minutes_played: number | null
        rating: number | null
      }>
    };

    if (!player_stats || !Array.isArray(player_stats)) {
      return NextResponse.json({ error: 'player_stats is required' }, { status: 400 });
    }

    // Update or insert player stats
    for (const stat of player_stats) {
      // Check if player_match exists
      const { data: existing } = await supabase
        .from('player_matches')
        .select('id')
        .eq('match_id', matchId)
        .eq('player_id', stat.player_id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('player_matches')
          .update({
            goals: stat.goals || 0,
            assists: stat.assists || 0,
            points: stat.points || 0,
            rebounds: stat.rebounds || 0,
            minutes_played: stat.minutes_played,
            rating: stat.rating,
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating player stat:', error);
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('player_matches')
          .insert({
            match_id: matchId,
            player_id: stat.player_id,
            goals: stat.goals || 0,
            assists: stat.assists || 0,
            points: stat.points || 0,
            rebounds: stat.rebounds || 0,
            minutes_played: stat.minutes_played,
            rating: stat.rating,
          });

        if (error) {
          console.error('Error inserting player stat:', error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}