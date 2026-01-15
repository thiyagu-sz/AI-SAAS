import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    // Create Supabase client with cookie support for AUTH
    const cookieStore = await cookies();
    const authClient = createClient(
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

    // Try cookie-based auth first
    let user = null;
    let authError = null;
    const cookieAuthResult = await authClient.auth.getUser();
    user = cookieAuthResult.data.user;
    authError = cookieAuthResult.error;

    // If cookie auth fails, try Bearer token from header as fallback
    if ((authError || !user) && request.headers.get('Authorization')?.startsWith('Bearer ')) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader!.substring(7);
      
      const tokenClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      
      const tokenAuthResult = await tokenClient.auth.getUser();
      if (tokenAuthResult.data.user && !tokenAuthResult.error) {
        user = tokenAuthResult.data.user;
        authError = null;
      }
    }

    if (authError || !user) {
      console.error('Auth error in chat delete:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[chat/delete] User authenticated:', user.id);

    // Use service role key for database operations (bypasses RLS)
    const supabase = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false }
        })
      : authClient;

    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // First verify the conversation belongs to this user
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Delete messages first (foreign key constraint)
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
    }

    // Then delete the conversation
    const { error: deleteError } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError);
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }

    console.log('[chat/delete] Successfully deleted conversation:', conversationId);

    return NextResponse.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
