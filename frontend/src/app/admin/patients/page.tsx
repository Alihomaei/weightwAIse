'use client';

import React from 'react';
import { PatientTable } from '@/components/admin/PatientTable';

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-medical-text">Patient Records</h1>
        <p className="text-sm text-medical-muted mt-1">
          View and manage patient records, intake data, and session history
        </p>
      </div>

      <PatientTable />
    </div>
  );
}
