'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import api, { API_BASE_URL } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { useAuthStore, useToastStore } from '@/lib/store';
import { ChatSession } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Plus,
  Download,
  MessageSquare,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SessionSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function decisionLabel(path: string | null): string | null {
  if (!path) return null;
  const labels: Record<string, string> = {
    lifestyle: 'Lifestyle',
    pharmacotherapy: 'Medication',
    surgery_candidate: 'Surgery',
    surgery_urgent: 'Surgery (Urgent)',
    needs_psych_eval: 'Psych Eval',
    contraindicated: 'Contraindicated',
    consultation: 'Consultation',
  };
  return labels[path] || path;
}

export function SessionSidebar({
  currentSessionId,
  onSelectSession,
  onNewSession,
  mobileOpen,
  onMobileClose,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);

  // Fetch sessions
  useEffect(() => {
    let mounted = true;
    const fetchSessions = async () => {
      try {
        const res = await api.get<ChatSession[]>('/api/chat/sessions');
        if (mounted) setSessions(res.data);
      } catch {
        // silent
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [currentSessionId]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSelect = (id: string) => {
    onSelectSession(id);
    onMobileClose();
  };

  const handleNew = () => {
    onNewSession();
    onMobileClose();
  };

  const handleDownloadPdf = async (e: React.MouseEvent, sess: ChatSession) => {
    e.stopPropagation();
    setDownloading(sess.id);
    try {
      const token = getAccessToken();
      if (sess.status === 'active') {
        await api.post(`/api/chat/sessions/${sess.id}/end`);
        setSessions((prev) => prev.map((s) => s.id === sess.id ? { ...s, status: 'completed' } : s));
      }
      const res = await fetch(`${API_BASE_URL}/api/reports/${sess.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weightwaise_report_${sess.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('error', 'PDF download failed. Session may not have a completed consultation.');
    } finally {
      setDownloading(null);
    }
  };

  // Desktop collapsed rail (hidden on mobile)
  if (collapsed) {
    return (
      <div className="hidden md:flex w-12 bg-[#0f1b2d] flex-col items-center py-4 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="mt-4">
          <button
            onClick={onNewSession}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 mt-4 overflow-y-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                s.id === currentSessionId
                  ? 'bg-white/15 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              )}
              title={formatDate(s.created_at)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Sidebar — drawer on mobile, static column on desktop */}
      <aside
        className={cn(
          'bg-[#0f1b2d] flex flex-col text-white',
          // Mobile: fixed drawer with slide transition
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static column
          'md:static md:translate-x-0 md:w-72 md:shrink-0'
        )}
        aria-hidden={!mobileOpen ? 'true' : undefined}
      >
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="WeightwAIse" width={80} height={35} className="h-6 w-auto brightness-200" />
          </div>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(true)}
            className="hidden md:block p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 py-3">
          <button
            onClick={handleNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Consultation
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 px-2 mb-2">
            Sessions
          </p>
          <div className="space-y-1">
            {sessions.length === 0 && (
              <p className="text-xs text-slate-500 px-2 py-4 text-center">No sessions yet</p>
            )}
            {sessions.map((s) => {
              const isActive = s.id === currentSessionId;
              const isCompleted = s.status === 'completed';
              const decision = decisionLabel(s.decision_path);

              return (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl transition-all group',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                        )}
                        <span className="text-xs font-medium truncate">
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      {decision && (
                        <span className="text-[10px] text-teal-400 mt-0.5 block">{decision}</span>
                      )}
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {formatDate(s.created_at)}
                      </span>
                    </div>

                    {decision && (
                      <button
                        onClick={(e) => handleDownloadPdf(e, s)}
                        disabled={downloading === s.id}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors shrink-0',
                          // On mobile, show PDF button always (no hover); on desktop, show on hover
                          downloading === s.id
                            ? 'text-slate-500'
                            : 'text-slate-400 hover:text-white hover:bg-white/10 md:opacity-0 md:group-hover:opacity-100'
                        )}
                        title="Download PDF report"
                      >
                        <Download className={cn('h-3.5 w-3.5', downloading === s.id && 'animate-pulse')} />
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center text-xs font-semibold">
              {(user?.full_name || user?.username || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-slate-500 truncate">Patient</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
