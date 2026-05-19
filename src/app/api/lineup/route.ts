import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');

    if (!matchId) {
      return NextResponse.json({ error: 'match_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('match_lineups')
      .select(`
        id, position, is_starter,
        player: players(id, display_name, jersey_number, photo_url)
      `)
      .eq('match_id', matchId)
      .order('position', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (userData.role !== 'super_admin' && userData.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { match_id, player_id, position, is_starter } = body;

    if (!match_id || !player_id) {
      return NextResponse.json({ error: 'match_id and player_id are required' }, { status: 400 });
    }

    // Check if lineup entry already exists
    const { data: existing } = await supabase
      .from('match_lineups')
      .select('id')
      .eq('match_id', match_id)
      .eq('player_id', player_id)
      .single();

    let data, error;

    if (existing) {
      // Update existing
      const updateData: any = {};
      if (position !== undefined) updateData.position = position;
      if (is_starter !== undefined) updateData.is_starter = is_starter;

      ({ data, error } = await supabase
        .from('match_lineups')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      // Insert new
      ({ data, error } = await supabase
        .from('match_lineups')
        .insert({
          match_id,
          player_id,
          position: position || 0,
          is_starter: is_starter !== undefined ? is_starter : true
        })
        .select()
        .single());
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    if (userData.role !== 'super_admin' && userData.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const lineupId = searchParams.get('id');

    if (!lineupId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('match_lineups')
      .delete()
      .eq('id', lineupId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}