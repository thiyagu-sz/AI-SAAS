import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    // Create Supabase client with cookie support (primary auth method for server routes)
    const cookieStore = await cookies();
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      } as any
    );

    // Try cookie-based auth first (most reliable for Next.js server routes)
    let user = null;
    let authError = null;
    const cookieAuthResult = await supabase.auth.getUser();
    user = cookieAuthResult.data.user;
    authError = cookieAuthResult.error;

    // If cookie auth fails, try Bearer token from header as fallback
    if ((authError || !user) && request.headers.get('Authorization')?.startsWith('Bearer ')) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader!.substring(7);
      
      // Create a client with the token in headers
      const tokenClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      
      // Try to get user with token-based client
      const tokenAuthResult = await tokenClient.auth.getUser();
      if (tokenAuthResult.data.user && !tokenAuthResult.error) {
        user = tokenAuthResult.data.user;
        authError = null;
      }
    }

    if (authError) {
      console.error('Auth error in chat history:', authError.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3');

    // Get recent conversations
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error loading chat history:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Return empty array instead of error if table doesn't exist (for initial setup)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('chat_conversations table does not exist yet');
        return NextResponse.json({ conversations: [] });
      }
      return NextResponse.json({ error: 'Failed to load chat history', details: error.message }, { status: 500 });
    }

    console.log(`Found ${conversations?.length || 0} conversations for user ${user.id}`);
    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
