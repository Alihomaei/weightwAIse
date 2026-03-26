'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Separator } from '@/components/ui/Separator';
import { formatRelativeTime } from '@/lib/utils';
import {
  Users,
  MessageSquare,
  Database,
  BookOpen,
  User,
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get<DashboardStats>('/api/admin/dashboard');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Patients',
      value: stats?.total_patients ?? 0,
      icon: <Users className="h-5 w-5" />,
      color: 'text-primary-800 bg-primary-50',
    },
    {
      label: 'Active Sessions',
      value: stats?.active_sessions ?? 0,
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'text-teal-700 bg-teal-50',
    },
    {
      label: 'KB Chunks',
      value: stats?.kb_chunks ?? 0,
      icon: <Database className="h-5 w-5" />,
      color: 'text-purple-700 bg-purple-50',
    },
    {
      label: 'PubMed Papers',
      value: stats?.pubmed_papers ?? 0,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-amber-700 bg-amber-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your weightwAIse instance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} hover padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Patients */}
      <Card padding="none">
        <div className="flex items-center justify-between px-6 py-4">
          <CardTitle>Recent Patients</CardTitle>
          <a
            href="/admin/patients"
            className="text-sm text-primary-700 hover:text-primary-900 font-medium transition-colors"
          >
            View all
          </a>
        </div>
        <Separator />

        {stats?.recent_patients && stats.recent_patients.length > 0 ? (
          <div className="divide-y">
            {stats.recent_patients.slice(0, 5).map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {patient.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{patient.username} -- {patient.sessions_count} session(s)
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={patient.intake_status === 'complete' ? 'success' : 'warning'}
                    dot
                  >
                    {patient.intake_status === 'complete' ? 'Complete' : 'In Progress'}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(patient.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No patients registered yet.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
