import apiClient from '../../../api/client';

export interface AIReportRequest {
  filename: string;
  output_file: string;
  operations: unknown[];
}

export interface AIReportResponse {
  ai_insights?: unknown;
  report_file?: {
    filename?: string;
    format?: string;
    size_bytes?: number;
    download_url?: string;
  };
  [key: string]: unknown;
}

export async function generateAIReport(
  request: AIReportRequest,
): Promise<AIReportResponse> {
  const response = await apiClient.post<AIReportResponse>(
    '/dataset-preparations/report',
    request,
  );

  return response.data;
}

export function extractAIInsights(
  payload: Record<string, unknown> | null | undefined,
): unknown {
  if (!payload) {
    return null;
  }

  return (
    payload.ai_insights ??
    payload.aiInsights ??
    payload.ai_report ??
    payload.aiReport ??
    payload.insights ??
    payload.summary ??
    null
  );
}

export function extractAIRecommendations(
  payload: Record<string, unknown> | null | undefined,
): unknown {
  if (!payload) {
    return null;
  }

  return (
    payload.recommendations ??
    payload.recommendation ??
    payload.actions ??
    payload.next_actions ??
    payload.nextActions ??
    null
  );
}