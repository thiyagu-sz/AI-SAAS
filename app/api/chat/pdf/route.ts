import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { markdown, title, filename } = await request.json();

    if (!markdown) {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      );
    }

    // Import jsPDF dynamically (Vercel-compatible)
    const { jsPDF } = await import('jspdf');

    // Create new PDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    let currentY = margin;
    const lineHeight = 7;
    const defaultFontSize = 11;

    // Helper function to add page break if needed
    const checkPageBreak = (requiredSpace: number = lineHeight) => {
      if (currentY + requiredSpace > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        addPageFooter();
        return true;
      }
      return false;
    };

    // Helper function to add footer
    const addPageFooter = () => {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        'Generated using QuickNotes — AI Study Assistant | www.quicknotess.space',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);
    };

    // Helper function to wrap text
    const addWrappedText = (text: string, fontSize: number = defaultFontSize, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = doc.splitTextToSize(text, contentWidth);
      for (const line of lines) {
        checkPageBreak();
        doc.text(line, margin, currentY);
        currentY += lineHeight;
      }
    };

    // Add QuickNotes Logo (ASCII art style)
    const addLogo = () => {
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(94, 79, 255); // QuickNotes brand color
      doc.text('📚 QuickNotes', pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text('AI-Powered Study Assistant', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
      doc.setTextColor(0, 0, 0);
    };

    // Add title page
    addLogo();
    
    // Document title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    const titleLines = doc.splitTextToSize(title || 'Study Notes', contentWidth);
    for (const titleLine of titleLines) {
      checkPageBreak(15);
      doc.text(titleLine, pageWidth / 2, currentY, { align: 'center' });
      currentY += 12;
    }
    
    currentY += 10;
    
    // Date
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
    doc.text(`Generated: ${today}`, pageWidth / 2, currentY, { align: 'center' });
    
    // Add horizontal line
    currentY += 20;
    doc.setDrawColor(94, 79, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 20;

    // Parse markdown content
    const lines = markdown.split('\n');
    let inList = false;
    let inTable = false;
    let tableData: string[][] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        currentY += lineHeight / 2;
        continue;
      }

      // Handle tables
      if (trimmedLine.includes('|')) {
        if (!inTable) {
          inTable = true;
          tableData = [];
        }
        
        // Skip separator rows
        if (/^[\|\s\-:]+$/.test(trimmedLine)) continue;
        
        const cells = trimmedLine.split('|')
          .map((cell: string) => cell.trim())
          .filter((cell: string) => cell.length > 0);
        
        if (cells.length > 0) {
          tableData.push(cells);
        }
        continue;
      } else if (inTable) {
        // End of table - render it
        if (tableData.length > 0) {
          checkPageBreak(tableData.length * lineHeight + 10);
          
          const colWidth = contentWidth / tableData[0].length;
          
          // Table header
          if (tableData.length > 0) {
            doc.setFillColor(94, 79, 255);
            doc.rect(margin, currentY, contentWidth, lineHeight + 2, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            
            tableData[0].forEach((header, i) => {
              doc.text(header, margin + (i * colWidth) + 2, currentY + 5);
            });
            
            currentY += lineHeight + 2;
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
          }
          
          // Table rows
          for (let i = 1; i < tableData.length; i++) {
            checkPageBreak();
            
            if (i % 2 === 0) {
              doc.setFillColor(248, 249, 250);
              doc.rect(margin, currentY, contentWidth, lineHeight, 'F');
            }
            
            tableData[i].forEach((cell, j) => {
              doc.text(cell.substring(0, 25), margin + (j * colWidth) + 2, currentY + 5);
            });
            
            currentY += lineHeight;
          }
          
          currentY += 5;
        }
        
        inTable = false;
        tableData = [];
      }

      // Headings
      if (trimmedLine.startsWith('### ')) {
        checkPageBreak(20);
        currentY += 5;
        addWrappedText(trimmedLine.slice(4), 14, true);
        currentY += 3;
      } else if (trimmedLine.startsWith('## ')) {
        checkPageBreak(25);
        currentY += 8;
        doc.setDrawColor(94, 79, 255);
        doc.setLineWidth(0.3);
        doc.line(margin, currentY - 3, pageWidth - margin, currentY - 3);
        currentY += 2;
        addWrappedText(trimmedLine.slice(3), 16, true);
        currentY += 5;
      } else if (trimmedLine.startsWith('# ')) {
        checkPageBreak(30);
        currentY += 10;
        addWrappedText(trimmedLine.slice(2), 18, true);
        currentY += 8;
      }
      
      // MCQ Questions
      else if (trimmedLine.match(/^Q\d+\./)) {
        checkPageBreak(25);
        currentY += 5;
        addWrappedText(trimmedLine, 12, true);
        currentY += 2;
      }
      
      // MCQ Options
      else if (trimmedLine.match(/^[A-D]\./)) {
        checkPageBreak();
        doc.setFontSize(defaultFontSize);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(trimmedLine, contentWidth - 10);
        for (const line of lines) {
          doc.text(line, margin + 5, currentY);
          currentY += lineHeight;
        }
      }
      
      // Correct Answer
      else if (trimmedLine.startsWith('Correct Answer:')) {
        checkPageBreak();
        currentY += 2;
        doc.setFillColor(220, 252, 231);
        doc.rect(margin, currentY - 3, contentWidth, lineHeight, 'F');
        doc.setTextColor(22, 163, 74);
        addWrappedText(trimmedLine, 11, true);
        doc.setTextColor(0, 0, 0);
        currentY += 2;
      }
      
      // Explanation
      else if (trimmedLine.startsWith('Explanation:')) {
        checkPageBreak();
        doc.setTextColor(75, 85, 99);
        addWrappedText(trimmedLine, 10, false);
        doc.setTextColor(0, 0, 0);
        currentY += 5;
      }
      
      // Lists
      else if (trimmedLine.match(/^[-•*]\s/)) {
        if (!inList) {
          inList = true;
          currentY += 2;
        }
        checkPageBreak();
        const listText = '• ' + trimmedLine.replace(/^[-•*]\s/, '');
        addWrappedText(listText, defaultFontSize, false);
      }
      
      // Regular paragraphs
      else {
        if (inList) {
          inList = false;
          currentY += 2;
        }
        checkPageBreak();
        addWrappedText(trimmedLine, defaultFontSize, false);
        currentY += 2;
      }
    }

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPageFooter();
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Create response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${filename || 'quicknotes-study-material.pdf'}"`);
    headers.set('Content-Length', pdfBuffer.byteLength.toString());
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}