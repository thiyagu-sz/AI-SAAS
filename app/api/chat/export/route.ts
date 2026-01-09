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
    // Prepare cookie-aware options as `any` to avoid TypeScript checking the 'cookies' property
    const cookieOptions: any = {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    };
    const supabase: any = createClient(supabaseUrl, supabaseAnonKey, cookieOptions);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, type, conversationId } = await request.json();

    if (!title || !content || !type || !['pdf', 'doc'].includes(type)) {
      return NextResponse.json({ error: 'Title, content, and valid type are required' }, { status: 400 });
    }

    // Save export
    const { data: exportData, error: exportError } = await supabase
      .from('chat_exports')
      .insert({
        user_id: user.id,
        conversation_id: conversationId || null,
        title: title,
        content: content,
        type: type,
      })
      .select()
      .single();

    if (exportError || !exportData) {
      console.error('Error creating export:', exportError);
      return NextResponse.json({ error: 'Failed to create export' }, { status: 500 });
    }

    return NextResponse.json({ id: exportData.id, message: 'Export created successfully' });
  } catch (error) {
    console.error('Export chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
