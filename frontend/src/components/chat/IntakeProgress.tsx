'use client';

import React, { useState } from 'react';
import { IntakeProgress as IntakeProgressType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';

interface IntakeProgressProps {
  progress: IntakeProgressType | null;
}

const FIELD_LABELS: Record<string, string> = {
  age: 'Age',
  sex: 'Sex',
  height_cm: 'Height',
  weight_kg: 'Weight',
  bmi: 'BMI',
  waist_circumference_cm: 'Waist Circumference',
  comorbidities: 'Medical Conditions',
  previous_diets: 'Previous Diets',
  previous_medications: 'Previous Medications',
  previous_surgeries: 'Previous Surgeries',
  binge_eating_screen: 'Binge Eating Screen',
  emotional_eating: 'Emotional Eating',
  eating_disorder_history: 'Eating Disorder History',
  mental_health_conditions: 'Mental Health',
  family_obesity_history: 'Family Obesity History',
  family_diabetes_history: 'Family Diabetes History',
  smoking_status: 'Smoking Status',
  alcohol_use: 'Alcohol Use',
  exercise_frequency: 'Exercise Frequency',
  occupation: 'Occupation',
  support_system: 'Support System',
  previous_abdominal_surgeries: 'Abdominal Surgery History',
  anesthesia_complications: 'Anesthesia History',
};

export function IntakeProgressBar({ progress }: IntakeProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!progress) return null;

  const percentage = Math.round(progress.percentage);

  return (
    <div className="bg-white border border-medical-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <ClipboardList className="h-4 w-4 text-teal-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-medical-text">
              Intake Progress
            </span>
            <span className="text-xs font-semibold text-teal-700">
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-medical-muted shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-medical-muted shrink-0" />
        )}
      </button>

      {/* Expanded checklist */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t border-gray-100 animate-fade-in">
          <div className="grid grid-cols-2 gap-1 mt-2">
            {/* Collected fields */}
            {progress.collected_fields.map((field) => (
              <div
                key={field}
                className="flex items-center gap-1.5 text-xs text-emerald-600"
              >
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {FIELD_LABELS[field] || field}
                </span>
              </div>
            ))}
            {/* Remaining fields */}
            {progress.remaining_fields.map((field) => (
              <div
                key={field}
                className="flex items-center gap-1.5 text-xs text-medical-muted"
              >
                <Circle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {FIELD_LABELS[field] || field}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
