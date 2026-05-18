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

    // Get all matches for this tournament
    const { data: matches } = await supabase
      .from('matches')
      .select('team_home_id, team_away_id, score_home, score_away, status')
      .eq('tournament_id', tournament.id)
      .eq('status', 'completed');

    // Get participants
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('team_id, teams(id, name, slug, logo_url)')
      .eq('tournament_id', tournament.id);

    // Calculate standings
    const standings: Record<string, any> = {};

    // Initialize standings for each team
    participants?.forEach((p: any) => {
      const team = p.teams;
      standings[team.id] = {
        team_id: team.id,
        team_name: team.name,
        team_slug: team.slug,
        team_logo_url: team.logo_url,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      };
    });

    // Process matches
    matches?.forEach((match: any) => {
      // Home team stats
      if (standings[match.team_home_id]) {
        const home = standings[match.team_home_id];
        home.played += 1;
        home.goals_for += match.score_home || 0;
        home.goals_against += match.score_away || 0;

        if (match.score_home > match.score_away) {
          home.won += 1;
          home.points += 3;
        } else if (match.score_home === match.score_away) {
          home.drawn += 1;
          home.points += 1;
        } else {
          home.lost += 1;
        }
      }

      // Away team stats (if team_away_id exists)
      if (match.team_away_id && standings[match.team_away_id]) {
        const away = standings[match.team_away_id];
        away.played += 1;
        away.goals_for += match.score_away || 0;
        away.goals_against += match.score_home || 0;

        if (match.score_away > match.score_home) {
          away.won += 1;
          away.points += 3;
        } else if (match.score_away === match.score_home) {
          away.drawn += 1;
          away.points += 1;
        } else {
          away.lost += 1;
        }
      }
    });

    // Calculate goal difference and sort by points
    const standingsArray = Object.values(standings).map((s: any) => ({
      ...s,
      goal_difference: s.goals_for - s.goals_against,
    }));

    standingsArray.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });

    // Add rank
    standingsArray.forEach((s: any, index: number) => {
      s.rank = index + 1;
    });

    return NextResponse.json(
      {
        data: {
          tournament_id: tournament.id,
          standings: standingsArray,
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