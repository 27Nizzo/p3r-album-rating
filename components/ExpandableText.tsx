'use client';

import { useState } from 'react';
import { sfx } from '@/lib/sfx';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

export default function ExpandableText({ text, maxLength = 150 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`;

  const toggleExpand = () => {
    sfx.playClick();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-mono text-persona-white/90 leading-relaxed pt-1 break-words whitespace-pre-line">
        {displayText}
      </p>

      {shouldTruncate && (
        <button
          type="button"
          onClick={toggleExpand}
          onMouseEnter={() => sfx.playHover()}
          className="text-[10px] font-mono text-persona-cyan hover:underline uppercase font-bold tracking-wider cursor-pointer transition-colors block pt-0.5"
        >
          {isExpanded ? '[ SHOW LESS ]' : '[ SHOW MORE ]'}
        </button>
      )}
    </div>
  );
}