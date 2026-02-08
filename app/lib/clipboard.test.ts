import { copyToClipboard, extractTextFromMarkdown } from './clipboard';

// Mock clipboard API
const mockWriteText = jest.fn();
const mockClipboard = {
  writeText: mockWriteText,
};

// Mock document.execCommand
const mockExecCommand = jest.fn();

describe('Clipboard utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockClear();
    mockExecCommand.mockClear();
    
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock window.isSecureContext
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      value: true,
    });
  });

  describe('extractTextFromMarkdown', () => {
    it('should extract plain text from markdown content', () => {
      const markdown = `# Study Notes

## Key Points
- **Important concept**: This is crucial
- *Secondary point*: Also relevant

### Code Example
\`\`\`javascript
const example = "hello";
\`\`\`

Regular paragraph with \`inline code\`.
`;

      const result = extractTextFromMarkdown(markdown);
      expect(result).toContain('Study Notes');
      expect(result).toContain('Key Points');
      expect(result).toContain('• Important concept: This is crucial');
      expect(result).toContain('• Secondary point: Also relevant');
      expect(result).toContain('Code Example');
      expect(result).toContain('const example = "hello";');
      expect(result).toContain('Regular paragraph with inline code.');
    });

    it('should handle empty content', () => {
      expect(extractTextFromMarkdown('')).toBe('');
      expect(extractTextFromMarkdown('   ')).toBe('');
    });

    it('should preserve line breaks and structure', () => {
      const markdown = `Line 1

Line 3 after double break`;
      
      const result = extractTextFromMarkdown(markdown);
      expect(result).toContain('Line 1\n\nLine 3 after double break');
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text using Clipboard API when available', async () => {
      // Mock navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard,
      });

      mockWriteText.mockResolvedValue(undefined);

      const result = await copyToClipboard('Test content');

      expect(mockWriteText).toHaveBeenCalledWith('Test content');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Copied to clipboard');
    });

    it('should fallback to execCommand when Clipboard API fails', async () => {
      // Mock navigator.clipboard to be undefined
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: undefined,
      });

      // Mock document.execCommand
      Object.defineProperty(document, 'execCommand', {
        writable: true,
        value: mockExecCommand,
      });

      mockExecCommand.mockReturnValue(true);

      const result = await copyToClipboard('Test content');

      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Copied to clipboard');
    });

    it('should handle empty content', async () => {
      const result = await copyToClipboard('');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Nothing to copy');
    });

    it('should handle copy failures gracefully', async () => {
      // Mock navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard,
      });

      mockWriteText.mockRejectedValue(new Error('Copy failed'));

      const result = await copyToClipboard('Test content');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unable to copy right now. Please try again.');
    });

    it('should handle execCommand fallback failure', async () => {
      // Mock navigator.clipboard to be undefined
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: undefined,
      });

      // Mock document.execCommand to fail
      Object.defineProperty(document, 'execCommand', {
        writable: true,
        value: mockExecCommand,
      });

      mockExecCommand.mockReturnValue(false);

      const result = await copyToClipboard('Test content');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unable to copy right now. Please try again.');
    });

    it('should handle insecure context gracefully', async () => {
      // Mock insecure context
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        value: false,
      });

      // Mock navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: mockClipboard,
      });

      // Mock document.execCommand
      Object.defineProperty(document, 'execCommand', {
        writable: true,
        value: mockExecCommand,
      });

      mockExecCommand.mockReturnValue(true);

      const result = await copyToClipboard('Test content');

      // Should use fallback method
      expect(mockWriteText).not.toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Copied to clipboard');
    });
  });
});