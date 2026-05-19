import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Get tournament by slug
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, name, sport_id')
      .eq('slug', slug)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Get all matches for this tournament
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id, score_home, score_away, status,
        team_home: teams!team_home_id_fkey(id, name),
        team_away: teams!team_away_id_fkey(id, name)
      `)
      .eq('tournament_id', tournament.id)
      .eq('status', 'completed');

    // Calculate standings
    const standings: Record<string, {
      team_id: string
      team_name: string
      played: number
      won: number
      drawn: number
      lost: number
      goals_for: number
      goals_against: number
      points: number
    }> = {};

    matches?.forEach(match => {
      const homeId = match.team_home?.id;
      const awayId = match.team_away?.id;

      if (!homeId || !awayId) return;

      // Initialize if not exists
      if (!standings[homeId]) {
        standings[homeId] = {
          team_id: homeId,
          team_name: match.team_home?.name || 'Unknown',
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0
        };
      }
      if (!standings[awayId]) {
        standings[awayId] = {
          team_id: awayId,
          team_name: match.team_away?.name || 'Unknown',
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0
        };
      }

      // Update stats
      standings[homeId].played++;
      standings[awayId].played++;
      standings[homeId].goals_for += match.score_home;
      standings[homeId].goals_against += match.score_away;
      standings[awayId].goals_for += match.score_away;
      standings[awayId].goals_against += match.score_home;

      if (match.score_home > match.score_away) {
        standings[homeId].won++;
        standings[homeId].points += 3;
        standings[awayId].lost++;
      } else if (match.score_home < match.score_away) {
        standings[awayId].won++;
        standings[awayId].points += 3;
        standings[homeId].lost++;
      } else {
        standings[homeId].drawn++;
        standings[awayId].drawn++;
        standings[homeId].points++;
        standings[awayId].points++;
      }
    });

    // Sort by points, then goal difference
    const sortedStandings = Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goals_for - a.goals_against;
      const gdB = b.goals_for - b.goals_against;
      if (gdB !== gdA) return gdB - gdA;
      return b.goals_for - a.goals_for;
    });

    // Get top scorers
    const { data: playerStats } = await supabase
      .from('player_matches')
      .select(`
        goals,
        player: players(id, display_name, photo_url, team_id, teams: teams(name))
      `)
      .gte('goals', 1);

    // Aggregate goals by player
    const scorers: Record<string, {
      player_id: string
      player_name: string
      photo_url: string | null
      team_name: string
      team_id: string
      total_goals: number
    }> = {};

    playerStats?.forEach(stat => {
      if (!stat.player?.id || !stat.goals) return;
      const pid = stat.player.id;
      if (!scorers[pid]) {
        scorers[pid] = {
          player_id: pid,
          player_name: stat.player.display_name,
          photo_url: stat.player.photo_url,
          team_name: (stat.player as any).teams?.name || 'Unknown',
          team_id: stat.player.team_id,
          total_goals: 0
        };
      }
      scorers[pid].total_goals += stat.goals;
    });

    const topScorers = Object.values(scorers)
      .sort((a, b) => b.total_goals - a.total_goals)
      .slice(0, 10);

    return NextResponse.json({
      data: {
        tournament,
        standings: sortedStandings,
        top_scorers: topScorers
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}