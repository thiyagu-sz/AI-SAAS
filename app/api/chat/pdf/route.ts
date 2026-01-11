import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    let browser;
    
    try {
      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
        ],
      });

      // Create a new page
      const page = await browser.newPage();
      
      // Set viewport and disable javascript if not needed
      await page.setViewport({ width: 1200, height: 1600 });

      // Set the HTML content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF without any headers/footers
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '25mm',
          bottom: '25mm',
          left: '25mm',
          right: '25mm',
        },
        printBackground: true,
        scale: 1,
        // This is the key - don't display headers at all
        displayHeaderFooter: false,
      });

      // Close the browser
      await page.close();

      // Return PDF as a file download
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename || 'document.pdf'}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
