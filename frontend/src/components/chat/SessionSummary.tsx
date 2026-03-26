'use client';

import React from 'react';
import { ChatSession } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Download, ArrowRight, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToastStore } from '@/lib/store';

interface SessionSummaryProps {
  session: ChatSession;
  onNewSession: () => void;
}

const decisionLabels: Record<string, { label: string; color: string }> = {
  lifestyle: { label: 'Lifestyle Modification', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' },
  pharmacotherapy: { label: 'Pharmacotherapy', color: 'bg-blue-50 text-blue-700 border border-blue-200/60' },
  surgery: { label: 'Surgical Consultation', color: 'bg-amber-50 text-amber-700 border border-amber-200/60' },
};

export function SessionSummary({ session, onNewSession }: SessionSummaryProps) {
  const addToast = useToastStore((s) => s.addToast);

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/api/reports/sessions/${session.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-summary-${session.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast('success', 'Report downloaded successfully.');
    } catch {
      addToast('error', 'Failed to download report. Please try again.');
    }
  };

  const decision = session.decision_path
    ? decisionLabels[session.decision_path]
    : null;

  return (
    <div className="animate-slide-up space-y-4 max-w-lg mx-auto">
      <Card padding="lg" className="text-center">
        <div className="flex justify-center mb-5">
          <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
        </div>

        <CardTitle className="text-lg mb-2">Session Complete</CardTitle>
        <p className="text-sm text-muted-foreground mb-6">
          Thank you for completing your consultation. Here is a summary of your session.
        </p>

        {/* Decision Path */}
        {decision && (
          <div className="mb-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">
              Recommended Path
            </p>
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${decision.color}`}>
              {decision.label}
            </span>
          </div>
        )}

        {/* Summary Text */}
        {session.recommendation_summary && (
          <div className="text-left bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">
              Summary
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {session.recommendation_summary}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            icon={<Download className="h-4 w-4" />}
            onClick={handleDownloadPDF}
            className="w-full"
          >
            Download PDF Report
          </Button>
          <Button
            variant="outline"
            size="lg"
            icon={<ArrowRight className="h-4 w-4" />}
            onClick={onNewSession}
            className="w-full"
          >
            Start New Session
          </Button>
        </div>
      </Card>
    </div>
  );
}
