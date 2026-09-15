export interface ReportProject {
  id: number;
  name: string;
  path?: string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReportVersion {
  id: number;
  project_id: number;
  ml_run_id?: number | null;
  version_number: number;
  git_commit?: string | null;
  dvc_state?: unknown;
  description?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface ReportVersionDetail
  extends ReportVersion {
  [key: string]: unknown;
}

export interface ReportSelectorState {
  projectId: number | null;
  versionId: number | null;
}

export type ReportRecord = Record<
  string,
  unknown
>;