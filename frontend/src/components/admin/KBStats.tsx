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

  const statCards = [
    {
      label: 'Total Chunks',
      value: stats.total_chunks.toLocaleString(),
      icon: <Database className="h-5 w-5" />,
      color: 'text-primary-600 bg-primary-100',
    },
    {
      label: 'Text Chunks',
      value: stats.text_chunks.toLocaleString(),
      icon: <FileText className="h-5 w-5" />,
      color: 'text-teal-600 bg-teal-100',
    },
    {
      label: 'Image Chunks',
      value: stats.image_chunks.toLocaleString(),
      icon: <Image className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      label: 'Guideline Docs',
      value: stats.guideline_documents.toString(),
      icon: <ScrollText className="h-5 w-5" />,
      color: 'text-amber-600 bg-amber-100',
    },
    {
      label: 'PubMed Papers',
      value: stats.pubmed_papers.toString(),
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-xl font-bold text-medical-text">{stat.value}</p>
              <p className="text-xs text-medical-muted">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
      {stats.last_updated && (
        <div className="col-span-full text-xs text-medical-muted text-right">
          Last updated: {formatRelativeTime(stats.last_updated)}
        </div>
      )}
    </div>
  );
}
