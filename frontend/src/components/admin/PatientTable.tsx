'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PatientSummary, PatientIntake, ChatSession } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Separator } from '@/components/ui/Separator';
import { Spinner } from '@/components/ui/Spinner';
import { useToastStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import {
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Download,
  MessageSquare,
  ClipboardCheck,
  User,
} from 'lucide-react';

type SortField = 'full_name' | 'created_at' | 'sessions_count' | 'intake_status';
type SortDirection = 'asc' | 'desc';

export function PatientTable() {
  const addToast = useToastStore((s) => s.addToast);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: patients, isLoading } = useQuery<PatientSummary[]>({
    queryKey: ['adminPatients'],
    queryFn: async () => {
      const res = await api.get<PatientSummary[]>('/api/admin/patients');
      return res.data;
    },
  });

  const { data: patientIntake, isLoading: intakeLoading } = useQuery<PatientIntake>({
    queryKey: ['patientIntake', selectedPatient?.user_id],
    queryFn: async () => {
      const res = await api.get<PatientIntake>(
        `/api/admin/patients/${selectedPatient!.user_id}/intake`
      );
      return res.data;
    },
    enabled: !!selectedPatient,
  });

  const { data: patientSessions } = useQuery<ChatSession[]>({
    queryKey: ['patientSessions', selectedPatient?.user_id],
    queryFn: async () => {
      const res = await api.get<ChatSession[]>(
        `/api/admin/patients/${selectedPatient!.user_id}/sessions`
      );
      return res.data;
    },
    enabled: !!selectedPatient,
  });

  const filtered = (patients || [])
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'full_name':
          return a.full_name.localeCompare(b.full_name) * dir;
        case 'created_at':
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        case 'sessions_count':
          return (a.sessions_count - b.sessions_count) * dir;
        case 'intake_status':
          return a.intake_status.localeCompare(b.intake_status) * dir;
        default:
          return 0;
      }
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  const handleDownloadReport = async (userId: string) => {
    try {
      const response = await api.get(`/api/reports/patients/${userId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient-report-${userId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      addToast('error', 'Failed to download report.');
    }
  };

  const openDetail = (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search patients by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                {[
                  { key: 'full_name' as SortField, label: 'Name' },
                  { key: 'created_at' as SortField, label: 'Registered' },
                  { key: 'intake_status' as SortField, label: 'Intake' },
                  { key: 'sessions_count' as SortField, label: 'Sessions' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <SortIcon field={key} />
                    </div>
                  </th>
                ))}
                <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No patients match your search.' : 'No patients registered yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{patient.full_name}</p>
                          <p className="text-xs text-muted-foreground">@{patient.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatDate(patient.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={patient.intake_status === 'complete' ? 'success' : 'warning'}
                        dot
                      >
                        {patient.intake_status === 'complete' ? 'Complete' : 'In Progress'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground tabular-nums">
                      {patient.sessions_count}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => openDetail(patient)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label="View patient details"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(patient.user_id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-teal-700 transition-colors"
                          aria-label="Download patient report"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPatient(null);
        }}
        title={selectedPatient?.full_name || 'Patient Details'}
        size="xl"
      >
        {selectedPatient && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Intake Data */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <ClipboardCheck className="h-4 w-4 text-teal-600" />
                Intake Data
              </h4>
              {intakeLoading ? (
                <Spinner size="sm" />
              ) : patientIntake ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Age', value: patientIntake.age },
                    { label: 'Sex', value: patientIntake.sex },
                    { label: 'Height (cm)', value: patientIntake.height_cm },
                    { label: 'Weight (kg)', value: patientIntake.weight_kg },
                    { label: 'BMI', value: patientIntake.bmi?.toFixed(1) },
                    { label: 'Smoking', value: patientIntake.smoking_status },
                    { label: 'Alcohol', value: patientIntake.alcohol_use },
                    { label: 'Exercise', value: patientIntake.exercise_frequency },
                    { label: 'Occupation', value: patientIntake.occupation },
                    { label: 'Status', value: patientIntake.intake_status },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-medium text-foreground">
                        {value ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No intake data available.</p>
              )}
            </div>

            <Separator />

            {/* Sessions */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary-700" />
                Chat Sessions ({patientSessions?.length || 0})
              </h4>
              {patientSessions && patientSessions.length > 0 ? (
                <div className="space-y-1.5">
                  {patientSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5"
                    >
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {session.session_type} session
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.decision_path && (
                          <Badge variant="info">{session.decision_path}</Badge>
                        )}
                        <Badge
                          variant={session.status === 'completed' ? 'success' : session.status === 'active' ? 'info' : 'muted'}
                          dot
                        >
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sessions yet.</p>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport(selectedPatient.user_id)}
                icon={<Download className="h-3.5 w-3.5" />}
              >
                Download Report
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
