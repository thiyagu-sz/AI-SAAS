import React from 'react';

// Simple markdown renderer for chat messages
export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={elements.length} className="mb-3 last:mb-0">
          {currentParagraph.join(' ')}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const ListComponent = listType === 'ol' ? 'ol' : 'ul';
      const listClassName = listType === 'ol' 
        ? 'list-decimal list-inside mb-3 space-y-1' 
        : 'list-disc list-inside mb-3 space-y-1';
      
      elements.push(
        React.createElement(
          ListComponent,
          { key: elements.length, className: listClassName },
          listItems.map((item, idx) => (
            <li key={idx} className="ml-4">{formatInlineMarkdown(item)}</li>
          ))
        )
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      flushParagraph();
      elements.push(
        <h3 key={elements.length} className="text-lg font-semibold mt-4 mb-2 text-gray-900">
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      flushParagraph();
      elements.push(
        <h2 key={elements.length} className="text-xl font-semibold mt-4 mb-2 text-gray-900">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      flushParagraph();
      elements.push(
        <h1 key={elements.length} className="text-2xl font-bold mt-4 mb-3 text-gray-900">
          {trimmed.slice(2)}
        </h1>
      );
      return;
    }

    // Lists
    if (trimmed.match(/^[-*]\s+/)) {
      flushParagraph();
      if (!inList) {
        inList = true;
        listType = 'ul';
      }
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }
    if (trimmed.match(/^\d+\.\s+/)) {
      flushParagraph();
      if (!inList || listType === 'ul') {
        if (inList) flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }

    // Regular paragraph
    if (trimmed.length > 0) {
      flushList();
      currentParagraph.push(trimmed);
    } else {
      flushList();
      flushParagraph();
    }
  });

  flushList();
  flushParagraph();

  return elements.length > 0 ? <>{elements}</> : <p>{text}</p>;
}

function formatInlineMarkdown(text: string): React.ReactNode {
  // Bold
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index));
    }
    parts.push(<strong key={match.index} className="font-semibold">{match[1]}</strong>);
    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
