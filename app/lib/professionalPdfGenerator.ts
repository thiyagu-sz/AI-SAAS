import { jsPDF } from 'jspdf';

/**
 * Production-safe PDF Generator for Vercel serverless
 * Uses jsPDF for pure JavaScript PDF generation without external dependencies
 * Includes professional styling, branding, and robust content handling
 */

export interface ProPDFOptions {
  title: string;
  content: string;
  author?: string;
  includeTableOfContents?: boolean;
  includePageNumbers?: boolean;
  logoBase64?: string;
  brandColor?: string;
}

export class ProfessionalPdfGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private contentWidth: number;
  private currentY: number;
  private lineHeight: number = 7;
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private contentStartPage: number = 1;
  private defaultFontSize: number = 11;
  private brandColor: [number, number, number] = [94, 79, 255]; // QuickNotes purple
  private logoBase64?: string;

  constructor(options: Partial<ProPDFOptions> = {}) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.currentY = this.margin;
    this.pageNumber = 1;
    this.logoBase64 = options.logoBase64;

    if (options.brandColor) {
      // Parse color hex to RGB
      const hex = options.brandColor.replace('#', '');
      this.brandColor = [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  /**
   * Check if we need a page break and create new page if needed
   */
  private ensureSpace(requiredHeight: number = 10): boolean {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin - 10) {
      this.addPageBreak();
      return true;
    }
    return false;
  }

  /**
   * Add a new page with header
   */
  private addPageBreak(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.margin;
    this.addPageHeader();
  }

  /**
   * Add header to each page (after first)
   */
  private addPageHeader(): void {
    if (this.pageNumber > this.contentStartPage) {
      // Subtle line
      this.doc.setDrawColor(200, 200, 210);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.currentY + 2, this.pageWidth - this.margin, this.currentY + 2);
      this.currentY += 6;
    }
  }

  /**
   * Add footer with page numbers
   */
  private addPageFooters(): void {
    const totalPages = this.doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);

      // Page number
      this.doc.setFontSize(9);
      this.doc.setTextColor(140, 140, 150);
      this.doc.text(
        `Page ${i} of ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );

      // Footer text
      this.doc.setFontSize(8);
      this.doc.text(
        '© Generated using QuickNotes — AI Study Assistant | www.quicknotess.space',
        this.pageWidth / 2,
        this.pageHeight - 5,
        { align: 'center' }
      );

      this.doc.setTextColor(0, 0, 0);
    }
  }

  /**
   * Add cover page with branding
   */
  private addCoverPage(title: string): void {
    // Background color
    this.doc.setFillColor(245, 247, 250);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Reset position
    this.currentY = this.margin + 40;

    // Logo
    if (this.logoBase64) {
      try {
        this.doc.addImage(
          this.logoBase64,
          'PNG',
          this.pageWidth / 2 - 25,
          this.currentY - 20,
          50,
          50
        );
        this.currentY += 40;
      } catch (e) {
        console.warn('Failed to add logo image:', e);
      }
    }

    // Brand text as fallback
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.brandColor);
    this.doc.text('QuickNotes', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 8;

    this.doc.setFontSize(10);
    this.doc.setTextColor(120, 120, 130);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('AI-Powered Study Assistant', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 30;

    // Title
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(26, 26, 26);
    
    const titleLines = this.doc.splitTextToSize(title, this.contentWidth - 20);
    titleLines.forEach((line: string) => {
      this.doc.text(line, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 12;
    });

    this.currentY += 20;

    // Date
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.doc.setFontSize(11);
    this.doc.setTextColor(100, 100, 110);
    this.doc.text(`Generated: ${today}`, this.pageWidth / 2, this.currentY, { align: 'center' });

    // Decorative line
    this.currentY += 20;
    this.doc.setDrawColor(...this.brandColor);
    this.doc.setLineWidth(1);
    this.doc.line(this.pageWidth / 2 - 40, this.currentY, this.pageWidth / 2 + 40, this.currentY);

    // Add page break
    this.doc.addPage();
    this.pageNumber++;
    this.contentStartPage = 2;
    this.currentY = this.margin;
  }

  /**
   * Wrap and add text with proper formatting
   */
  private addText(
    text: string,
    fontSize: number = this.defaultFontSize,
    fontStyle: 'normal' | 'bold' = 'normal',
    color: [number, number, number] = [26, 26, 26],
    spaceAfter: number = 0
  ): void {
    this.ensureSpace(this.lineHeight + 2);

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(...color);

    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    lines.forEach((line: string) => {
      this.ensureSpace(this.lineHeight);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });

    this.currentY += spaceAfter;
  }

  /**
   * Parse markdown and render to PDF
   */
  private parseAndRenderContent(markdown: string): void {
    const lines = markdown.split('\n');
    let inList = false;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Handle empty lines
      if (!trimmed) {
        if (inList) {
          this.currentY += 3;
          inList = false;
        }
        this.currentY += 4;
        continue;
      }

      // Handle code blocks
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          this.renderCodeBlock(codeBlockContent);
          codeBlockContent = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle headings
      if (trimmed.startsWith('# ')) {
        this.ensureSpace(25);
        this.currentY += 5;
        this.addText(trimmed.slice(2), 20, 'bold', this.brandColor, 8);
        continue;
      }

      if (trimmed.startsWith('## ')) {
        this.ensureSpace(20);
        this.currentY += 3;
        this.addText(trimmed.slice(3), 16, 'bold', [26, 26, 26], 5);
        // Underline
        this.doc.setDrawColor(...this.brandColor);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin, this.currentY - 2, this.pageWidth - this.margin, this.currentY - 2);
        this.currentY += 3;
        continue;
      }

      if (trimmed.startsWith('### ')) {
        this.ensureSpace(15);
        this.currentY += 2;
        this.addText(trimmed.slice(4), 13, 'bold', [50, 50, 60], 4);
        continue;
      }

      // Handle MCQ format
      if (trimmed.match(/^Q\d+\./)) {
        this.ensureSpace(18);
        this.currentY += 3;
        this.addText(trimmed, 12, 'bold', [26, 26, 26], 3);
        continue;
      }

      if (trimmed.match(/^[A-D]\./) && !trimmed.startsWith('A]')) {
        this.ensureSpace(10);
        this.addText(`  ${trimmed}`, 11, 'normal', [50, 50, 60], 2);
        continue;
      }

      if (trimmed.startsWith('Correct Answer:')) {
        this.ensureSpace(12);
        this.doc.setFillColor(220, 252, 231);
        this.doc.rect(this.margin, this.currentY - 2, this.contentWidth, this.lineHeight + 4, 'F');
        this.addText(trimmed, 11, 'bold', [22, 163, 74], 3);
        continue;
      }

      if (trimmed.startsWith('Explanation:')) {
        this.ensureSpace(10);
        this.doc.setTextColor(100, 100, 110);
        this.addText(trimmed, 10, 'normal', [100, 100, 110], 3);
        continue;
      }

      // Handle lists
      if (trimmed.match(/^[-•*]\s/)) {
        this.ensureSpace(10);
        if (!inList) {
          inList = true;
          this.currentY += 2;
        }
        const listText = trimmed.replace(/^[-•*]\s/, '');
        this.addText(`• ${listText}`, 11, 'normal', [50, 50, 60], 2);
        continue;
      }

      if (trimmed.startsWith('> ')) {
        this.ensureSpace(15);
        this.currentY += 2;
        this.doc.setFillColor(245, 243, 255);
        this.doc.rect(this.margin, this.currentY - 2, this.contentWidth, this.lineHeight + 4, 'F');
        this.doc.setDrawColor(...this.brandColor);
        this.doc.setLineWidth(1);
        this.doc.line(this.margin, this.currentY - 2, this.margin, this.currentY + this.lineHeight + 2);
        this.addText(`  ${trimmed.slice(2)}`, 10, 'normal', [75, 85, 99], 3);
        continue;
      }

      // Handle bold/italic formatting
      let displayText = trimmed;
      let isBold = false;

      if (trimmed.includes('**')) {
        isBold = true;
        displayText = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
      }

      // Regular paragraph
      if (inList) {
        inList = false;
        this.currentY += 3;
      }

      this.ensureSpace(10);
      this.addText(displayText, this.defaultFontSize, isBold ? 'bold' : 'normal', [50, 50, 60], 3);
    }
  }

  /**
   * Render code block
   */
  private renderCodeBlock(lines: string[]): void {
    this.ensureSpace(lines.length * this.lineHeight + 10);
    this.currentY += 3;

    this.doc.setFillColor(240, 240, 245);
    this.doc.rect(this.margin, this.currentY - 3, this.contentWidth, lines.length * this.lineHeight + 6, 'F');

    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(50, 50, 60);

    lines.forEach((line) => {
      this.doc.text(line.substring(0, 90), this.margin + 3, this.currentY + 2);
      this.currentY += this.lineHeight;
    });

    this.doc.setFont('helvetica', 'normal');
    this.currentY += 5;
  }

  /**
   * Generate PDF
   */
  public generate(options: ProPDFOptions): ArrayBuffer {
    const title = options.title || 'Study Notes';

    // Add cover page
    this.addCoverPage(title);

    // Parse and render content
    this.parseAndRenderContent(options.content);

    // Add footers to all pages
    this.addPageFooters();

    // Return PDF as array buffer
    return this.doc.output('arraybuffer');
  }

  /**
   * Generate PDF as Blob (for client-side)
   */
  public generateBlob(options: ProPDFOptions): Blob {
    const buffer = this.generate(options);
    return new Blob([buffer], { type: 'application/pdf' });
  }
}

/**
 * Helper function to convert image file to base64
 */
export async function imageToBase64(imagePath: string): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: use Node.js fs
    const fs = await import('fs').then((m) => m.promises);
    try {
      const data = await fs.readFile(imagePath);
      return `data:image/png;base64,${data.toString('base64')}`;
    } catch (e) {
      console.warn('Failed to read image:', e);
      return '';
    }
  } else {
    // Client-side: use fetch
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Failed to fetch image:', e);
      return '';
    }
  }
}
