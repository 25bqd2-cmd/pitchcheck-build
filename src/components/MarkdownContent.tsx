import React from "react";

interface MarkdownContentProps {
  text: string;
}

function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const segment = match[0];
    if (segment.startsWith("**") && segment.endsWith("**")) {
      tokens.push(
        <strong key={`b-${key++}`} className="font-semibold text-[#1C1917]">
          {segment.slice(2, -2)}
        </strong>,
      );
    } else if (segment.startsWith("*") && segment.endsWith("*")) {
      tokens.push(
        <em key={`i-${key++}`} className="italic">
          {segment.slice(1, -1)}
        </em>,
      );
    } else if (segment.startsWith("`") && segment.endsWith("`")) {
      tokens.push(
        <code
          key={`c-${key++}`}
          className="rounded bg-[#F3EFE6] px-1.5 py-0.5 font-mono text-[0.875em] text-[#1C1917]"
        >
          {segment.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

export function MarkdownContent({ text }: MarkdownContentProps) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Headings (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInline(headingMatch[2]);
      if (level === 1) {
        blocks.push(
          <h3
            key={`h-${blockKey++}`}
            className="font-serif text-lg font-semibold text-[#1C1917] mt-3 first:mt-0 mb-1.5"
          >
            {content}
          </h3>,
        );
      } else if (level === 2) {
        blocks.push(
          <h4
            key={`h-${blockKey++}`}
            className="font-serif text-base font-semibold text-[#1C1917] mt-3 first:mt-0 mb-1"
          >
            {content}
          </h4>,
        );
      } else {
        blocks.push(
          <h5
            key={`h-${blockKey++}`}
            className="text-sm font-semibold text-[#1C1917] mt-2.5 first:mt-0 mb-1"
          >
            {content}
          </h5>,
        );
      }
      i += 1;
      continue;
    }

    // Unordered list (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, "");
        items.push(
          <li key={`uli-${items.length}`} className="leading-relaxed">
            {renderInline(itemText)}
          </li>,
        );
        i += 1;
      }
      blocks.push(
        <ul
          key={`ul-${blockKey++}`}
          className="list-disc pl-5 space-y-1.5 my-2 text-[#292524]"
        >
          {items}
        </ul>,
      );
      continue;
    }

    // Ordered list (1. 2. ...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
        items.push(
          <li key={`oli-${items.length}`} className="leading-relaxed">
            {renderInline(itemText)}
          </li>,
        );
        i += 1;
      }
      blocks.push(
        <ol
          key={`ol-${blockKey++}`}
          className="list-decimal pl-5 space-y-1.5 my-2 text-[#292524]"
        >
          {items}
        </ol>,
      );
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={`bq-${blockKey++}`}
          className="my-2 px-4 py-2.5 rounded-md bg-[#FBF9F5] border border-[#E5DFD3] text-[#44403C] italic leading-relaxed"
        >
          {renderInline(quoteLines.join(" "))}
        </blockquote>,
      );
      continue;
    }

    // Paragraph (collect consecutive non-empty plain lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3})\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^>\s?/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i += 1;
    }

    blocks.push(
      <p key={`p-${blockKey++}`} className="leading-[1.65] text-[#1C1917] my-2 first:mt-0 last:mb-0">
        {renderInline(paraLines.join(" "))}
      </p>,
    );
  }

  return <div className="text-[15px]">{blocks}</div>;
}
