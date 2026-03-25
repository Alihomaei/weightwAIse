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

  // Position the popover near the citation button
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
      className="w-80 bg-white rounded-lg border border-medical-border shadow-xl p-4 animate-fade-in"
      role="tooltip"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-medical-muted">
          <FileText className="h-3.5 w-3.5" />
          <span>{isPubMed ? 'PubMed' : 'Guideline'}</span>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-gray-100 transition-colors"
          aria-label="Close citation"
        >
          <X className="h-3.5 w-3.5 text-medical-muted" />
        </button>
      </div>

      <h4 className="text-sm font-semibold text-medical-text mt-2 leading-snug">
        {citation.title || citation.source}
      </h4>

      {citation.authors && (
        <p className="text-xs text-medical-muted mt-1 line-clamp-2">
          {citation.authors}
        </p>
      )}

      {citation.journal && (
        <p className="text-xs text-teal-600 mt-0.5 italic">
          {citation.journal}
        </p>
      )}

      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100">
        {citation.page && (
          <span className="text-xs text-medical-muted">
            Page {citation.page}
          </span>
        )}
        {citation.section && (
          <span className="text-xs text-medical-muted">
            {citation.section}
          </span>
        )}
        {citation.pmid && (
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 transition-colors ml-auto"
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
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 transition-colors"
          >
            <span>{citation.pmc_id}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
