'use client';

import React from 'react';
import { PubMedConfigPanel } from '@/components/admin/PubMedConfig';

export default function PubMedPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">PubMed Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure search queries and manage PubMed literature ingestion
        </p>
      </div>

      <PubMedConfigPanel />
    </div>
  );
}
