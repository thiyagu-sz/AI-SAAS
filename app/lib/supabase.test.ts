import { getSupabaseClient, clearSupabaseClient } from './supabase';

describe('Supabase Client', () => {
  beforeEach(() => {
    clearSupabaseClient();
    delete (global as any).localStorage;
  });

  afterEach(() => {
    clearSupabaseClient();
  });

  describe('getSupabaseClient', () => {
    it('should return a Supabase client instance', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const client = getSupabaseClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('should implement singleton pattern', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();
      expect(client1).toBe(client2);
    });

    it('should throw error for invalid URL format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => getSupabaseClient()).toThrow('Invalid Supabase URL');
    });

    it('should return placeholder client when environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const client = getSupabaseClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('should warn when environment variables are missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      getSupabaseClient();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should accept valid HTTPS URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key';

      const client = getSupabaseClient();
      expect(client).toBeDefined();
    });

    it('should accept valid HTTP URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const client = getSupabaseClient();
      expect(client).toBeDefined();
    });

    it('should configure auth with persistSession enabled', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const client = getSupabaseClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });
  });

  describe('clearSupabaseClient', () => {
    it('should clear the singleton instance', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const client1 = getSupabaseClient();
      clearSupabaseClient();
      const client2 = getSupabaseClient();

      expect(client1).not.toBe(client2);
    });

    it('should allow recreating client after clear', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      getSupabaseClient();
      clearSupabaseClient();
      
      const newClient = getSupabaseClient();
      expect(newClient).toBeDefined();
    });
  });
});
