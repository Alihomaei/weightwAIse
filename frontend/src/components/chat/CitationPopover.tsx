'use client';

import React, { useEffect, useRef } from 'react';
import { Citation } from '@/lib/types';
import { ExternalLink, FileText, X } from 'lucide-react';

interface CitationPopoverProps {
  citation: Citation;
  anchorRect: DOMRect;
  onClose: () => void;
}

export function CitationPopover({ citation, anchorRect, onClose }: CitationPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchorRect.bottom + 8,
    left: Math.min(anchorRect.left, window.innerWidth - 320),
    zIndex: 60,
  };

  const isPubMed = !!citation.pmid;

  return (
    <div
      ref={ref}
      style={style}
      className="w-80 bg-popover rounded-xl border shadow-lg p-4 animate-fade-in"
      role="tooltip"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span>{isPubMed ? 'PubMed' : 'Guideline'}</span>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded-md hover:bg-muted transition-colors"
          aria-label="Close citation"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <h4 className="text-sm font-semibold text-foreground mt-2 leading-snug">
        {citation.title || citation.source}
      </h4>

      {citation.authors && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {citation.authors}
        </p>
      )}

      {citation.journal && (
        <p className="text-xs text-teal-600 mt-0.5 italic">
          {citation.journal}
        </p>
      )}

      <div className="flex items-center gap-3 mt-3 pt-2 border-t">
        {citation.page && (
          <span className="text-xs text-muted-foreground">
            Page {citation.page}
          </span>
        )}
        {citation.section && (
          <span className="text-xs text-muted-foreground">
            {citation.section}
          </span>
        )}
        {citation.pmid && (
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary-700 hover:text-primary-900 transition-colors ml-auto"
          >
            <span>PMID: {citation.pmid}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {citation.pmc_id && (
          <a
            href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${citation.pmc_id}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary-700 hover:text-primary-900 transition-colors"
          >
            <span>{citation.pmc_id}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
