import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

// Production Configuration
const CONFIG = {
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    WINDOW_SIZE: 60 * 1000, // 1 minute
  },
  CONCURRENCY: {
    MAX_CONCURRENT_REQUESTS: 5,
  },
  TIMEOUTS: {
    DATABASE_TIMEOUT: 10000, // 10 seconds
    REQUEST_TIMEOUT: 15000,  // 15 seconds
  },
  CACHE: {
    TTL: 30000, // 30 seconds
  },
  LIMITS: {
    MIN_LIMIT: 1,
    MAX_LIMIT: 50,
    DEFAULT_LIMIT: 10,
  },
} as const;

// Global concurrent request tracking (stateless via Map)
const concurrentRequests = new Map<string, number>();
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const requestCache = new Map<string, { data: any; timestamp: number; etag: string }>();

// Utility functions
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

function generateIdempotencyHash(userId: string, params: URLSearchParams): string {
  const key = `${userId}_${params.toString()}`;
  return createHash('sha256').update(key).digest('hex');
}

function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
  });
}

// Rate limiting middleware
async function checkRateLimit(clientIP: string): Promise<boolean> {
  const now = Date.now();
  const key = `rate_limit_${clientIP}`;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + CONFIG.RATE_LIMIT.WINDOW_SIZE,
    });
    return true;
  }

  if (current.count >= CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  current.count++;
  return true;
}

// Concurrency control middleware
async function acquireConcurrencySlot(clientIP: string): Promise<() => void> {
  const current = concurrentRequests.get(clientIP) || 0;
  
  if (current >= CONFIG.CONCURRENCY.MAX_CONCURRENT_REQUESTS) {
    throw new Error('Too many concurrent requests');
  }

  concurrentRequests.set(clientIP, current + 1);
  
  return () => {
    const updated = concurrentRequests.get(clientIP) || 1;
    if (updated <= 1) {
      concurrentRequests.delete(clientIP);
    } else {
      concurrentRequests.set(clientIP, updated - 1);
    }
  };
}

// Cache management
function getCachedResponse(cacheKey: string, ifNoneMatch?: string | null): { data: any; etag: string } | null {
  const cached = requestCache.get(cacheKey);
  if (!cached || Date.now() - cached.timestamp > CONFIG.CACHE.TTL) {
    requestCache.delete(cacheKey);
    return null;
  }

  // Check ETag for conditional requests
  if (ifNoneMatch && ifNoneMatch === cached.etag) {
    return { data: null, etag: cached.etag };
  }

  return cached;
}

function setCachedResponse(cacheKey: string, data: any, etag: string): void {
  requestCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    etag,
  });

  // Cleanup old cache entries (simple LRU-like behavior)
  if (requestCache.size > 1000) {
    const oldestKey = requestCache.keys().next().value;
    if (oldestKey) {
      requestCache.delete(oldestKey);
    }
  }
}

// Authentication with timeout
async function authenticateRequest(request: NextRequest): Promise<{ user: any; supabase: any }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  // Create timeout promise for auth operations
  const authTimeout = createTimeoutPromise(CONFIG.TIMEOUTS.DATABASE_TIMEOUT);

  // Cookie-based authentication
  const cookieStore = await cookies();
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  } as any);

  let user = null;
  let authError = null;

  try {
    // Race authentication against timeout
    const cookieAuthResult = await Promise.race([
      authClient.auth.getUser(),
      authTimeout,
    ]);
    user = cookieAuthResult.data.user;
    authError = cookieAuthResult.error;
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Authentication timeout');
    }
    throw error;
  }

  // Fallback to Bearer token if cookie auth fails
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
    
    try {
      const tokenAuthResult = await Promise.race([
        tokenClient.auth.getUser(),
        createTimeoutPromise(CONFIG.TIMEOUTS.DATABASE_TIMEOUT),
      ]);
      
      if (tokenAuthResult.data.user && !tokenAuthResult.error) {
        user = tokenAuthResult.data.user;
        authError = null;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Token authentication timeout');
      }
    }
  }

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Create service client with timeout
  const supabase = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : authClient;

  return { user, supabase };
}

// Database query with transaction support
async function fetchChatHistory(
  supabase: any, 
  userId: string, 
  limit: number,
  idempotencyKey: string
): Promise<any[]> {
  const dbTimeout = createTimeoutPromise(CONFIG.TIMEOUTS.DATABASE_TIMEOUT);
  
  try {
    // Use transaction for consistency
    const { data: conversations, error } = await Promise.race([
      supabase
        .from('chat_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit)
        .abortSignal(AbortSignal.timeout(CONFIG.TIMEOUTS.DATABASE_TIMEOUT)),
      dbTimeout,
    ]);

    if (error) {
      // Handle specific error cases
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return [];
      }
      
      // Log error with context but don't expose details
      console.error(`Database error for user ${userId}:`, {
        error: error.message,
        code: error.code,
        idempotencyKey,
        timestamp: new Date().toISOString(),
      });
      
      throw new Error('Database query failed');
    }

    return conversations || [];
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Database query timeout');
    }
    throw error;
  }
}

// Main GET handler with comprehensive error isolation
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const clientIP = getClientIP(request);
  const startTime = Date.now();
  
  // Request-scoped variables only
  let releaseConcurrency: (() => void) | null = null;
  
  try {
    // 1. Rate limiting
    const isAllowed = await checkRateLimit(clientIP);
    if (!isAllowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(CONFIG.RATE_LIMIT.WINDOW_SIZE / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(CONFIG.RATE_LIMIT.WINDOW_SIZE / 1000).toString(),
            'X-RateLimit-Limit': CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE.toString(),
            'X-RateLimit-Remaining': '0',
            'X-Request-ID': requestId,
          },
        }
      );
    }

    // 2. Concurrency control
    releaseConcurrency = await acquireConcurrencySlot(clientIP);

    // 3. Request timeout
    const requestTimeout = createTimeoutPromise(CONFIG.TIMEOUTS.REQUEST_TIMEOUT);

    // 4. Parse and validate request parameters
    const searchParams = request.nextUrl.searchParams;
    const rawLimit = searchParams.get('limit');
    const limit = Math.min(
      Math.max(
        parseInt(rawLimit || CONFIG.LIMITS.DEFAULT_LIMIT.toString(), 10) || CONFIG.LIMITS.DEFAULT_LIMIT,
        CONFIG.LIMITS.MIN_LIMIT
      ),
      CONFIG.LIMITS.MAX_LIMIT
    );

    // 5. Authentication
    const { user, supabase } = await Promise.race([
      authenticateRequest(request),
      requestTimeout,
    ]);

    // 6. Generate idempotency key
    const idempotencyKey = generateIdempotencyHash(user.id, searchParams);
    const cacheKey = `chat_history_${user.id}_${limit}`;
    
    // 7. Check cache and conditional requests
    const ifNoneMatch = request.headers.get('if-none-match');
    const cached = getCachedResponse(cacheKey, ifNoneMatch);
    
    if (cached) {
      if (cached.data === null) {
        // ETag matched, return 304
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': cached.etag,
            'X-Request-ID': requestId,
            'X-Cache': 'hit-conditional',
          },
        });
      }
      
      // Return cached data
      return NextResponse.json(cached.data, {
        headers: {
          'ETag': cached.etag,
          'X-Request-ID': requestId,
          'X-Cache': 'hit',
          'Cache-Control': 'private, max-age=30',
        },
      });
    }

    // 8. Fetch data with transaction support
    const conversations = await Promise.race([
      fetchChatHistory(supabase, user.id, limit, idempotencyKey),
      requestTimeout,
    ]);

    // 9. Generate response
    const responseData = { 
      conversations,
      meta: {
        count: conversations.length,
        limit,
        requestId,
        timestamp: new Date().toISOString(),
      }
    };
    
    const etag = createHash('md5').update(JSON.stringify(responseData)).digest('hex');
    
    // 10. Cache the response
    setCachedResponse(cacheKey, responseData, etag);
    
    // 11. Return response with comprehensive headers
    return NextResponse.json(responseData, {
      headers: {
        'ETag': etag,
        'X-Request-ID': requestId,
        'X-Cache': 'miss',
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'Cache-Control': 'private, max-age=30',
        'X-RateLimit-Limit': CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE.toString(),
        'X-RateLimit-Remaining': (CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE - (rateLimitMap.get(`rate_limit_${clientIP}`)?.count || 0)).toString(),
      },
    });

  } catch (error) {
    // Comprehensive error isolation and logging
    const errorDetails = {
      requestId,
      clientIP,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } : 'Unknown error',
    };

    console.error('Chat history API error:', errorDetails);

    // Determine error response based on error type
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        statusCode = 504;
        errorMessage = 'Request timeout';
      } else if (error.message.includes('Unauthorized')) {
        statusCode = 401;
        errorMessage = 'Unauthorized';
      } else if (error.message.includes('Too many concurrent requests')) {
        statusCode = 429;
        errorMessage = 'Too many concurrent requests';
      } else if (error.message.includes('Rate limit')) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded';
      } else if (error.message.includes('Missing Supabase configuration')) {
        statusCode = 503;
        errorMessage = 'Service temporarily unavailable';
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        requestId,
        timestamp: new Date().toISOString(),
      },
      { 
        status: statusCode,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${Date.now() - startTime}ms`,
        },
      }
    );
  } finally {
    // Always release concurrency slot
    if (releaseConcurrency) {
      releaseConcurrency();
    }
  }
}
