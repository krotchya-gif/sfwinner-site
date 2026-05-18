import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('sports')
      .select('id, name, slug, logo_url, short_name')
      .eq('slug', slug)
      .single();
    
    if (error) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 });
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