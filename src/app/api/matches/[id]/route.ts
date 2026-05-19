import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, match_date, venue, status, score_home, score_away, age_class_id,
        tournament: tournaments!inner(id, name, slug, sport_id),
        team_home: teams!team_home_id_fkey(id, name, slug, logo_url),
        team_away: teams!team_away_id_fkey(id, name, slug, logo_url),
        age_class: age_classes(name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const { data: playerStats } = await supabase
      .from('player_matches')
      .select(`
        id, goals, assists, points, rebounds, minutes_played, rating,
        player: players(id, display_name, jersey_number, photo_url)
      `)
      .eq('match_id', id);

    return NextResponse.json({
      data: {
        ...data,
        player_stats: playerStats || []
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .eq('id', id)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (userData.role !== 'super_admin' && match.team_home_id !== userData.team_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.score_home !== undefined) updateData.score_home = body.score_home;
    if (body.score_away !== undefined) updateData.score_away = body.score_away;
    if (body.match_date !== undefined) updateData.match_date = body.match_date;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.age_class_id !== undefined) updateData.age_class_id = body.age_class_id || null;

    const { data, error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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
      .eq('id', id)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (userData.role !== 'super_admin' && match.team_home_id !== userData.team_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await supabase.from('player_matches').delete().eq('match_id', id);

    const { error } = await supabase.from('matches').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}