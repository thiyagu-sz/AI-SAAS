import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found' }, { status: 500 });
  }

  try {
    // Test the API key with a simple request
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Study Notes Test',
      },
      body: JSON.stringify({
        // Try multiple models to see which one works
        model: 'meta-llama/llama-3.2-3b-instruct:free', // Try this first - more commonly available
        messages: [
          {
            role: 'user',
            content: 'Hello, say hi back in one word.',
          },
        ],
      }),
    });

    const responseText = await response.text();
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      response: responseText.substring(0, 500), // First 500 chars
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

