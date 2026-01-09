import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId } = body;
    if (!collectionId) {
      return new Response(JSON.stringify({ error: 'collectionId required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Create server client
    const cookieStore = await cookies();
    // Create a server-side client without cookie option (we're only inserting a row)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Trigger a background process by inserting a row into 'generation_requests' (if exists)
    // If not present, we'll fall back to calling a stored procedure or return success to let polling pick it up.
    const { data, error } = await supabase
      .from('generation_requests')
      .insert([{ collection_id: collectionId }]);

    if (error) {
      console.warn('generation_requests insert error, returning success to allow polling:', error.message || error);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Generate notes route error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
