'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PubMedConfig as PubMedConfigType, PubMedUpdateHistory, KBSource } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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

  // Fetch current config
  const { data: config, isLoading: configLoading } = useQuery<PubMedConfigType>({
    queryKey: ['pubmedConfig'],
    queryFn: async () => {
      const res = await api.get<PubMedConfigType>('/api/admin/pubmed/config');
      return res.data;
    },
  });

  // Fetch update history
  const { data: history, isLoading: historyLoading } = useQuery<PubMedUpdateHistory[]>({
    queryKey: ['pubmedHistory'],
    queryFn: async () => {
      const res = await api.get<PubMedUpdateHistory[]>('/api/admin/pubmed/history');
      return res.data;
    },
  });

  // Fetch ingested papers
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

  // Save config mutation
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

  // Trigger update mutation
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

        <div className="mt-4 space-y-3">
          {/* Add new query */}
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

          {/* Query list */}
          <div className="space-y-2">
            {localQueries.map((query, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
              >
                <Search className="h-4 w-4 text-medical-muted shrink-0" />
                <span className="text-sm text-medical-text flex-1">{query}</span>
                <button
                  onClick={() => removeQuery(index)}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  aria-label={`Remove query: ${query}`}
                >
                  <X className="h-3.5 w-3.5 text-medical-muted" />
                </button>
              </div>
            ))}
            {localQueries.length === 0 && (
              <p className="text-sm text-medical-muted text-center py-4">
                No search queries configured. Add one above.
              </p>
            )}
          </div>

          {/* Max results */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-medical-text whitespace-nowrap">
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

          {/* Save and Update buttons */}
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
        <div className="mt-4">
          {historyLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2">
              {history.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm"
                >
                  {entry.errors.length === 0 ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className="font-medium text-medical-text">
                      {entry.new_papers} papers
                    </span>
                    <span className="text-medical-muted mx-1">/</span>
                    <span className="text-medical-muted">
                      {entry.total_chunks} chunks
                    </span>
                    {entry.errors.length > 0 && (
                      <span className="text-amber-600 ml-2">
                        ({entry.errors.length} errors)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-medical-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(entry.completed_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-medical-muted text-center py-4">
              No update history yet.
            </p>
          )}
        </div>
      </Card>

      {/* Ingested Papers Table */}
      <Card>
        <CardTitle>Ingested Papers</CardTitle>
        <div className="mt-4 overflow-x-auto">
          {papersLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : papers && papers.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-medical-border">
                  <th className="text-left py-2 px-3 font-medium text-medical-muted">Title</th>
                  <th className="text-left py-2 px-3 font-medium text-medical-muted">PMID</th>
                  <th className="text-left py-2 px-3 font-medium text-medical-muted">Authors</th>
                  <th className="text-left py-2 px-3 font-medium text-medical-muted">Date</th>
                  <th className="text-right py-2 px-3 font-medium text-medical-muted">Chunks</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((paper) => (
                  <tr
                    key={paper.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2.5 px-3 max-w-xs truncate text-medical-text">
                      {paper.title || 'Untitled'}
                    </td>
                    <td className="py-2.5 px-3">
                      {paper.pubmed_id ? (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pubmed_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline flex items-center gap-1"
                        >
                          {paper.pubmed_id}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-medical-muted">
                      {paper.authors || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-medical-muted whitespace-nowrap">
                      {paper.publication_date || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-medical-text">
                      {paper.total_chunks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-medical-muted text-center py-4">
              No PubMed papers ingested yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
