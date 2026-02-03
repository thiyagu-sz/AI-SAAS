const fs = require('fs');
const path = require('path');

async function testPdfGeneration() {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563eb; }
          p { line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Test Study Notes</h1>
        <p>This is a test PDF generation to verify if Puppeteer is working correctly.</p>
        <ul>
          <li>Key Point 1: PDF generation should work.</li>
          <li>Key Point 2: Fallback should be valid if Puppeteer fails.</li>
        </ul>
      </body>
    </html>
  `;

  console.log('Starting PDF generation test...');

  try {
    const puppeteer = require('puppeteer');
    console.log('Puppeteer loaded successfully.');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('Browser launched.');

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
    });
    console.log('PDF generated via Puppeteer.');

    await browser.close();

    fs.writeFileSync('test-output-puppeteer.pdf', pdfBuffer);
    console.log('Saved test-output-puppeteer.pdf');

  } catch (error) {
    console.error('Puppeteer failed:', error.message);
    
    console.log('Trying fallback to jspdf...');
    try {
      const { jsPDF } = require('jspdf');
      const doc = new jsPDF();
      
      const textContent = html.replace(/<[^>]*>/g, '').trim();
      doc.text(textContent, 10, 10);
      const pdfData = doc.output();
      fs.writeFileSync('test-output-jspdf.pdf', pdfData, 'binary');
      console.log('Saved test-output-jspdf.pdf');
    } catch (jspdfError) {
      console.error('jsPDF fallback failed:', jspdfError.message);
    }
  }
}

testPdfGeneration();
