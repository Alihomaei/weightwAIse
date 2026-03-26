'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PubMedConfig as PubMedConfigType, PubMedUpdateHistory, KBSource } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Spinner } from '@/components/ui/Spinner';
import { useToastStore } from '@/lib/store';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import {
  Plus,
  X,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export function PubMedConfigPanel() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [newQuery, setNewQuery] = useState('');
  const [localQueries, setLocalQueries] = useState<string[]>([]);
  const [maxResults, setMaxResults] = useState(50);

  const { data: config, isLoading: configLoading } = useQuery<PubMedConfigType>({
    queryKey: ['pubmedConfig'],
    queryFn: async () => {
      const res = await api.get<PubMedConfigType>('/api/admin/pubmed/config');
      return res.data;
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery<PubMedUpdateHistory[]>({
    queryKey: ['pubmedHistory'],
    queryFn: async () => {
      const res = await api.get<PubMedUpdateHistory[]>('/api/admin/pubmed/history');
      return res.data;
    },
  });

  const { data: papers, isLoading: papersLoading } = useQuery<KBSource[]>({
    queryKey: ['pubmedPapers'],
    queryFn: async () => {
      const res = await api.get<KBSource[]>('/api/admin/knowledge-base/sources', {
        params: { source_type: 'pubmed' },
      });
      return res.data;
    },
  });

  useEffect(() => {
    if (config) {
      setLocalQueries(config.queries);
      setMaxResults(config.max_results_per_query);
    }
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      await api.put('/api/admin/pubmed/config', {
        queries: localQueries,
        max_results_per_query: maxResults,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pubmedConfig'] });
      addToast('success', 'PubMed configuration saved.');
    },
    onError: () => {
      addToast('error', 'Failed to save configuration.');
    },
  });

  const triggerUpdate = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/admin/pubmed/update');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pubmedHistory'] });
      queryClient.invalidateQueries({ queryKey: ['pubmedPapers'] });
      queryClient.invalidateQueries({ queryKey: ['kbStats'] });
      addToast(
        'success',
        `Update complete: ${data.new_papers} new papers, ${data.total_chunks} chunks created.`
      );
    },
    onError: () => {
      addToast('error', 'PubMed update failed. Check server logs.');
    },
  });

  const addQuery = () => {
    if (newQuery.trim() && !localQueries.includes(newQuery.trim())) {
      setLocalQueries((prev) => [...prev, newQuery.trim()]);
      setNewQuery('');
    }
  };

  const removeQuery = (index: number) => {
    setLocalQueries((prev) => prev.filter((_, i) => i !== index));
  };

  if (configLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Queries */}
      <Card>
        <CardTitle>Search Queries</CardTitle>
        <CardDescription>
          Configure the PubMed search queries used to find relevant literature.
        </CardDescription>

        <Separator className="my-4" />

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., bariatric surgery outcomes 2024"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuery()}
            />
            <Button
              variant="outline"
              onClick={addQuery}
              icon={<Plus className="h-4 w-4" />}
            >
              Add
            </Button>
          </div>

          <div className="space-y-1.5">
            {localQueries.map((query, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground flex-1">{query}</span>
                <button
                  onClick={() => removeQuery(index)}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                  aria-label={`Remove query: ${query}`}
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
            {localQueries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No search queries configured. Add one above.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-foreground whitespace-nowrap">
              Max results per query:
            </label>
            <Input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
              className="w-24"
              min={1}
              max={200}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => saveConfig.mutate()}
              isLoading={saveConfig.isPending}
            >
              Save Configuration
            </Button>
            <Button
              variant="secondary"
              onClick={() => triggerUpdate.mutate()}
              isLoading={triggerUpdate.isPending}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Update Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Update History */}
      <Card>
        <CardTitle>Update History</CardTitle>
        <Separator className="my-4" />
        <div>
          {historyLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-1.5">
              {history.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-muted/30 rounded-lg text-sm"
                >
                  {entry.errors.length === 0 ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className="font-medium text-foreground">
                      {entry.new_papers} papers
                    </span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-muted-foreground">
                      {entry.total_chunks} chunks
                    </span>
                    {entry.errors.length > 0 && (
                      <span className="text-amber-600 ml-2">
                        ({entry.errors.length} errors)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(entry.completed_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No update history yet.
            </p>
          )}
        </div>
      </Card>

      {/* Ingested Papers Table */}
      <Card padding="none">
        <div className="px-6 py-4">
          <CardTitle>Ingested Papers</CardTitle>
        </div>
        <Separator />
        <div className="overflow-x-auto">
          {papersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : papers && papers.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">PMID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Authors</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                  <th className="text-right py-3 px-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">Chunks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {papers.map((paper) => (
                  <tr
                    key={paper.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-6 max-w-xs truncate text-foreground">
                      {paper.title || 'Untitled'}
                    </td>
                    <td className="py-3 px-4">
                      {paper.pubmed_id ? (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pubmed_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-700 hover:underline flex items-center gap-1"
                        >
                          {paper.pubmed_id}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-muted-foreground">
                      {paper.authors || '-'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {paper.publication_date || '-'}
                    </td>
                    <td className="py-3 px-6 text-right text-foreground tabular-nums">
                      {paper.total_chunks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No PubMed papers ingested yet.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
