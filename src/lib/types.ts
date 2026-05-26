export type MatchScore = 'low' | 'medium' | 'high' | null
export type ApplicationStatus = 'found' | 'applied' | 'interviewing' | 'offer' | 'rejected'
export type RemoteType = 'remote' | 'hybrid' | 'onsite' | null
export type ContractType = 'full-time' | 'part-time' | 'contract' | 'internship' | null
export type AiProvider = 'ollama' | 'claude' | 'openai'

export interface Application {
  id: string
  user_id: string
  company: string
  role: string
  url: string | null
  job_description: string | null
  match_score_value: number | null
  match_score: MatchScore
  status: ApplicationStatus
  notes: string | null
  salary_range: string | null
  location: string | null
  remote_type: RemoteType
  contract_type: ContractType
  applied_at: string
  posted_at: string | null
  created_at: string
}

export interface ApplicationCreate {
  company: string
  role: string
  url?: string | null
  job_description?: string | null
  status?: ApplicationStatus
  notes?: string | null
  salary_range?: string | null
  location?: string | null
  remote_type?: RemoteType
  contract_type?: ContractType
  posted_at?: string | null
}

export type ApplicationUpdate = Partial<ApplicationCreate> & {
  match_score_value?: number | null
}

export interface Contact {
  id: string
  user_id: string
  application_id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string | null
  created_at: string | null
}

export interface CV {
  id: string
  user_id: string
  filename: string
  storage_path: string
  extracted_text: string | null
  word_count: number | null
  is_default: boolean
  created_at: string
}

export interface AppDocument {
  id: string
  user_id: string
  application_id: string
  type: 'cover_letter' | 'tailored_cv'
  filename: string
  storage_path: string
  content_markdown: string | null
  created_at: string
}

export interface UserSettings {
  user_id: string
  ai_provider: AiProvider
  ai_base_url: string
  ai_model: string
  claude_api_key_enc: string
  openai_api_key_enc: string
  jsearch_api_key_enc: string
  find_jobs_candidates: number
  find_jobs_save_count: number
  jsearch_query_override: string
  jsearch_country: string
  jsearch_language: string
  jsearch_location: string
  jsearch_date_posted: string
  jsearch_work_from_home: boolean
  jsearch_employment_types: string
  jsearch_job_requirements: string
  jsearch_radius: string
  jsearch_exclude_publishers: string
  jsearch_num_pages: string
  cron_enabled: boolean
  cron_hour_utc: number
}

export interface DashboardStats {
  total: number
  found: number
  applied: number
  interviewing: number
  offer: number
  rejected: number
}
