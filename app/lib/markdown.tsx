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
        <p key={elements.length} className="mb-4 last:mb-0 text-left leading-relaxed">
          {formatInlineMarkdown(currentParagraph.join(' '))}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const ListComponent = listType === 'ol' ? 'ol' : 'ul';
      const listClassName = listType === 'ol' 
        ? 'list-decimal list-outside mb-4 space-y-2 text-left pl-6' 
        : 'list-disc list-outside mb-4 space-y-2 text-left pl-6';
      
      elements.push(
        React.createElement(
          ListComponent,
          { key: elements.length, className: listClassName },
          listItems.map((item, idx) => (
            <li key={idx} className="text-left leading-relaxed">{formatInlineMarkdown(item)}</li>
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
        <h3 key={elements.length} className="text-base font-bold mt-6 mb-3 text-gray-900 text-left leading-tight">
          {formatInlineMarkdown(trimmed.slice(4))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      flushParagraph();
      elements.push(
        <h2 key={elements.length} className="text-lg font-bold mt-6 mb-3 text-gray-900 text-left leading-tight">
          {formatInlineMarkdown(trimmed.slice(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      flushParagraph();
      elements.push(
        <h1 key={elements.length} className="text-xl font-bold mt-6 mb-4 text-gray-900 text-left leading-tight">
          {formatInlineMarkdown(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // MCQ Options (A., B., C., D.)
    if (trimmed.match(/^[A-D]\.\s+/)) {
      flushParagraph();
      flushList();
      elements.push(
        <div key={elements.length} className="mb-2 pl-4 text-left leading-relaxed">
          <span className="font-semibold text-gray-800">{trimmed.slice(0, 2)}</span>
          <span className="ml-2">{formatInlineMarkdown(trimmed.slice(3))}</span>
        </div>
      );
      return;
    }

    // MCQ Question numbering (Q1., Q2., etc.)
    if (trimmed.match(/^Q\d+\.\s+/)) {
      flushParagraph();
      flushList();
      elements.push(
        <div key={elements.length} className="mt-6 mb-4 text-left">
          <div className="font-semibold text-gray-900 text-base leading-relaxed">
            {formatInlineMarkdown(trimmed)}
          </div>
        </div>
      );
      return;
    }

    // Correct Answer line
    if (trimmed.match(/^Correct Answer:\s+/)) {
      flushParagraph();
      flushList();
      elements.push(
        <div key={elements.length} className="mt-4 mb-2 text-left">
          <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded text-sm">
            {trimmed}
          </span>
        </div>
      );
      return;
    }

    // Explanation line
    if (trimmed.match(/^Explanation:\s+/)) {
      flushParagraph();
      flushList();
      elements.push(
        <div key={elements.length} className="mb-4 text-left">
          <div className="text-gray-600 italic text-sm leading-relaxed">
            {formatInlineMarkdown(trimmed)}
          </div>
        </div>
      );
      return;
    }

    // Horizontal rule for MCQ separation
    if (trimmed === '---') {
      flushParagraph();
      flushList();
      elements.push(
        <hr key={elements.length} className="my-6 border-t border-gray-200" />
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
    parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[1]}</strong>);
    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
