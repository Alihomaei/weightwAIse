'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelativeTime } from '@/lib/utils';
import {
  Users,
  MessageSquare,
  Database,
  BookOpen,
  TrendingUp,
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
      icon: <Users className="h-6 w-6" />,
      color: 'text-primary-600 bg-primary-100',
      trend: '+12%',
    },
    {
      label: 'Active Sessions',
      value: stats?.active_sessions ?? 0,
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'text-teal-600 bg-teal-100',
      trend: null,
    },
    {
      label: 'KB Chunks',
      value: stats?.kb_chunks ?? 0,
      icon: <Database className="h-6 w-6" />,
      color: 'text-purple-600 bg-purple-100',
      trend: null,
    },
    {
      label: 'PubMed Papers',
      value: stats?.pubmed_papers ?? 0,
      icon: <BookOpen className="h-6 w-6" />,
      color: 'text-amber-600 bg-amber-100',
      trend: null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-medical-text">Dashboard</h1>
        <p className="text-sm text-medical-muted mt-1">
          Overview of your weightwAIse instance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-medical-muted">{stat.label}</p>
                <p className="text-3xl font-bold text-medical-text mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Patients */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Patients</CardTitle>
          <a
            href="/admin/patients"
            className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            View all
          </a>
        </div>

        {stats?.recent_patients && stats.recent_patients.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_patients.slice(0, 5).map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-medical-text truncate">
                    {patient.full_name}
                  </p>
                  <p className="text-xs text-medical-muted">
                    @{patient.username} — {patient.sessions_count} session(s)
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={patient.intake_status === 'complete' ? 'success' : 'warning'}
                    dot
                  >
                    {patient.intake_status === 'complete' ? 'Complete' : 'In Progress'}
                  </Badge>
                  <span className="text-xs text-medical-muted whitespace-nowrap">
                    {formatRelativeTime(patient.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-medical-muted">No patients registered yet.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
