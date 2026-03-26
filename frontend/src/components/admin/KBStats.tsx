'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { KBStatsData } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Database, FileText, Image, BookOpen, ScrollText } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export function KBStats() {
  const { data: stats, isLoading } = useQuery<KBStatsData>({
    queryKey: ['kbStats'],
    queryFn: async () => {
      const res = await api.get<KBStatsData>('/api/admin/knowledge-base/stats');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!stats) return null;

  const s = stats as unknown as Record<string, unknown>;
  const totalChunks = (s.total_chunks as number) ?? 0;
  const textChunks = (s.text_chunks as number) ?? totalChunks;
  const imageChunks = (s.image_chunks as number) ?? 0;
  const guidelineDocs = (s.guideline_documents as number) ?? (s.active_sources as number) ?? (s.total_sources as number) ?? 0;
  const pubmedPapers = (s.pubmed_papers as number) ?? 0;

  const statCards = [
    {
      label: 'Total Chunks',
      value: totalChunks.toLocaleString(),
      icon: <Database className="h-4 w-4" />,
      color: 'text-primary-800 bg-primary-50',
    },
    {
      label: 'Text Chunks',
      value: textChunks.toLocaleString(),
      icon: <FileText className="h-4 w-4" />,
      color: 'text-teal-700 bg-teal-50',
    },
    {
      label: 'Image Chunks',
      value: imageChunks.toLocaleString(),
      icon: <Image className="h-4 w-4" />,
      color: 'text-purple-700 bg-purple-50',
    },
    {
      label: 'Guideline Docs',
      value: guidelineDocs.toString(),
      icon: <ScrollText className="h-4 w-4" />,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'PubMed Papers',
      value: pubmedPapers.toString(),
      icon: <BookOpen className="h-4 w-4" />,
      color: 'text-emerald-700 bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} padding="sm" hover>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-lg font-semibold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {stats.last_updated && (
        <p className="text-xs text-muted-foreground text-right">
          Last updated: {formatRelativeTime(stats.last_updated)}
        </p>
      )}
    </div>
  );
}
