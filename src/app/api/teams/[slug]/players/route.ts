import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/teams/[slug]/players - Public player list (privacy-safe fields only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    
    // Get team by slug
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (teamError) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    
    // Get players with PUBLIC fields only - NO DOB, NISN, address, parent contact, medical_info
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, display_name, photo_url, jersey_number, position, status')
      .eq('team_id', team.id)
      .eq('status', 'active')
      .order('jersey_number');
    
    if (playersError) {
      return NextResponse.json({ error: playersError.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { data: players },
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