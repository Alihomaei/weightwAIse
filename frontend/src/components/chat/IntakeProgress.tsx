'use client';

import React, { useState } from 'react';
import { IntakeProgress as IntakeProgressType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/Progress';
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
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <ClipboardList className="h-3.5 w-3.5 text-teal-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground">
              Intake Progress
            </span>
            <span className="text-xs font-semibold text-teal-600">
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} />
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded checklist */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t animate-fade-in">
          <div className="grid grid-cols-2 gap-1 mt-2">
            {progress.collected_fields.map((field) => (
              <div
                key={field}
                className="flex items-center gap-1.5 text-xs text-emerald-600"
              >
                <CheckCircle className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {FIELD_LABELS[field] || field}
                </span>
              </div>
            ))}
            {progress.remaining_fields.map((field) => (
              <div
                key={field}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Circle className="h-3 w-3 shrink-0" />
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
