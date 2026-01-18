/**
 * Tests for text processing utilities extracted from upload and chat routes
 */

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200) {
  const chunks: Array<{ content: string; start: number; end: number }> = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      content: text.substring(start, end),
      start,
      end,
    });
    start = end - overlap;
  }

  return chunks;
}

function generateFallbackEmbedding(inputText: string): number[] {
  const hash = inputText.split('').reduce((acc, char) => {
    const hash = ((acc << 5) - acc) + char.charCodeAt(0);
    return hash & hash;
  }, 0);
  return new Array(384).fill(0).map((_, i) => 
    Math.sin((hash + i) * 0.1) * 0.1
  );
}

describe('Text Processing Utilities', () => {
  describe('chunkText', () => {
    it('should chunk text into specified size', () => {
      const text = 'a'.repeat(2000);
      const chunks = chunkText(text, 1000, 200);
      
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeLessThanOrEqual(1000);
      });
    });

    it('should preserve text order', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const chunks = chunkText(text, 10, 2);
      const reconstructed = chunks.map(c => c.content).join('').substring(0, text.length);
      expect(reconstructed).toContain('quick');
      expect(reconstructed).toContain('brown');
    });

    it('should handle empty text', () => {
      const chunks = chunkText('', 1000, 200);
      expect(chunks.length).toBe(0);
    });

    it('should handle single chunk text', () => {
      const text = 'Short text';
      const chunks = chunkText(text, 1000, 200);
      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe(text);
    });

    it('should set correct start and end positions', () => {
      const text = 'a'.repeat(2500);
      const chunks = chunkText(text, 1000, 200);
      
      expect(chunks[0].start).toBe(0);
      expect(chunks[0].end).toBe(1000);
      expect(chunks[1].start).toBe(800);
      expect(chunks[1].end).toBe(1800);
    });

    it('should handle overlap correctly', () => {
      const text = 'a'.repeat(2200);
      const chunks = chunkText(text, 1000, 300);
      
      // Each chunk should have overlap with next
      expect(chunks[0].content.slice(-300)).toEqual(chunks[1].content.slice(0, 300));
    });

    it('should handle text smaller than chunk size', () => {
      const text = 'Small';
      const chunks = chunkText(text, 1000, 200);
      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe('Small');
    });

    it('should handle zero overlap', () => {
      const text = 'abcdefghij';
      const chunks = chunkText(text, 3, 0);
      expect(chunks[0].content).toBe('abc');
      expect(chunks[1].content).toBe('def');
      expect(chunks[2].content).toBe('ghi');
    });

    it('should handle large overlap', () => {
      const text = 'a'.repeat(1200);
      const chunks = chunkText(text, 1000, 900);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].end - chunks[1].start).toBe(900);
    });

    it('should not lose any characters', () => {
      const text = 'The quick brown fox jumps over the lazy dog. ' + 'x'.repeat(1500);
      const chunks = chunkText(text, 500, 100);
      
      let allContent = '';
      chunks.forEach((chunk, idx) => {
        if (idx === 0) {
          allContent += chunk.content;
        } else {
          allContent += chunk.content.substring(100);
        }
      });
      
      expect(allContent.substring(0, text.length)).toBe(text);
    });

    it('should handle unicode characters', () => {
      const text = '你好世界'.repeat(100);
      const chunks = chunkText(text, 200, 50);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.content).toBeTruthy();
      });
    });
  });

  describe('generateFallbackEmbedding', () => {
    it('should generate 384-dimensional vector', () => {
      const embedding = generateFallbackEmbedding('test text');
      expect(embedding.length).toBe(384);
    });

    it('should generate numeric values', () => {
      const embedding = generateFallbackEmbedding('test');
      embedding.forEach(value => {
        expect(typeof value).toBe('number');
      });
    });

    it('should generate values in reasonable range', () => {
      const embedding = generateFallbackEmbedding('test');
      embedding.forEach(value => {
        expect(Math.abs(value)).toBeLessThanOrEqual(1);
      });
    });

    it('should be deterministic', () => {
      const text = 'consistent text';
      const embedding1 = generateFallbackEmbedding(text);
      const embedding2 = generateFallbackEmbedding(text);
      
      expect(embedding1).toEqual(embedding2);
    });

    it('should produce different embeddings for different inputs', () => {
      const embedding1 = generateFallbackEmbedding('text one');
      const embedding2 = generateFallbackEmbedding('text two');
      
      expect(embedding1).not.toEqual(embedding2);
    });

    it('should handle empty string', () => {
      const embedding = generateFallbackEmbedding('');
      expect(embedding.length).toBe(384);
      expect(embedding.every(v => typeof v === 'number')).toBe(true);
    });

    it('should handle long strings', () => {
      const longText = 'a'.repeat(10000);
      const embedding = generateFallbackEmbedding(longText);
      expect(embedding.length).toBe(384);
    });

    it('should handle special characters', () => {
      const embedding = generateFallbackEmbedding('!@#$%^&*()_+-=[]{}|;:,.<>?');
      expect(embedding.length).toBe(384);
      expect(embedding.every(v => typeof v === 'number')).toBe(true);
    });

    it('should handle unicode', () => {
      const embedding = generateFallbackEmbedding('你好世界 مرحبا العالم');
      expect(embedding.length).toBe(384);
      expect(embedding.every(v => typeof v === 'number')).toBe(true);
    });

    it('should have variation across dimensions', () => {
      const embedding = generateFallbackEmbedding('varied text');
      const uniqueValues = new Set(embedding.map(v => v.toFixed(10)));
      expect(uniqueValues.size).toBeGreaterThan(1);
    });

    it('should be centered around zero', () => {
      const embedding = generateFallbackEmbedding('test data');
      const mean = embedding.reduce((a, b) => a + b, 0) / embedding.length;
      expect(Math.abs(mean)).toBeLessThan(0.1);
    });
  });

  describe('Text Processing Integration', () => {
    it('should chunk and embed text preserving content', () => {
      const text = 'Important study material about quantum mechanics ' + 'x'.repeat(1000);
      const chunks = chunkText(text, 500, 100);
      
      chunks.forEach(chunk => {
        const embedding = generateFallbackEmbedding(chunk.content);
        expect(embedding.length).toBe(384);
      });
    });

    it('should handle realistic study material', () => {
      const studyMaterial = `
        Chapter 1: Introduction to Physics
        Physics is the natural science that studies matter and energy.
        
        Key Concepts:
        - Motion
        - Force
        - Energy
        
        Newton's Laws are fundamental to classical mechanics.
      `.repeat(3);
      
      const chunks = chunkText(studyMaterial, 500, 100);
      expect(chunks.length).toBeGreaterThan(0);
      
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeGreaterThan(0);
        const embedding = generateFallbackEmbedding(chunk.content);
        expect(embedding.length).toBe(384);
      });
    });
  });
});
