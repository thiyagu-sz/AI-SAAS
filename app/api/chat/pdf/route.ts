import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Convert HTML to plain text and create a simple text file instead
    // This is a fallback approach that works reliably without heavy dependencies
    
    // Strip HTML tags
    const textContent = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\n+/g, '\n\n')
      .trim();

    // Create a simple text document as fallback
    const textBuffer = Buffer.from(textContent, 'utf-8');

    return new NextResponse(textBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename?.replace('.pdf', '.txt') || 'document.txt'}"`,
        'Content-Length': textBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF/Text generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate document';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
