import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
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

    // Get attendance records
    let query = supabase
      .from('attendance')
      .select(`
        id, event_type, event_name, event_date, status, notes,
        player: players(id, display_name, jersey_number, photo_url)
      `)
      .order('event_date', { ascending: false });

    // Filter by team if not super_admin
    if (userData.role !== 'super_admin' && userData.team_id) {
      const { data: playerIds } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', userData.team_id);

      if (playerIds && playerIds.length > 0) {
        query = query.in('player_id', playerIds.map(p => p.id));
      }
    }

    const { data, error } = await query;

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
    const { player_id, event_type, event_name, event_date, status, notes } = body;

    if (!player_id || !event_type || !event_name || !event_date || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        player_id,
        event_type,
        event_name,
        event_date,
        status,
        notes: notes || null
      })
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