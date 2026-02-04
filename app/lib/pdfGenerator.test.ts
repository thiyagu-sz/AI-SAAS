import { generateProfessionalHTML } from './pdfGenerator';

jest.mock('./reportGenerator', () => ({
  __esModule: true,
  default: {
    generate: jest.fn((config) => config.content),
    validate: jest.fn(() => ({ isClean: true, issues: [] })),
  },
}));

describe('PDF Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateProfessionalHTML', () => {
    it('should generate valid HTML from markdown', () => {
      const markdown = '## Study Guide\nThis is important content.';
      const title = 'My Study Notes';

      const html = generateProfessionalHTML(markdown, title);

      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('should include title in HTML document', () => {
      const markdown = '## Python Basics\nContent about Python.';
      const title = 'Python Study Notes';

      const html = generateProfessionalHTML(markdown, title);

      expect(html).toContain('Python Basics');
    });

    it('should convert markdown headings to HTML', () => {
      const markdown = '## Chapter 1\nContent here';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<h2>');
      expect(html).toContain('Chapter 1');
    });

    it('should handle empty markdown', () => {
      const html = generateProfessionalHTML('', 'Empty Notes');

      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should sanitize HTML special characters', () => {
      const markdown = 'Text with <script> tags & special chars';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;');
    });

    it('should remove URLs from content', () => {
      const markdown = 'Visit https://example.com for more info';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).not.toContain('https://example.com');
      expect(html).toContain('for more info');
    });

    it('should remove www domains from content', () => {
      const markdown = 'Check www.example.com for details';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).not.toContain('www.example.com');
    });

    it('should convert bold formatting to strong tags', () => {
      const markdown = 'This is **important** text';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<strong>important</strong>');
    });

    it('should convert italic formatting to em tags', () => {
      const markdown = 'This is *italic* text';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<em>italic</em>');
    });

    it('should convert reference numbers to superscript', () => {
      const markdown = 'This is a fact[1] and another[2]';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<sup>1</sup>');
      expect(html).toContain('<sup>2</sup>');
    });

    it('should convert blockquotes to HTML', () => {
      const markdown = '> This is a quote';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<blockquote>');
    });

    it('should handle unordered lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
    });

    it('should handle ordered lists', () => {
      const markdown = '1. First\n2. Second\n3. Third';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<ol>');
      expect(html).toContain('<li>');
    });

    it('should include CSS styling in HTML document', () => {
      const markdown = 'Content';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<style>');
      expect(html).toContain('font-family');
    });

    it('should include body styling for PDF generation', () => {
      const markdown = 'Content';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('page-break-after');
    });

    it('should handle complex markdown with multiple elements', () => {
      const markdown = `## Section 1
This is a paragraph with **bold** and *italic*.

- Point 1
- Point 2

1. Step 1
2. Step 2`;

      const html = generateProfessionalHTML(markdown, 'Complex Notes');

      expect(html).toContain('<h2>');
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<ol>');
    });

    it('should handle tables in markdown', () => {
      const markdown = '| Header 1 | Header 2 |\n|----------|----------|\n| Data 1 | Data 2 |';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('<table>');
    });

    it('should not include H1 headings in output', () => {
      const markdown = '# Main Title\n## Subtitle\nContent';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).not.toContain('# Main Title');
    });

    it('should preserve text formatting with newlines', () => {
      const markdown = 'Line 1\nLine 2\nLine 3';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('Line 1');
      expect(html).toContain('Line 2');
      expect(html).toContain('Line 3');
    });

    it('should handle markdown links', () => {
      const markdown = '[Click here](https://example.com) for more';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('Click here');
      expect(html).not.toContain('https://');
    });

    it('should handle code blocks', () => {
      const markdown = 'Some text\n```\ncode block\n```\nMore text';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('code block');
    });

    it('should use provided title as document title', () => {
      const markdown = 'Content';
      const title = 'My Custom Title';

      const html = generateProfessionalHTML(markdown, title);

      expect(html).toContain(title);
    });

    it('should have proper HTML structure', () => {
      const markdown = 'Content';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toMatch(/<!DOCTYPE html>/i);
      expect(html).toMatch(/<html/i);
      expect(html).toMatch(/<head>/i);
      expect(html).toMatch(/<\/head>/i);
      expect(html).toMatch(/<body>/i);
      expect(html).toMatch(/<\/body>/i);
      expect(html).toMatch(/<\/html>/i);
    });

    it('should handle emoji removal in titles', () => {
      const markdown = '## 📚 Study Guide';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('Study Guide');
    });

    it('should handle special characters in content', () => {
      const markdown = 'Special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
      const html = generateProfessionalHTML(markdown, 'Notes');

      expect(html).toContain('Special chars');
    });

    it('should handle very long content', () => {
      const markdown = 'Word '.repeat(1000);
      const html = generateProfessionalHTML(markdown, 'Long Notes');

      expect(html).toContain('Word');
      expect(html.length).toBeGreaterThan(100);
    });
  });
});
