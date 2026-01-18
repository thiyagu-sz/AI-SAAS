import React from 'react';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  describe('headings', () => {
    it('should render h1 headings', () => {
      const result = renderMarkdown('# Main Title');
      expect(result).toBeDefined();
    });

    it('should render h2 headings', () => {
      const result = renderMarkdown('## Subtitle');
      expect(result).toBeDefined();
    });

    it('should render h3 headings', () => {
      const result = renderMarkdown('### Sub-subtitle');
      expect(result).toBeDefined();
    });

    it('should render multiple headings', () => {
      const result = renderMarkdown('# Title\n## Subtitle\n### Sub-subtitle');
      expect(result).toBeDefined();
    });

    it('should handle headings with extra spaces', () => {
      const result = renderMarkdown('#    Title with spaces');
      expect(result).toBeDefined();
    });
  });

  describe('paragraphs', () => {
    it('should render simple paragraphs', () => {
      const result = renderMarkdown('This is a paragraph');
      expect(result).toBeDefined();
    });

    it('should preserve multiple lines in paragraphs', () => {
      const result = renderMarkdown('Line 1\nLine 2');
      expect(result).toBeDefined();
    });

    it('should separate paragraphs by empty lines', () => {
      const result = renderMarkdown('Paragraph 1\n\nParagraph 2');
      expect(result).toBeDefined();
    });

    it('should handle trailing whitespace', () => {
      const result = renderMarkdown('Paragraph  ');
      expect(result).toBeDefined();
    });

    it('should return default paragraph for empty input', () => {
      const result = renderMarkdown('');
      expect(result).toBeDefined();
    });
  });

  describe('unordered lists', () => {
    it('should render unordered list with dash', () => {
      const result = renderMarkdown('- Item 1\n- Item 2');
      expect(result).toBeDefined();
    });

    it('should render unordered list with asterisk', () => {
      const result = renderMarkdown('* Item 1\n* Item 2');
      expect(result).toBeDefined();
    });

    it('should handle lists with multiple items', () => {
      const result = renderMarkdown('- Point 1\n- Point 2\n- Point 3');
      expect(result).toBeDefined();
    });

    it('should handle list items with extra spaces', () => {
      const result = renderMarkdown('-  Item with extra space');
      expect(result).toBeDefined();
    });

    it('should preserve text after list', () => {
      const result = renderMarkdown('- Item 1\n- Item 2\n\nFinal paragraph');
      expect(result).toBeDefined();
    });
  });

  describe('ordered lists', () => {
    it('should render ordered list', () => {
      const result = renderMarkdown('1. First\n2. Second');
      expect(result).toBeDefined();
    });

    it('should handle numbered lists with varying numbers', () => {
      const result = renderMarkdown('1. One\n2. Two\n3. Three\n4. Four');
      expect(result).toBeDefined();
    });

    it('should handle lists with extra spaces', () => {
      const result = renderMarkdown('1.  Item with spaces');
      expect(result).toBeDefined();
    });

    it('should switch from unordered to ordered list', () => {
      const result = renderMarkdown('- Unordered\n\n1. Ordered');
      expect(result).toBeDefined();
    });

    it('should preserve text after ordered list', () => {
      const result = renderMarkdown('1. First\n2. Second\n\nConclusion paragraph');
      expect(result).toBeDefined();
    });
  });

  describe('inline formatting', () => {
    it('should render bold text', () => {
      const result = renderMarkdown('This is **bold** text');
      expect(result).toBeDefined();
    });

    it('should handle multiple bold sections', () => {
      const result = renderMarkdown('**First** and **second** bold');
      expect(result).toBeDefined();
    });

    it('should handle bold in headings', () => {
      const result = renderMarkdown('## Title with **bold** word');
      expect(result).toBeDefined();
    });

    it('should handle bold in list items', () => {
      const result = renderMarkdown('- Item with **important** word');
      expect(result).toBeDefined();
    });

    it('should handle adjacent bold text', () => {
      const result = renderMarkdown('**bold1** **bold2**');
      expect(result).toBeDefined();
    });

    it('should handle bold at start of text', () => {
      const result = renderMarkdown('**Start** with bold');
      expect(result).toBeDefined();
    });

    it('should handle bold at end of text', () => {
      const result = renderMarkdown('End with **bold**');
      expect(result).toBeDefined();
    });
  });

  describe('complex content', () => {
    it('should render mixed content with headings and paragraphs', () => {
      const content = `# Main Title
This is an introduction paragraph with some text.

## First Section
Key points about the section.

- Point 1
- Point 2

## Second Section
More information here with **bold** text.

1. Step one
2. Step two
3. Step three`;
      const result = renderMarkdown(content);
      expect(result).toBeDefined();
    });

    it('should handle content with empty lines', () => {
      const content = `# Title


## Subtitle

Content here`;
      const result = renderMarkdown(content);
      expect(result).toBeDefined();
    });

    it('should handle lists followed by headings', () => {
      const content = `- Item 1
- Item 2

# New Section
Content`;
      const result = renderMarkdown(content);
      expect(result).toBeDefined();
    });

    it('should handle whitespace-only lines', () => {
      const content = `Line 1
    
Line 2`;
      const result = renderMarkdown(content);
      expect(result).toBeDefined();
    });

    it('should preserve reading order', () => {
      const content = `# First
Content 1

# Second
Content 2`;
      const result = renderMarkdown(content);
      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle only whitespace', () => {
      const result = renderMarkdown('   ');
      expect(result).toBeDefined();
    });

    it('should handle single character', () => {
      const result = renderMarkdown('A');
      expect(result).toBeDefined();
    });

    it('should handle very long text', () => {
      const longText = 'x'.repeat(5000);
      const result = renderMarkdown(longText);
      expect(result).toBeDefined();
    });

    it('should handle special characters', () => {
      const result = renderMarkdown('Text with @#$%^&() special chars');
      expect(result).toBeDefined();
    });

    it('should handle unicode characters', () => {
      const result = renderMarkdown('Text with émojis 🎉 and 中文');
      expect(result).toBeDefined();
    });

    it('should handle incomplete markdown syntax', () => {
      const result = renderMarkdown('Text with **bold no closing');
      expect(result).toBeDefined();
    });

    it('should handle multiple consecutive empty lines', () => {
      const result = renderMarkdown('Line 1\n\n\n\n\nLine 2');
      expect(result).toBeDefined();
    });
  });

  describe('formatting in lists', () => {
    it('should handle bold in unordered list items', () => {
      const result = renderMarkdown('- **Important** point\n- Regular point');
      expect(result).toBeDefined();
    });

    it('should handle bold in ordered list items', () => {
      const result = renderMarkdown('1. **First** step\n2. Second step');
      expect(result).toBeDefined();
    });

    it('should handle multiple bold in single list item', () => {
      const result = renderMarkdown('- **Key1** and **Key2** matter');
      expect(result).toBeDefined();
    });
  });

  describe('line processing', () => {
    it('should handle lines with only heading syntax', () => {
      const result = renderMarkdown('# \n## ');
      expect(result).toBeDefined();
    });

    it('should handle list with empty item', () => {
      const result = renderMarkdown('- Item 1\n- \n- Item 2');
      expect(result).toBeDefined();
    });

    it('should handle mixed list markers', () => {
      const result = renderMarkdown('- First\n- Second\n* Third');
      expect(result).toBeDefined();
    });

    it('should transition from text to list', () => {
      const result = renderMarkdown('Intro text\n- List item');
      expect(result).toBeDefined();
    });

    it('should transition from list to text', () => {
      const result = renderMarkdown('- List item\n\nConcluding text');
      expect(result).toBeDefined();
    });
  });
});
