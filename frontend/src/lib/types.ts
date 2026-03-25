// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'patient';
export type Language = 'en' | 'es';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  full_name: string | null;
  language_preference: Language;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: UserRole;
  full_name?: string;
  language_preference?: Language;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Patient Intake ─────────────────────────────────────────────────────────

export interface Comorbidities {
  t2dm?: boolean;
  htn?: boolean;
  osa?: boolean;
  gerd?: boolean;
  dyslipidemia?: boolean;
  pcos?: boolean;
  nafld?: boolean;
  depression?: boolean;
  other?: string[];
}

export interface PreviousDiet {
  type: string;
  duration_months: number;
  max_weight_loss_kg: number;
  regained: boolean;
}

export interface PreviousMedication {
  name: string;
  dose: string;
  duration_months: number;
  outcome: string;
}

export interface PreviousSurgery {
  type: string;
  year: number;
  outcome: string;
  complications: string[];
}

export type IntakeStatus = 'in_progress' | 'complete';

export interface PatientIntake {
  id: string;
  user_id: string;
  // Demographics & Anthropometrics
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  waist_circumference_cm: number | null;
  // Comorbidities
  comorbidities: Comorbidities;
  // Previous attempts
  previous_diets: PreviousDiet[];
  previous_medications: PreviousMedication[];
  previous_surgeries: PreviousSurgery[];
  // Psychological
  binge_eating_screen: boolean | null;
  emotional_eating: boolean | null;
  eating_disorder_history: string | null;
  mental_health_conditions: string[];
  current_psych_medications: string[];
  // Family history
  family_obesity_history: boolean | null;
  family_diabetes_history: boolean | null;
  family_surgical_history: string | null;
  // Social history
  smoking_status: string | null;
  alcohol_use: string | null;
  exercise_frequency: string | null;
  occupation: string | null;
  support_system: string | null;
  // Surgical history
  previous_abdominal_surgeries: string[];
  anesthesia_complications: string | null;
  // Metadata
  intake_status: IntakeStatus;
  intake_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export type SessionType = 'intake' | 'consultation' | 'follow_up';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type DecisionPath = 'lifestyle' | 'pharmacotherapy' | 'surgery' | null;
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Citation {
  source: string;
  chunk_id: string;
  page?: number;
  section?: string;
  pmid?: string;
  pmc_id?: string;
  title?: string;
  authors?: string;
  journal?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  intake_id: string | null;
  session_type: SessionType;
  status: SessionStatus;
  decision_path: DecisionPath;
  recommendation_summary: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  extracted_fields: Record<string, unknown>;
  model_used: string | null;
  language: Language;
  created_at: string;
}

export interface SendMessageRequest {
  content: string;
  language?: Language;
  session_id?: string;
}

// SSE stream event types
export interface SSEEvent {
  type: 'token' | 'citations' | 'extracted_fields' | 'intake_progress' | 'phase' | 'model_used' | 'done' | 'error';
  data: unknown;
}

export interface IntakeProgress {
  percentage: number;
  collected_fields: string[];
  remaining_fields: string[];
  total_fields: number;
}

export interface StreamingMessage {
  id?: string;
  content: string;
  citations: Citation[];
  extracted_fields: Record<string, unknown>;
  intake_progress: IntakeProgress | null;
  phase: SessionType | null;
  model_used: string | null;
  isStreaming: boolean;
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────

export type SourceType = 'guideline_pdf' | 'guideline_pptx' | 'guideline_video' | 'guideline_text' | 'pubmed';
export type SourceStatus = 'active' | 'archived' | 'failed' | 'processing';

export interface KBSource {
  id: string;
  source_type: SourceType;
  filename: string | null;
  title: string | null;
  pubmed_id: string | null;
  pmc_id: string | null;
  authors: string | null;
  publication_date: string | null;
  total_chunks: number;
  ingested_at: string;
  status: SourceStatus;
}

export interface KBStatsData {
  total_sources: number;
  total_chunks: number;
  text_chunks: number;
  image_chunks: number;
  pubmed_papers: number;
  guideline_documents: number;
  last_updated: string | null;
}

export interface UploadResponse {
  source_id: string;
  filename: string;
  status: string;
  chunks_created: number;
}

// ─── PubMed ─────────────────────────────────────────────────────────────────

export interface PubMedConfig {
  queries: string[];
  max_results_per_query: number;
}

export interface PubMedUpdateResult {
  new_papers: number;
  total_chunks: number;
  errors: string[];
  started_at: string;
  completed_at: string;
}

export interface PubMedUpdateHistory {
  id: string;
  started_at: string;
  completed_at: string;
  new_papers: number;
  total_chunks: number;
  errors: string[];
  triggered_by: string;
}

// ─── Admin Config ───────────────────────────────────────────────────────────

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  hours: string;
  booking_url: string;
}

export interface SystemPrompts {
  intake: string;
  consultation: string;
  surgery_discussion: string;
}

export interface AdminConfigItem {
  id: string;
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_patients: number;
  active_sessions: number;
  kb_chunks: number;
  pubmed_papers: number;
  recent_patients: PatientSummary[];
}

export interface PatientSummary {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  intake_status: IntakeStatus;
  sessions_count: number;
  created_at: string;
  last_session_at: string | null;
}

// ─── Toast / UI ─────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
