import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface FeedbackPayload {
  userId?: string;
  email: string;
  message: string;
  timestamp?: string;
  rating?: number;
  category?: string;
  title?: string;
  features?: string[];
  improvements?: string;
  wouldRecommend?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackPayload = await request.json();

    // Validation
    if (!body.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Note: Ensure feedback table exists in your Supabase database before deploying
    // The table will be created via direct SQL in Supabase dashboard if it doesn't exist

    // Insert feedback with user_id
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          user_id: body.userId || null,
          email: body.email.trim(),
          message: body.message.trim(),
        },
      ])
      .select();

    if (error) {
      console.error('Feedback insertion error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // If table doesn't exist, provide helpful error
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('feedback')) {
        return NextResponse.json(
          { 
            error: 'Feedback system not yet initialized. Run SQL schema in Supabase first.',
            details: 'feedback table not found - run FEEDBACK_SCHEMA.sql in Supabase SQL Editor',
            code: error.code,
            message: error.message
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to submit feedback', details: error.message },
        { status: 500 }
      );
    }

    // Log feedback submission (optional analytics)
    console.log('Feedback submitted:', {
      id: data?.[0]?.id,
      category: body.category,
      rating: body.rating,
      email: body.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedbackId: data?.[0]?.id,
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch feedback stats (admin only)
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check for admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.includes('Bearer')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch feedback stats
    const { data, error } = await supabase
      .from('feedback')
      .select('rating, category, created_at');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch feedback stats' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      averageRating: data?.length
        ? (data.reduce((sum, item) => sum + (item.rating || 0), 0) / data.length).toFixed(2)
        : 0,
      categoryBreakdown: data?.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      recentFeedback: data?.slice(-5) || [],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Feedback stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
