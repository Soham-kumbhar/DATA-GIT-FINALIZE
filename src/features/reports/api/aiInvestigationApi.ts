import apiClient from '../../../api/client';

export interface InvestigationConfidence {
  level?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface InvestigationResponse {
  comparison_id?: string | null;
  facts?: unknown;
  evidence?: unknown[];
  validity?: unknown;
  reproducibility?: unknown;
  ai_interpretation?: unknown;
  limitations?: unknown[];
  [key: string]: unknown;
}

export interface InvestigationRequest {
  version_a: string;
  version_b: string;
  question: string;
  with_ai: boolean;
  check_reproducibility: boolean;
}

export async function investigateVersionChange(
  request: InvestigationRequest,
): Promise<InvestigationResponse> {
  const response =
    await apiClient.post<InvestigationResponse>(
      '/investigate',
      request,
    );

  return response.data;
}