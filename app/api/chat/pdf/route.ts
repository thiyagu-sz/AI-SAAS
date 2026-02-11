import { NextRequest, NextResponse } from 'next/server';
import { ProfessionalPdfGenerator } from '@/app/lib/professionalPdfGenerator';

/**
 * CORS preflight handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Production-safe PDF generation endpoint for Vercel serverless
 * Uses jsPDF for pure JavaScript rendering without Puppeteer/Chromium
 * 
 * FEATURES:
 * - No external binary dependencies (works on Vercel)
 * - Professional styling with branding
 * - Proper page breaks and layout
 * - Handles MCQs, summaries, and exam notes
 * - Fast performance for large documents
 */
export async function POST(request: NextRequest) {
  try {
    const { markdown, title, filename } = await request.json();

    if (!markdown) {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    if (markdown.length > 500000) {
      return NextResponse.json(
        { error: 'Content too large (max 500KB)' },
        { status: 413 }
      );
    }

    // Generate PDF using the professional generator
    const generator = new ProfessionalPdfGenerator({
      brandColor: '#5e4eff', // QuickNotes brand color
    });

    const pdfBuffer = generator.generate({
      title: title || 'Study Notes',
      content: markdown,
      author: 'QuickNotes',
    });

    // Prepare response headers
    const cleanFilename = (filename || 'quicknotes-study-material')
      .replace(/[^a-z0-9._-]/gi, '_')
      .substring(0, 100) + '.pdf';

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${cleanFilename}"`);
    headers.set('Content-Length', pdfBuffer.byteLength.toString());
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Content-Security-Policy', 'default-src self');
    headers.set('X-Content-Type-Options', 'nosniff');

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('PDF generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
    const errorDetails = error instanceof Error ? error.stack : 'Unknown error';

    // Log error for debugging (Vercel logs)
    console.error('Error details:', {
      message: errorMessage,
      stack: errorDetails,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}