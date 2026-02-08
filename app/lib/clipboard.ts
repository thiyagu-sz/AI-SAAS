/**
 * Clipboard utility for safely copying text content to clipboard
 * with proper error handling and production-ready implementation
 */

export interface CopyResult {
  success: boolean;
  message: string;
}

/**
 * Copy text to clipboard with fallback support and user-friendly feedback
 * @param text - The text content to copy
 * @returns Promise with success status and user-friendly message
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      message: "Nothing to copy"
    };
  }

  try {
    // Modern browsers with Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        message: "Copied to clipboard"
      };
    }
    
    // Fallback for older browsers or non-HTTPS contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return {
        success: true,
        message: "Copied to clipboard"
      };
    } else {
      throw new Error('Copy command failed');
    }
  } catch (error) {
    // Don't expose technical errors to users in production
    console.error('Copy to clipboard failed:', error);
    return {
      success: false,
      message: "Unable to copy right now. Please try again."
    };
  }
}

/**
 * Extract plain text from markdown content while preserving structure
 * @param markdownContent - Raw markdown content
 * @returns Plain text with preserved formatting
 */
export function extractTextFromMarkdown(markdownContent: string): string {
  if (!markdownContent) return '';
  
  return markdownContent
    // Remove HTML tags if any
    .replace(/<[^>]*>/g, '')
    // Convert markdown headers to plain text with spacing
    .replace(/^#{1,6}\s+(.*)$/gm, '$1\n')
    // Convert bold/italic to plain text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Convert lists to plain text with bullets
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '• ')
    // Convert code blocks to plain text
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
    })
    // Convert inline code
    .replace(/`([^`]+)`/g, '$1')
    // Clean up excessive whitespace while preserving line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}