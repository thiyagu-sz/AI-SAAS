import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, messages, conversationId } = await request.json();

    // Title is only required for new conversations, not updates
    if (!conversationId && (!title || title.trim() === '')) {
      return NextResponse.json({ error: 'Title is required for new conversations' }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required and must not be empty' }, { status: 400 });
    }

    let conversation;

    if (conversationId) {
      // Update existing conversation
      const { data: existingConv, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('id, title')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingConv) {
        console.error('Error fetching conversation:', fetchError);
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      conversation = existingConv;

      // Update updated_at timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Get existing messages to avoid duplicates
      const { data: existingMessages } = await supabase
        .from('chat_messages')
        .select('id, role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // Find new messages (not already in database)
      const newMessages = messages.filter((msg: { role: string; content: string }) => {
        return !existingMessages?.some(
          (existing: { role: string; content: string }) =>
            existing.role === msg.role && existing.content === msg.content
        );
      });

      if (newMessages.length > 0) {
        const messagesToInsert = newMessages.map((msg: { role: string; content: string; sources?: any }) => ({
          conversation_id: conversationId,
          role: msg.role,
          content: msg.content,
          sources: msg.sources || null,
        }));

        const { error: messagesError } = await supabase
          .from('chat_messages')
          .insert(messagesToInsert);

        if (messagesError) {
          console.error('Error inserting new messages:', messagesError);
          return NextResponse.json({ error: 'Failed to save messages' }, { status: 500 });
        }
      }
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: title,
        })
        .select()
        .single();

      if (convError || !newConv) {
        // Check if table doesn't exist (expected during initial setup)
        if (convError?.code === '42P01' || convError?.message?.includes('does not exist')) {
          console.warn('chat_conversations table does not exist yet. Please run CHAT_SCHEMA.sql in Supabase.');
          return NextResponse.json({ 
            error: 'Database table not found. Please run CHAT_SCHEMA.sql in your Supabase SQL Editor.',
            code: 'TABLE_NOT_FOUND'
          }, { status: 500 });
        }
        
        // Log other errors
        if (convError) {
          console.error('Error creating conversation:', {
            message: convError.message || 'Unknown error',
            code: convError.code || 'No code',
            details: convError.details || null,
            hint: convError.hint || null
          });
        }
        const errorMessage = convError?.message || convError?.code || 'Failed to create conversation';
        return NextResponse.json({ 
          error: 'Failed to create conversation',
          details: errorMessage 
        }, { status: 500 });
      }

      conversation = newConv;

      // Insert all messages for new conversation
      const messagesToInsert = messages.map((msg: { role: string; content: string; sources?: any }) => ({
        conversation_id: conversation.id,
        role: msg.role,
        content: msg.content,
        sources: msg.sources || null,
      }));

      const { error: messagesError } = await supabase
        .from('chat_messages')
        .insert(messagesToInsert);

      if (messagesError) {
        console.error('Error inserting messages:', {
          message: messagesError?.message || 'Unknown error',
          code: messagesError?.code || 'No code',
          details: messagesError?.details || null,
          hint: messagesError?.hint || null
        });
        // Try to delete the conversation if messages fail
        await supabase.from('chat_conversations').delete().eq('id', conversation.id);
        const errorMessage = messagesError?.message || messagesError?.code || 'Failed to save messages';
        return NextResponse.json({ 
          error: 'Failed to save messages',
          details: errorMessage 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ id: conversation.id, title: conversation.title });
  } catch (error) {
    console.error('Save chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
