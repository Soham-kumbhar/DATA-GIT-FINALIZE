import apiClient from '../../api/client';

import type {
  ReportProject,
  ReportVersion,
} from '../reports/types/report';

export interface CompareRecommendation {
  recommendation: string;
  reason: string;
  priority: 'high' | 'medium' | 'low' | string;
}

export interface CompareAIContributor {
  factor: string;
  direction: 'positive' | 'negative' | 'neutral' | 'unknown' | string;
  evidence: string[];
  reasoning: string;
  confidence: 'high' | 'medium' | 'low' | string;
}

export interface CompareAIInsights {
  status?: 'success' | 'disabled' | 'unavailable' | string;
  reason?: string | null;
  root_cause?: {
    summary?: string;
    contributors?: CompareAIContributor[];
    overall_confidence?: string;
    limitations?: string[];
    alternative_explanations?: string[];
  };
  recommendations?: CompareRecommendation[];
}

export interface CompareDatasetProfile {
  dataset?: string;
  dvc_hash?: string;
  rows?: number;
  columns?: string[];
  column_count?: number;
  dtypes?: Record<string, string>;
  missing_values?: Record<string, number>;
  total_missing_values?: number;
  duplicate_rows?: number;
  target_column?: string | null;
  target_distribution?: Record<string, number>;
  numeric_statistics?: Record<
    string,
    {
      min?: number;
      max?: number;
      mean?: number;
      median?: number;
      std?: number;
    }
  >;
  categorical_statistics?: Record<string, unknown>;
  feature_columns?: string[];
  feature_profile?: Record<string, unknown>;
}

export interface CompareDatasetRow {
  [key: string]: unknown;
}

export interface CompareDatasetRecord {
  dataset?: string;
  dataset_changed?: boolean;
  old_dvc_hash?: string;
  new_dvc_hash?: string;
  old_rows?: number;
  new_rows?: number;
  old_columns?: string[];
  new_columns?: string[];
  columns_added?: string[];
  columns_removed?: string[];
  rows_added?: number;
  rows_removed?: number;
  added_rows?: CompareDatasetRow[];
  removed_rows?: CompareDatasetRow[];
  [key: string]: unknown;
}

export interface CompareDatasetDiff {
  dataset_changed?: boolean;
  datasets?: CompareDatasetRecord[];
  [key: string]: unknown;
}

export interface CompareDatasetAnalysis {
  available?: boolean;
  rows_before?: number;
  rows_after?: number;
  row_delta?: number;
  columns_before?: string[];
  columns_after?: string[];
  columns_added?: string[];
  columns_removed?: string[];
  missing_values_before?: Record<string, number>;
  missing_values_after?: Record<string, number>;
  missing_value_changes?: Record<string, unknown>;
  duplicate_rows_before?: number;
  duplicate_rows_after?: number;
  duplicates_changed?: boolean;
  target_column_before?: string | null;
  target_column_after?: string | null;
  target_distribution_before?: Record<string, number>;
  target_distribution_after?: Record<string, number>;
  target_distribution_changes?: Record<
    string,
    {
      before?: number;
      after?: number;
      delta?: number;
    }
  >;
  feature_changes?: {
    features_added?: string[];
    features_removed?: string[];
    features_changed?: Record<
      string,
      Record<
        string,
        {
          before?: number;
          after?: number;
          delta?: number;
        }
      >
    >;
  };
}

export interface ComparePerformance {
  metrics_before?: Record<string, unknown>;
  metrics_after?: Record<string, unknown>;
  metric_changes?: Record<string, unknown>;
  performance_changed?: boolean;
}

export interface CompareMLComparison {
  run_id_before?: number | null;
  run_id_after?: number | null;
  model_name_before?: string | null;
  model_name_after?: string | null;
  features_before?: string[];
  features_after?: string[];
  features_added?: string[];
  features_removed?: string[];
  parameters_before?: Record<string, unknown>;
  parameters_after?: Record<string, unknown>;
  parameter_changes?: Record<string, unknown>;
  performance_before?: Record<string, unknown>;
  performance_after?: Record<string, unknown>;
  performance_changes?: Record<string, unknown>;
  other_metrics_before?: Record<string, unknown>;
  other_metrics_after?: Record<string, unknown>;
  other_metric_changes?: Record<string, unknown>;
  evaluation?: Record<string, unknown>;
}

export interface ComparePayload {
  project_id: number;
  version_1: number;
  version_2: number;

  git_changed?: boolean;
  dvc_changed?: boolean;
  code_changed?: boolean;

  git_commit_before?: string | null;
  git_commit_after?: string | null;

  dvc_state_before?: Record<string, unknown> | null;
  dvc_state_after?: Record<string, unknown> | null;

  changed_files?: string[];
  code_changed_files?: string[];
  code_patch?: string;

  ml_run_before?: Record<string, unknown> | null;
  ml_run_after?: Record<string, unknown> | null;
  ml_comparison?: CompareMLComparison | null;

  performance?: ComparePerformance | null;

  dataset_diff?: CompareDatasetDiff | null;

  dataset_profiles?: {
    before?: CompareDatasetProfile | null;
    after?: CompareDatasetProfile | null;
  } | null;

  dataset_analysis?: CompareDatasetAnalysis | null;

  evidence_chain?: string[];
  changes?: string[];

  ai_insights?: CompareAIInsights | null;

  [key: string]: unknown;
}

export async function getCompareProjects(): Promise<ReportProject[]> {
  const response = await apiClient.get('/projects');

  return Array.isArray(response.data)
    ? (response.data as ReportProject[])
    : [];
}

export async function getCompareVersions(
  projectId: number,
): Promise<ReportVersion[]> {
  const response = await apiClient.get(
    `/projects/${projectId}/versions`,
  );

  return Array.isArray(response.data)
    ? (response.data as ReportVersion[])
    : [];
}

export async function getVersionComparison(
  projectId: number,
  versionA: number,
  versionB: number,
  generateAI = true,
): Promise<ComparePayload> {
  const response = await apiClient.get(
    `/projects/${projectId}/versions/compare`,
    {
      params: {
        version_1: versionA,
        version_2: versionB,
        generate_ai: generateAI,
      },
    },
  );

  return response.data as ComparePayload;
}