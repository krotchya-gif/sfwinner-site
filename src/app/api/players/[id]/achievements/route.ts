import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid player ID format' }, { status: 400 });
    }
    
    // Get player (verify exists)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, display_name')
      .eq('id', id)
      .single();
    
    if (playerError) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    // Get achievements (public fields only)
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('id, tournament_name, description, award, date')
      .eq('player_id', id)
      .order('date', { ascending: false });
    
    if (achievementsError) {
      return NextResponse.json({ error: achievementsError.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { 
        data: {
          player_id: id,
          player_name: player.display_name,
          achievements: achievements || []
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