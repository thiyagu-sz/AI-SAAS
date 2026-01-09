import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  return NextResponse.json({
    keyExists: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyStartsWith: apiKey?.substring(0, 10) || 'N/A',
    keyFormatValid: apiKey?.startsWith('sk-or-v1-') || false,
    // Don't expose full key, just first/last few chars for verification
    keyPreview: apiKey ? `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 10)}` : 'Not set',
  });
}

