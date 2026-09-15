import apiClient from '../../../api/client';

export interface GenerateReportRequest {
  version_a: string;
  version_b: string;
  with_ai: boolean;
  question?: string;
}

export interface GeneratedReportResponse {
  report_id?: string | number;
  summary?: unknown;
  comparison?: unknown;
  validity?: unknown;
  observed_evidence?: unknown;
  ai_investigation?: unknown;
  ai_used?: boolean;
  [key: string]: unknown;
}

export async function generateVersionReport(
  request: GenerateReportRequest,
): Promise<GeneratedReportResponse> {
  const response =
    await apiClient.post<GeneratedReportResponse>(
      '/reports',
      request,
    );

  return response.data;
}