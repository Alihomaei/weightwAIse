'use client';

import React from 'react';
import { PubMedConfigPanel } from '@/components/admin/PubMedConfig';

export default function PubMedPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-medical-text">PubMed Integration</h1>
        <p className="text-sm text-medical-muted mt-1">
          Configure search queries and manage PubMed literature ingestion
        </p>
      </div>

      <PubMedConfigPanel />
    </div>
  );
}
