'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { KBSource } from '@/lib/types';
import { FileUploader } from '@/components/admin/FileUploader';
import { KBStats } from '@/components/admin/KBStats';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useToastStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Film,
  FileType,
  Presentation,
  Trash2,
  Plus,
  Search,
} from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  guideline_pdf: <FileText className="h-4 w-4 text-red-500" />,
  guideline_pptx: <Presentation className="h-4 w-4 text-orange-500" />,
  guideline_video: <Film className="h-4 w-4 text-purple-500" />,
  guideline_text: <FileType className="h-4 w-4 text-blue-500" />,
  pubmed: <FileText className="h-4 w-4 text-emerald-500" />,
};

const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  processing: 'info',
  archived: 'muted' as 'info',
  failed: 'danger',
};

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch sources
  const { data: sources, isLoading } = useQuery<KBSource[]>({
    queryKey: ['kbSources'],
    queryFn: async () => {
      const res = await api.get<KBSource[]>('/api/admin/knowledge-base/sources');
      return res.data;
    },
  });

  // Delete source mutation
  const deleteMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      await api.delete(`/api/admin/knowledge-base/sources/${sourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kbSources'] });
      queryClient.invalidateQueries({ queryKey: ['kbStats'] });
      addToast('success', 'Source deleted successfully.');
    },
    onError: () => {
      addToast('error', 'Failed to delete source.');
    },
  });

  const handleDelete = (source: KBSource) => {
    if (confirm(`Delete "${source.filename || source.title}"? This will remove all associated chunks.`)) {
      deleteMutation.mutate(source.id);
    }
  };

  const filteredSources = (sources || []).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.filename?.toLowerCase().includes(q)) ||
      (s.title?.toLowerCase().includes(q))
    );
  });

  const guidelineSources = filteredSources.filter((s) => s.source_type !== 'pubmed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-medical-text">Knowledge Base</h1>
          <p className="text-sm text-medical-muted mt-1">
            Manage uploaded guidelines and documents
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowUploadModal(true)}
        >
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <KBStats />

      {/* Source Table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-medical-border flex items-center justify-between">
          <CardTitle className="mb-0">Guideline Documents</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-medical-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-medical-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : guidelineSources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-medical-border">
                  <th className="text-left py-3 px-5 font-medium text-medical-muted">File</th>
                  <th className="text-left py-3 px-4 font-medium text-medical-muted">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-medical-muted">Chunks</th>
                  <th className="text-left py-3 px-4 font-medium text-medical-muted">Ingested</th>
                  <th className="text-left py-3 px-4 font-medium text-medical-muted">Status</th>
                  <th className="text-right py-3 px-5 font-medium text-medical-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guidelineSources.map((source) => (
                  <tr
                    key={source.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        {typeIcons[source.source_type] || <FileType className="h-4 w-4 text-gray-400" />}
                        <span className="font-medium text-medical-text truncate max-w-xs">
                          {source.filename || source.title || 'Untitled'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-medical-muted">
                      {source.source_type.replace('guideline_', '').toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-right text-medical-text">
                      {source.total_chunks}
                    </td>
                    <td className="py-3 px-4 text-medical-muted whitespace-nowrap">
                      {formatDate(source.ingested_at)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={statusVariants[source.status] || 'default'}
                        dot
                      >
                        {source.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handleDelete(source)}
                        className="p-1.5 rounded-lg text-medical-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label="Delete source"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-medical-muted">No documents uploaded yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowUploadModal(true)}
            >
              Upload your first document
            </Button>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Documents"
        size="lg"
      >
        <FileUploader
          onUploadComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['kbSources'] });
            queryClient.invalidateQueries({ queryKey: ['kbStats'] });
            setShowUploadModal(false);
          }}
        />
      </Modal>
    </div>
  );
}
