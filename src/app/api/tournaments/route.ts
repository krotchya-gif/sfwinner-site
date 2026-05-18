import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const sportSlug = searchParams.get('sport');
    
    let query = supabase
      .from('tournaments')
      .select(`
        id, name, slug, description, location, start_date, end_date,
        sport: sports!inner(id, name, slug)
      `)
      .order('start_date', { ascending: false });
    
    if (sportSlug) {
      query = query.eq('sport.slug', sportSlug);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { data },
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