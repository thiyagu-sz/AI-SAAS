import ProfessionalReportGenerator from './reportGenerator';

/**
 * Generates a professional HTML document from markdown for PDF conversion
 */
export const generateProfessionalHTML = (markdown: string, title: string): string => {
  // ===== CONTENT CLEANING PHASE =====
  // Use the professional report generator to clean all content
  const cleanedContent = ProfessionalReportGenerator.generate({
    title: title,
    content: markdown,
    stripUrls: true,
    stripMetadata: true,
    stripDebugText: true,
  });

  // Verify the content is clean
  const validation = ProfessionalReportGenerator.validate(cleanedContent);
  if (!validation.isClean) {
    console.warn('Content validation issues:', validation.issues);
  }

  // 2. Extract and clean title from first heading (## Heading)
  const h2Match = cleanedContent.match(/^##\s+(.+?)$/m);
  let docTitle = h2Match ? h2Match[1].trim() : (title || 'Study Notes');
  
  // Clean up marketing/UI language from title
  docTitle = docTitle
    .replace(/\b(?:overview|insights?|guide|introduction|tutorial|learn|discover|explore)\b/gi, '')
    .replace(/\b(?:latest|current|today|quick|easy|simple|powerful)\b/gi, '')
    .replace(/\b(?:AI|Chat|Tool|Platform|App|Assistant|Bot)\b/g, '')
    .replace(/[📚🎓📖✨🚀]/g, '') // Remove emojis
    .trim();
  
  // If title became too short, use a sensible default
  if (docTitle.length < 3) {
    docTitle = 'Study Notes';
  }
  
  // Limit to 12 words
  const titleWords = docTitle.split(/\s+/).slice(0, 12).join(' ');
  const finalDocTitle = titleWords;

  // 3. Extract intro paragraph (first non-heading, non-empty, non-URL line)
  const introLines = cleanedContent
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('#') && 
             !trimmed.startsWith('>') &&
             !trimmed.startsWith('-') &&
             !trimmed.startsWith('*') &&
             !trimmed.startsWith('|') &&
             trimmed.length > 5; // Ensure meaningful content
    });
  const introParagraph = introLines[0]?.substring(0, 200) || 'Professional Study Notes';

  // ===== MARKDOWN TO HTML PARSING PHASE =====
  let htmlContent = cleanedContent
    // First, sanitize HTML special chars
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Remove any remaining URLs from HTML content
    .replace(/https?:\/\/[^\s<>&"']+/g, '')
    .replace(/www\.[^\s<>&"']+/g, '');

  // Remove H1 headings (# Heading)
  htmlContent = htmlContent.replace(/^#\s+.+?$/gm, '');

  // Convert H2 (##) to <h2> and remove the ## prefix
  htmlContent = htmlContent.replace(/^##\s+(.+?)$/gm, '<h2>$1</h2>');

  // Convert H3 (###) to <h3> and remove the ### prefix
  htmlContent = htmlContent.replace(/^###\s+(.+?)$/gm, '<h3>$1</h3>');

  // Convert bold (**text**) to <strong>
  htmlContent = htmlContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Convert italic (*text*) to <em>
  htmlContent = htmlContent.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Convert reference numbers [1] to superscript
  htmlContent = htmlContent.replace(/\[(\d+)\]/g, '<sup>$1</sup>');

  // Convert blockquotes (> text)
  htmlContent = htmlContent.replace(/^&gt;\s+(.+?)$/gm, '<blockquote>$1</blockquote>');

  // Handle tables
  htmlContent = htmlContent.replace(/((?:\|.+\|\n?)+)/g, (tableMatch) => {
    const rows = tableMatch.trim().split('\n').filter(r => r.trim() && !r.includes('---'));
    if (rows.length === 0) return '';
    let tableHtml = '<table><tbody>';
    rows.forEach((row, idx) => {
      const cells = row.split('|').filter(c => c.trim());
      const tag = idx === 0 ? 'th' : 'td';
      tableHtml += `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`;
    });
    return tableHtml + '</tbody></table>';
  });

  // Convert unordered list items (- or * at start of line)
  htmlContent = htmlContent.replace(/^\s*[-•]\s+(.+?)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> items in <ul>
  htmlContent = htmlContent.replace(/(<li>[^<]*<\/li>(\n<li>[^<]*<\/li>)*)/g, (match) => `<ul>${match}</ul>`);

  // Remove duplicate <ul> wrappers
  htmlContent = htmlContent.replace(/<\/ul>\s*<ul>/g, '');

  // Remove underscore formatting (_text_)
  htmlContent = htmlContent.replace(/_(.+?)_/g, '$1');

  // Remove backticks (code formatting)
  htmlContent = htmlContent.replace(/`(.+?)`/g, '$1');

  // Clean up extra whitespace and newlines
  htmlContent = htmlContent
    .replace(/\n\n+/g, '</p><p>')  // Multiple newlines become paragraph breaks
    .replace(/\n/g, ' ')            // Single newlines become spaces
    .trim();

  // Wrap any remaining text in paragraphs
  if (!htmlContent.match(/<p>/) && htmlContent.trim()) {
    htmlContent = `<p>${htmlContent}</p>`;
  }

  // Convert to tile layout - group h2 headings with content
  const tileRegex = /<h2>(.+?)<\/h2>([\s\S]*?)(?=<h2>|$)/g;
  let tiledContent = '';
  let match;
  
  while ((match = tileRegex.exec(htmlContent)) !== null) {
    const heading = match[1];
    const content = match[2].trim();
    tiledContent += `<h2>${heading}</h2><div class="tile">${content}</div>`;
  }
  
  // If no h2 headings found, wrap all content in tiles
  if (!tiledContent) {
    const contentBlocks = htmlContent.split('<h3>');
    tiledContent = contentBlocks.map((block, idx) => {
      if (idx === 0) return block;
      return `<div class="tile"><h3>${block}</div>`;
    }).join('');
  }

  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const htmlDocument = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${finalDocTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      font-family: -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      margin: 0;
      padding: 0;
    }

    .page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      background: white;
      position: relative;
    }

    .cover-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 297mm;
      padding: 60px 40px;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      page-break-after: always;
    }

    .logo-container {
      margin-bottom: 40px;
    }

    .logo-svg {
      width: 120px;
      height: 120px;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));
    }

    .cover-title {
      font-size: 42pt;
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
      margin: 30px 0;
      line-height: 1.3;
      max-width: 600px;
    }

    .cover-subtitle {
      font-size: 14pt;
      color: #666;
      text-align: center;
      margin: 20px 0 40px 0;
      line-height: 1.6;
      max-width: 500px;
    }

    .cover-date {
      font-size: 11pt;
      color: #999;
      margin-top: 40px;
    }

    .content-page {
      padding: 50px 45px;
      page-break-inside: avoid;
    }

    h2 {
      font-size: 18pt;
      font-weight: 700;
      color: #1a1a1a;
      margin: 30px 0 15px 0;
      page-break-after: avoid;
      border-bottom: 2px solid #5e4eff;
      padding-bottom: 10px;
    }

    h3 {
      font-size: 13pt;
      font-weight: 600;
      color: #2a2a2a;
      margin: 20px 0 10px 0;
      page-break-after: avoid;
    }

    p {
      margin: 12px 0;
      text-align: justify;
      color: #333;
    }

    ul {
      margin: 15px 0 15px 30px;
    }

    li {
      margin: 8px 0;
      color: #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    th {
      background: #5e4eff;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 10px;
      border-bottom: 1px solid #e0e0e0;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    blockquote {
      margin: 20px 0;
      padding: 15px 20px;
      border-left: 4px solid #5e4eff;
      background: #f9f7ff;
      color: #555;
    }

    strong {
      color: #1a1a1a;
      font-weight: 600;
    }

    em {
      font-style: italic;
      color: #555;
    }

    sup {
      font-size: 0.8em;
    }

    @media print {
      body {
        padding: 0;
        margin: 0;
      }

      .page {
        margin: 0;
      }

      .cover-page {
        page-break-after: always;
      }

      h2 {
        page-break-after: avoid;
      }

      h3 {
        page-break-after: avoid;
      }

      p, li, td, blockquote {
        page-break-inside: avoid;
      }

      a {
        color: inherit;
        text-decoration: none;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="logo-container">
      <svg class="logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <!-- Geometric cube inspired by QuickNotes logo -->
        <defs>
          <linearGradient id="cubeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#5e4eff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0084ff;stop-opacity:1" />
          </linearGradient>
        </defs>
        <!-- Cube faces -->
        <polygon points="30,20 70,20 85,35 45,35" fill="url(#cubeGradient)" opacity="0.9"/>
        <polygon points="70,20 85,35 85,75 70,60" fill="#4a3fd9" opacity="0.8"/>
        <polygon points="30,20 45,35 45,75 30,60" fill="#6e5dff" opacity="0.7"/>
        <polygon points="45,35 85,35 85,75 45,75" fill="url(#cubeGradient)" opacity="0.6"/>
        <polygon points="30,60 45,75 85,75 70,60" fill="#3a2fcf" opacity="0.85"/>
      </svg>
    </div>
    
    <h1 class="cover-title">${finalDocTitle}</h1>
    <p class="cover-subtitle">${introParagraph}</p>
    <p class="cover-date">Generated: ${dateStr}</p>
  </div>

  <!-- Content Pages -->
  <div class="content-page">
    ${tiledContent}
  </div>
</body>
</html>
    `;

  return htmlDocument;
};
