import React from 'react';

// Simple markdown renderer for chat messages
export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

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

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={elements.length} className="overflow-x-auto mb-4">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            {tableHeaders.length > 0 && (
              <thead>
                <tr className="bg-gray-50">
                  {tableHeaders.map((header, idx) => (
                    <th 
                      key={idx} 
                      className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900"
                    >
                      {formatInlineMarkdown(header.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                  {row.map((cell, cellIdx) => (
                    <td 
                      key={cellIdx} 
                      className="border border-gray-300 px-3 py-2 text-left text-gray-700"
                    >
                      {formatInlineMarkdown(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      tableHeaders = [];
      inTable = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Table detection (pipe-separated values)
    if (trimmed.includes('|') && trimmed.split('|').length >= 2) {
      flushParagraph();
      flushList();
      
      let cells = trimmed.split('|');
      
      // Remove leading/trailing empty cells (from leading/trailing pipes)
      if (cells[0].trim() === '') cells.shift();
      if (cells[cells.length - 1].trim() === '') cells.pop();
      
      cells = cells.map(cell => cell.trim());
      
      // Check if this is a separator row (contains only dashes, spaces, colons, and pipes)
      const isSeparatorRow = /^[\s\|\-:]+$/.test(trimmed);
      
      if (!isSeparatorRow && cells.length > 0) {
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          // Pad cells to match header count for consistent table structure
          while (cells.length < tableHeaders.length) {
            cells.push('');
          }
          tableRows.push(cells.slice(0, tableHeaders.length));
        }
      }
      return;
    } else if (inTable) {
      // End of table
      flushTable();
    }
    
    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
      flushList();
      elements.push(
        <hr key={elements.length} className="my-6 border-t border-gray-200" />
      );
      return;
    }

    // Lists
    if (trimmed.match(/^[-*]\s+/)) {
      flushParagraph();
      flushTable();
      if (!inList) {
        inList = true;
        listType = 'ul';
      }
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }
    if (trimmed.match(/^\d+\.\s+/)) {
      flushParagraph();
      flushTable();
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
      flushTable();
      currentParagraph.push(trimmed);
    } else {
      flushList();
      flushTable();
      flushParagraph();
    }
  });

  flushList();
  flushTable();
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
