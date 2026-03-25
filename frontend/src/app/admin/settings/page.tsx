'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ClinicInfo, SystemPrompts } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useToastStore } from '@/lib/store';
import { Building2, Save, FileCode } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  // ─── Clinic Info ──────────────────────────────────────────────────────

  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    name: '',
    address: '',
    phone: '',
    hours: '',
    booking_url: '',
  });

  const { data: savedClinicInfo, isLoading: clinicLoading } = useQuery<ClinicInfo>({
    queryKey: ['clinicInfo'],
    queryFn: async () => {
      const res = await api.get('/api/admin/config/clinic_info');
      return res.data.value as ClinicInfo;
    },
  });

  useEffect(() => {
    if (savedClinicInfo) {
      setClinicInfo(savedClinicInfo);
    }
  }, [savedClinicInfo]);

  const saveClinic = useMutation({
    mutationFn: async () => {
      await api.put('/api/admin/config/clinic_info', { value: clinicInfo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicInfo'] });
      addToast('success', 'Clinic information saved.');
    },
    onError: () => {
      addToast('error', 'Failed to save clinic information.');
    },
  });

  // ─── System Prompts ───────────────────────────────────────────────────

  const [prompts, setPrompts] = useState<SystemPrompts>({
    intake: '',
    consultation: '',
    surgery_discussion: '',
  });

  const { data: savedPrompts, isLoading: promptsLoading } = useQuery<SystemPrompts>({
    queryKey: ['systemPrompts'],
    queryFn: async () => {
      const res = await api.get('/api/admin/config/system_prompts');
      return res.data.value as SystemPrompts;
    },
  });

  useEffect(() => {
    if (savedPrompts) {
      setPrompts(savedPrompts);
    }
  }, [savedPrompts]);

  const savePrompts = useMutation({
    mutationFn: async () => {
      await api.put('/api/admin/config/system_prompts', { value: prompts });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemPrompts'] });
      addToast('success', 'System prompts saved.');
    },
    onError: () => {
      addToast('error', 'Failed to save system prompts.');
    },
  });

  if (clinicLoading || promptsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-medical-text">Settings</h1>
        <p className="text-sm text-medical-muted mt-1">
          Configure clinic information and system behavior
        </p>
      </div>

      {/* Clinic Information */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary-600" />
          <CardTitle className="mb-0">Clinic Information</CardTitle>
        </div>
        <CardDescription>
          This information is shown to patients when a clinic visit is recommended.
        </CardDescription>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Clinic Name"
            value={clinicInfo.name}
            onChange={(e) => setClinicInfo({ ...clinicInfo, name: e.target.value })}
            placeholder="e.g., Metro Bariatric Center"
          />
          <Input
            label="Phone Number"
            value={clinicInfo.phone}
            onChange={(e) => setClinicInfo({ ...clinicInfo, phone: e.target.value })}
            placeholder="e.g., (555) 123-4567"
          />
          <div className="md:col-span-2">
            <Input
              label="Address"
              value={clinicInfo.address}
              onChange={(e) => setClinicInfo({ ...clinicInfo, address: e.target.value })}
              placeholder="e.g., 123 Medical Dr, Suite 100, City, State 12345"
            />
          </div>
          <Input
            label="Office Hours"
            value={clinicInfo.hours}
            onChange={(e) => setClinicInfo({ ...clinicInfo, hours: e.target.value })}
            placeholder="e.g., Mon-Fri 8AM-5PM"
          />
          <Input
            label="Booking URL"
            value={clinicInfo.booking_url}
            onChange={(e) => setClinicInfo({ ...clinicInfo, booking_url: e.target.value })}
            placeholder="https://booking.example.com"
          />
        </div>

        <div className="mt-4">
          <Button
            variant="primary"
            onClick={() => saveClinic.mutate()}
            isLoading={saveClinic.isPending}
            icon={<Save className="h-4 w-4" />}
          >
            Save Clinic Info
          </Button>
        </div>
      </Card>

      {/* System Prompts */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <FileCode className="h-5 w-5 text-teal-600" />
          <CardTitle className="mb-0">System Prompts</CardTitle>
        </div>
        <CardDescription>
          Customize the LLM system prompts for each conversation phase. These control the AI&apos;s behavior and tone.
        </CardDescription>

        <div className="mt-4 space-y-5">
          {/* Intake Prompt */}
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">
              Intake Phase Prompt
            </label>
            <textarea
              value={prompts.intake}
              onChange={(e) => setPrompts({ ...prompts, intake: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-medical-border px-3 py-2 text-sm text-medical-text font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
              placeholder="System prompt for the patient intake phase..."
            />
            <p className="text-xs text-medical-muted mt-1">
              Guides the AI during patient data collection. Include instructions about which fields to gather.
            </p>
          </div>

          {/* Consultation Prompt */}
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">
              Consultation Phase Prompt
            </label>
            <textarea
              value={prompts.consultation}
              onChange={(e) => setPrompts({ ...prompts, consultation: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-medical-border px-3 py-2 text-sm text-medical-text font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
              placeholder="System prompt for the consultation/recommendation phase..."
            />
            <p className="text-xs text-medical-muted mt-1">
              Guides the AI during clinical assessment and treatment recommendation.
            </p>
          </div>

          {/* Surgery Discussion Prompt */}
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">
              Surgery Discussion Prompt
            </label>
            <textarea
              value={prompts.surgery_discussion}
              onChange={(e) => setPrompts({ ...prompts, surgery_discussion: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-medical-border px-3 py-2 text-sm text-medical-text font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
              placeholder="System prompt for discussing surgical options..."
            />
            <p className="text-xs text-medical-muted mt-1">
              Guides the AI when discussing specific surgical procedures, risks, and benefits.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="primary"
            onClick={() => savePrompts.mutate()}
            isLoading={savePrompts.isPending}
            icon={<Save className="h-4 w-4" />}
          >
            Save System Prompts
          </Button>
        </div>
      </Card>
    </div>
  );
}
