import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

async function generateEmbedding(text: string): Promise<number[]> {
  // Use a simple text-based embedding if OpenAI key is not available
  // This is a fallback - for production, use proper embeddings
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  
  // Helper function to generate fallback embedding
  const generateFallbackEmbedding = (inputText: string): number[] => {
    console.warn('Using fallback embedding (no OpenAI API key or API call failed)');
    const hash = inputText.split('').reduce((acc, char) => {
      const hash = ((acc << 5) - acc) + char.charCodeAt(0);
      return hash & hash;
    }, 0);
    // Return a 384-dimensional vector (common embedding size) based on text hash
    return new Array(384).fill(0).map((_, i) => 
      Math.sin((hash + i) * 0.1) * 0.1
    );
  };
  
  if (!apiKey || apiKey === '' || apiKey === 'your_openai_api_key_here') {
    return generateFallbackEmbedding(text);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('OpenAI embedding API failed:', response.status, errorText);
      // Fall back to simple embedding instead of throwing
      return generateFallbackEmbedding(text);
    }

    const data = await response.json();
    if (data.data && data.data[0] && data.data[0].embedding) {
      return data.data[0].embedding;
    }
    
    // If response format is unexpected, use fallback
    console.warn('Unexpected OpenAI response format, using fallback embedding');
    return generateFallbackEmbedding(text);
  } catch (error) {
    console.warn('Error calling OpenAI embedding API:', error);
    // Fall back to simple embedding instead of throwing
    return generateFallbackEmbedding(text);
  }
}

async function searchSimilarChunks(
  supabase: SupabaseClient,
  userId: string,
  queryEmbedding: number[],
  limit: number = 5
) {
  // Call Supabase function to match documents
  // This assumes you have a match_documents function in Supabase
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    user_id: userId,
  });

  if (error) {
    console.error('RPC error:', error);
    // Fallback: manual similarity search
    return await manualSimilaritySearch(supabase, userId, queryEmbedding, limit);
  }

  return data || [];
}

async function manualSimilaritySearch(
  supabase: SupabaseClient,
  userId: string,
  queryEmbedding: number[],
  limit: number
) {
  // Get all chunks for the user
  const { data: chunks, error } = await supabase
    .from('document_chunks')
    .select('*, documents(name)')
    .eq('user_id', userId)
    .limit(20); // Limit for better performance

  if (error || !chunks) {
    return [];
  }

  // Calculate cosine similarity (simplified)
  const chunksWithSimilarity = chunks.map((chunk: { embedding?: number[]; [key: string]: unknown }) => {
    const embedding = chunk.embedding;
    if (!embedding || !Array.isArray(embedding)) return { ...chunk, similarity: 0 };

    // Cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.min(embedding.length, queryEmbedding.length); i++) {
      dotProduct += embedding[i] * queryEmbedding[i];
      normA += embedding[i] * embedding[i];
      normB += queryEmbedding[i] * queryEmbedding[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return { ...chunk, similarity };
  });

  // Sort by similarity and return top results
  return chunksWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

async function streamChatResponse(
  question: string,
  context: string,
  sources: string[]
): Promise<ReadableStream> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Use EXACT same method as test endpoint that works
        const apiKey = process.env.OPENROUTER_API_KEY?.trim();
        
        if (!apiKey) {
          console.error('❌ OPENROUTER_API_KEY not found in environment');
          const fallbackMessage = `OpenRouter API key not found. Please add OPENROUTER_API_KEY to .env.local and restart the server.`;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: fallbackMessage })}\n\n`));
          controller.close();
          return;
        }

        // Use EXACT same headers format as test endpoint
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'AI Study Notes',
        };
        
        console.log('🚀 Chat: Making OpenRouter request');
        console.log('  - Model: meta-llama/llama-3.2-3b-instruct:free');
        console.log('  - Key length:', apiKey.length);
        console.log('  - Key preview:', apiKey.substring(0, 15) + '...');
        
        // Make the streaming request
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'meta-llama/llama-3.2-3b-instruct:free',
            messages: [
              {
                role: 'system',
                content: `You are a professional study assistant. Provide clear, structured, and well-formatted responses.

FORMATTING RULES:
- Use markdown formatting (headings with #, ##, ###)
- Use bullet points (-) and numbered lists (1., 2., 3.)
- Use **bold** for important terms and definitions
- Break content into clear sections with headings
- Keep paragraphs short (2-3 sentences max)
- Use proper spacing between sections

RESPONSE STYLE:
- Be concise and focused
- Structure information clearly
- Use headings to organize content
- Make content exam-friendly and readable
- Avoid long paragraphs
- Use lists for multiple points

If the context doesn't contain enough information, say so clearly. Always cite which documents you're using when possible.`,
              },
              {
                role: 'user',
                content: context ? `Context from documents:\n${context}\n\nQuestion: ${question}` : `Question: ${question}`,
              },
            ],
            stream: true,
          }),
        });

        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenRouter API error:', response.status);
          console.error('Error response:', errorText.substring(0, 200));
          
          let errorMessage = 'Unknown error';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorJson.error || errorText;
          } catch {
            errorMessage = errorText.substring(0, 200);
          }
          
          // Provide user-friendly error messages
          let userFriendlyError = errorMessage;
          if (response.status === 401) {
            if (errorMessage.includes('User not found') || errorMessage.includes('Invalid API key')) {
              userFriendlyError = 'Your OpenRouter API key is invalid or expired. Please check your API key at https://openrouter.ai/keys and update it in your .env.local file.';
            } else {
              userFriendlyError = `Authentication failed: ${errorMessage}. Please verify your OpenRouter API key is correct.`;
            }
          } else if (response.status === 429) {
            userFriendlyError = 'Rate limit exceeded. Please try again in a moment.';
          } else if (response.status >= 500) {
            userFriendlyError = 'OpenRouter API is currently unavailable. Please try again later.';
          }
          
          const errorMsg = `Error (${response.status}): ${userFriendlyError}`;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              // Handle [DONE] marker
              if (data === '[DONE]' || data === '') {
                // Send sources at the end
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`)
                );
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                
                // Check for errors in response
                if (parsed.error) {
                  console.error('OpenRouter API error in response:', parsed.error);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ error: parsed.error.message || 'API error', content: `Error: ${parsed.error.message || 'Unknown API error'}` })}\n\n`)
                  );
                  controller.close();
                  return;
                }
                
                // Handle streaming response - check both delta and message formats
                const content = parsed.choices?.[0]?.delta?.content || 
                               parsed.choices?.[0]?.message?.content ||
                               (parsed.choices?.[0]?.text);
                
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch (parseError) {
                // Skip invalid JSON - might be empty data lines or other non-JSON content
                if (data && data !== '[DONE]') {
                  console.warn('Skipping non-JSON line:', data.substring(0, 50));
                }
              }
            }
          }
        }

        // Send sources at the end
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`));
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get response from AI';
        const detailedError = `Error: ${errorMessage}\n\nPossible causes:\n1. Invalid or missing OpenRouter API key\n2. Network connection issue\n3. Model unavailable\n\nPlease check your .env.local file and ensure OPENROUTER_API_KEY is set correctly.`;
        
        // Stream the error message
        const words = detailedError.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: words[i] + (i < words.length - 1 ? ' ' : '') })}\n\n`)
          );
        }
        controller.close();
      }
    },
  });
}

export async function POST(request: NextRequest) {
  // Debug: Check API key at route level
  const routeLevelKey = process.env.OPENROUTER_API_KEY?.trim();
  console.log('🔍 Route handler - API key check:');
  console.log('  - Key exists:', !!routeLevelKey);
  console.log('  - Key length:', routeLevelKey?.length || 0);
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with cookie support (primary auth method for server routes)
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

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
      console.error('❌ Auth error:', authError.message);
      return new Response(JSON.stringify({ error: `Authentication failed: ${authError.message}` }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!user) {
      console.error('❌ No user found - user not authenticated');
      return new Response(JSON.stringify({ error: 'User not found. Please log in to use the chat feature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ User authenticated:', user.id);

    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);

    // Search for similar chunks
    const similarChunks = await searchSimilarChunks(supabase, user.id, questionEmbedding, 5);

    // Build context from chunks
    const context = similarChunks
      .map((chunk: { content?: string }) => chunk.content || '')
      .join('\n\n---\n\n');

    // Extract unique source document names
    const sources = Array.from(
      new Set(
        similarChunks
          .map((chunk: { documents?: { name?: string } }) => chunk.documents?.name || 'Unknown')
          .filter((name: string) => name !== 'Unknown')
      )
    ) as string[];

    // Stream response
    const stream = await streamChatResponse(question, context || 'No relevant context found.', sources);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
