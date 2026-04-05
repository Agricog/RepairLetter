// ── Case Types ──────────────────────────────────────────────

export type DefectType = 'damp' | 'mould' | 'leak' | 'heating' | 'electrics' | 'other';

export type CaseStatus = 'draft' | 'sent' | 'escalated' | 'resolved';

export type LetterType = 'initial_demand' | 'escalation' | 'council_complaint';

export type EvidenceContentType = 'image/jpeg' | 'image/png' | 'audio/webm' | 'application/pdf';

export interface Case {
  id: string;
  userId: string;
  defectType: DefectType;
  defectSeverity: number;
  hhsrsCategory: string;
  landlordEmailEncrypted: string;
  letterSentAt: string | null;
  deadlineAt: string | null;
  status: CaseStatus;
  escalatedAt: string | null;
  createdAt: string;
}

// ── Evidence Types ──────────────────────────────────────────

export interface AIAnalysis {
  defectType: DefectType;
  severity: number;
  hhsrsCategory: string;
  descriptionEn: string;
  confidence: number;
}

export interface Evidence {
  id: string;
  caseId: string;
  r2Key: string;
  contentType: EvidenceContentType;
  aiAnalysis: AIAnalysis | null;
  createdAt: string;
}

// ── Letter Types ────────────────────────────────────────────

export interface Letter {
  id: string;
  caseId: string;
  letterType: LetterType;
  contentEncrypted: string;
  sentToEncrypted: string;
  resendMessageId: string | null;
  sentAt: string;
}

// ── Voice Types ─────────────────────────────────────────────

export type VoiceProvider = 'speechmatics' | 'whisper';

export interface TranscriptionResult {
  text: string;
  language: string;
  translatedText: string | null;
  confidence: number;
  provider: VoiceProvider;
}

// ── API Response Types ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  r2Key: string;
  expiresAt: string;
}

// ── Consent Types ───────────────────────────────────────────

export interface ConsentRecord {
  consented: boolean;
  dataProcessing: boolean;
  voiceRecording: boolean;
  photoEvidence: boolean;
  consentedAt: string | null;
}

// ── Letter Generation Types ─────────────────────────────────

export interface GeneratedLetter {
  letterText: string;
  citations: string[];
}

export interface TranslatedLetter {
  translatedLetter: string;
}

// ── Evidence Pack Types ─────────────────────────────────────

export interface EvidencePackResponse {
  downloadUrl: string;
  expiresAt: string;
}

// ── Payment Types ───────────────────────────────────────────

export interface PaymentIntentResponse {
  clientSecret: string;
  amount: number;
  currency: string;
}

// ── HHSRS Categories ───────────────────────────────────────

export const HHSRS_CATEGORIES = [
  'Damp and mould growth',
  'Excess cold',
  'Excess heat',
  'Carbon monoxide and fuel combustion products',
  'Electrical hazards',
  'Falls associated with baths etc.',
  'Falls between levels',
  'Falls on the level',
  'Fire',
  'Hot surfaces and materials',
  'Lead',
  'Lighting',
  'Noise',
  'Personal hygiene, sanitation and drainage',
  'Structural collapse and falling elements',
  'Water supply',
  'Crowding and space',
  'Entry by intruders',
  'Domestic hygiene, pests and refuse',
  'Food safety',
  'Collision and entrapment',
  'Explosions',
  'Position and operability of amenities etc.',
  'Radiation',
  'Uncombusted fuel gas',
  'Volatile organic compounds',
] as const;

export const DEFECT_TYPE_LABELS: Record<DefectType, string> = {
  damp: 'Damp',
  mould: 'Mould',
  leak: 'Water Leak',
  heating: 'Heating Failure',
  electrics: 'Electrical Issue',
  other: 'Other',
};
