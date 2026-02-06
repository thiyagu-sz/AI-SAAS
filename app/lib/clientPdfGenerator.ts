import { jsPDF } from 'jspdf';

export interface PDFGeneratorOptions {
  title: string;
  content: string;
  author?: string;
  subject?: string;
}

export class ClientPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private currentY: number;
  private lineHeight: number;
  private defaultFontSize: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.currentY = this.margin;
    this.lineHeight = 7;
    this.defaultFontSize = 11;
  }

  private checkPageBreak(requiredSpace: number = this.lineHeight): boolean {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
      this.addPageFooter();
      return true;
    }
    return false;
  }

  private addPageFooter(): void {
    this.doc.setFontSize(8);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(
      'Generated using QuickNotes — AI Study Assistant | www.quicknotess.space',
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' }
    );
    this.doc.setTextColor(0, 0, 0);
  }

  private addWrappedText(text: string, fontSize: number = this.defaultFontSize, isBold: boolean = false): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    for (const line of lines) {
      this.checkPageBreak();
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
  }

  private addLogo(): void {
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(94, 79, 255); // QuickNotes brand color
    this.doc.text('📚 QuickNotes', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 10;
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text('AI-Powered Study Assistant', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;
    this.doc.setTextColor(0, 0, 0);
  }

  private parseMarkdownContent(content: string): void {
    const lines = content.split('\n');
    let inList = false;
    let inTable = false;
    let tableData: string[][] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        this.currentY += this.lineHeight / 2;
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
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0);
        
        if (cells.length > 0) {
          tableData.push(cells);
        }
        continue;
      } else if (inTable) {
        // End of table - render it
        this.renderTable(tableData);
        inTable = false;
        tableData = [];
      }

      // Handle different content types
      if (trimmedLine.startsWith('### ')) {
        this.renderHeading(trimmedLine.slice(4), 14);
      } else if (trimmedLine.startsWith('## ')) {
        this.renderSubHeading(trimmedLine.slice(3));
      } else if (trimmedLine.startsWith('# ')) {
        this.renderMainHeading(trimmedLine.slice(2));
      } else if (trimmedLine.match(/^Q\d+\./)) {
        this.renderMCQQuestion(trimmedLine);
      } else if (trimmedLine.match(/^[A-D]\./)) {
        this.renderMCQOption(trimmedLine);
      } else if (trimmedLine.startsWith('Correct Answer:')) {
        this.renderCorrectAnswer(trimmedLine);
      } else if (trimmedLine.startsWith('Explanation:')) {
        this.renderExplanation(trimmedLine);
      } else if (trimmedLine.match(/^[-•*]\s/)) {
        this.renderListItem(trimmedLine, inList);
        inList = true;
      } else {
        if (inList) {
          inList = false;
          this.currentY += 2;
        }
        this.renderParagraph(trimmedLine);
      }
    }

    // Handle any remaining table
    if (inTable && tableData.length > 0) {
      this.renderTable(tableData);
    }
  }

  private renderTable(tableData: string[][]): void {
    if (tableData.length === 0) return;

    this.checkPageBreak(tableData.length * this.lineHeight + 10);
    
    const colWidth = this.contentWidth / tableData[0].length;
    
    // Table header
    if (tableData.length > 0) {
      this.doc.setFillColor(94, 79, 255);
      this.doc.rect(this.margin, this.currentY, this.contentWidth, this.lineHeight + 2, 'F');
      
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      
      tableData[0].forEach((header, i) => {
        const headerText = header.length > 20 ? header.substring(0, 20) + '...' : header;
        this.doc.text(headerText, this.margin + (i * colWidth) + 2, this.currentY + 5);
      });
      
      this.currentY += this.lineHeight + 2;
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'normal');
    }
    
    // Table rows
    for (let i = 1; i < tableData.length; i++) {
      this.checkPageBreak();
      
      if (i % 2 === 0) {
        this.doc.setFillColor(248, 249, 250);
        this.doc.rect(this.margin, this.currentY, this.contentWidth, this.lineHeight, 'F');
      }
      
      tableData[i].forEach((cell, j) => {
        const cellText = cell.length > 25 ? cell.substring(0, 25) + '...' : cell;
        this.doc.text(cellText, this.margin + (j * colWidth) + 2, this.currentY + 5);
      });
      
      this.currentY += this.lineHeight;
    }
    
    this.currentY += 5;
  }

  private renderHeading(text: string, fontSize: number = 14): void {
    this.checkPageBreak(20);
    this.currentY += 5;
    this.addWrappedText(text, fontSize, true);
    this.currentY += 3;
  }

  private renderSubHeading(text: string): void {
    this.checkPageBreak(25);
    this.currentY += 8;
    this.doc.setDrawColor(94, 79, 255);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY - 3, this.pageWidth - this.margin, this.currentY - 3);
    this.currentY += 2;
    this.addWrappedText(text, 16, true);
    this.currentY += 5;
  }

  private renderMainHeading(text: string): void {
    this.checkPageBreak(30);
    this.currentY += 10;
    this.addWrappedText(text, 18, true);
    this.currentY += 8;
  }

  private renderMCQQuestion(text: string): void {
    this.checkPageBreak(25);
    this.currentY += 5;
    this.addWrappedText(text, 12, true);
    this.currentY += 2;
  }

  private renderMCQOption(text: string): void {
    this.checkPageBreak();
    this.doc.setFontSize(this.defaultFontSize);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(text, this.contentWidth - 10);
    for (const line of lines) {
      this.doc.text(line, this.margin + 5, this.currentY);
      this.currentY += this.lineHeight;
    }
  }

  private renderCorrectAnswer(text: string): void {
    this.checkPageBreak();
    this.currentY += 2;
    this.doc.setFillColor(220, 252, 231);
    this.doc.rect(this.margin, this.currentY - 3, this.contentWidth, this.lineHeight, 'F');
    this.doc.setTextColor(22, 163, 74);
    this.addWrappedText(text, 11, true);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 2;
  }

  private renderExplanation(text: string): void {
    this.checkPageBreak();
    this.doc.setTextColor(75, 85, 99);
    this.addWrappedText(text, 10, false);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 5;
  }

  private renderListItem(text: string, inList: boolean): void {
    if (!inList) {
      this.currentY += 2;
    }
    this.checkPageBreak();
    const listText = '• ' + text.replace(/^[-•*]\s/, '');
    this.addWrappedText(listText, this.defaultFontSize, false);
  }

  private renderParagraph(text: string): void {
    this.checkPageBreak();
    // Remove markdown formatting
    const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    this.addWrappedText(cleanText, this.defaultFontSize, false);
    this.currentY += 2;
  }

  public generate(options: PDFGeneratorOptions): Blob {
    // Add title page
    this.addLogo();
    
    // Document title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(26, 26, 26);
    const titleLines = this.doc.splitTextToSize(options.title || 'Study Notes', this.contentWidth);
    for (const titleLine of titleLines) {
      this.checkPageBreak(15);
      this.doc.text(titleLine, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 12;
    }
    
    this.currentY += 10;
    
    // Date
    this.doc.setFontSize(11);
    this.doc.setTextColor(100, 100, 100);
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
    this.doc.text(`Generated: ${today}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    // Add horizontal line
    this.currentY += 20;
    this.doc.setDrawColor(94, 79, 255);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 20;

    // Parse and add content
    this.parseMarkdownContent(options.content);

    // Add footer to all pages
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addPageFooter();
    }

    // Return PDF as blob
    return this.doc.output('blob');
  }
}

// Helper function for easy use
export function generateClientPDF(options: PDFGeneratorOptions): Blob {
  const generator = new ClientPDFGenerator();
  return generator.generate(options);
}