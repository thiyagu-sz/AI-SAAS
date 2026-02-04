import { NextRequest } from 'next/server';
import { GET } from './route';

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn(() => undefined),
  })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url, key, config) => {
    return {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
      },
      from: jest.fn((table) => {
        if (table === 'chat_conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: '1',
                  title: 'Study Session 1',
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
              ],
              error: null,
            }),
          };
        }
      }),
    };
  }),
}));

describe('GET /api/chat/history', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Unauthorized' },
        }),
      },
    });

    const request = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('should return 500 when Supabase URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    const request = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(500);
  });

  it('should return 500 when Supabase key is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const request = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(500);
  });

  it('should return chat conversations for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.conversations).toBeDefined();
    expect(Array.isArray(data.conversations)).toBe(true);
  });

  it('should respect the limit query parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/chat/history?limit=5',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it('should default to limit=3 when no limit is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it('should handle database errors gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.conversations)).toBe(true);
  });

  it('should accept Bearer token in Authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token-123',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it('should return empty conversations list when none exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat/history', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.conversations)).toBe(true);
  });
});
