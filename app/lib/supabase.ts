import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance for client-side
let supabaseInstance: SupabaseClient | null = null;

/**
 * Creates and returns a Supabase client for use in Client Components
 * Uses singleton pattern to ensure consistent session handling
 * The client is configured with proper auth persistence
 * 
 * @returns Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
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

  // Return existing instance if available (singleton pattern)
  // This ensures the same client is used throughout the app session
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new client with proper auth configuration
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Use localStorage for session storage (default)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Ensure each browser tab shares the same session
      storageKey: 'quicknotes-auth-token',
    },
  });

  return supabaseInstance;
}

/**
 * Clear the singleton instance (useful for logout)
 * Call this when user signs out to ensure clean state
 */
export function clearSupabaseClient(): void {
  supabaseInstance = null;
}

/**
 * Default export for convenience
 * Usage: import supabase from '@/app/lib/supabase'
 */
export default getSupabaseClient;

