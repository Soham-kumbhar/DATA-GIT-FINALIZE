export interface ReportProject {
  id: number;
  name: string;
  path?: string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface VersionResultModelEvidence {
  model_name?: string | null;
  model_path?: string | null;
  model_sha256?: string | null;
  framework?: string | null;
  framework_version?: string | null;
}

export interface VersionResultEvidence {
  status?: string | null;
  model?: VersionResultModelEvidence | null;
  metrics?: Record<string, unknown> | null;
  evaluation?: Record<string, unknown> | null;
  notes?: string | null;
  reason?: string | null;
}

export interface EvidenceCompleteness {
  [key: string]: unknown;
}

export interface ReportVersion {
  id: number;
  project_id: number;

  /*
   * Kept only for backend compatibility.
   * New frontend UI must not present this as a product concept.
   */
  ml_run_id?: number | null;

  version_number: number;
  git_commit?: string | null;
  dvc_state?: unknown;
  description?: string | null;
  created_at?: string | null;

  result_evidence?: VersionResultEvidence | null;
  evidence_completeness?: EvidenceCompleteness | null;

  [key: string]: unknown;
}

export interface ReportVersionDetail extends ReportVersion {
  project?: Record<string, unknown>;
  dataset?: Record<string, unknown>;
  data_quality?: Record<string, unknown>;
  preparation?: Record<string, unknown>;
  model?: Record<string, unknown> | null;

  /*
   * Compatibility aliases from the backend report.
   * New UI should prefer result_evidence.
   */
  training?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  evaluation?: Record<string, unknown>;

  git?: Record<string, unknown>;
  dvc?: Record<string, unknown> | null;
  lineage?: Record<string, unknown>;
  report_metadata?: Record<string, unknown>;
  ai_report?: Record<string, unknown> | null;

  [key: string]: unknown;
}