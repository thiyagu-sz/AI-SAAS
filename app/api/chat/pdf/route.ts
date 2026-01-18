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

    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        printBackground: true,
      });

      await browser.close();

      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename || 'document.pdf'}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (puppeteerError) {
      console.log('Puppeteer PDF generation failed, using text fallback:', puppeteerError);
    }

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
