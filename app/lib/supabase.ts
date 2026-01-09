import { createClient } from '@supabase/supabase-js';

/**
 * Creates and returns a Supabase client for use in Client Components
 * This client is configured with the Supabase URL and anon key from environment variables
 * The environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are automatically read from .env.local
 * 
 * @returns Supabase client instance
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that will fail gracefully
    // This prevents the app from crashing during development
    console.warn('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    // Return a client with placeholder values that will show errors but won't crash
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(`Invalid Supabase URL: ${supabaseUrl}. Must be a valid HTTP or HTTPS URL.`);
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Default export for convenience
 * Usage: import supabase from '@/app/lib/supabase'
 * Note: This is a function that creates a new client instance each time it's called
 */
export default getSupabaseClient;

