import apiClient from '../../../api/client';
import type {
  PreparationConfigurationRequest,
} from '../types/preparationWorkflow';

export interface PreparationProceedResponse {
  status?: string;
  message?: string;
  filename?: string;
  operation_count?: number;
  selected_operations?: PreparationConfigurationRequest['operations'];
  validation?: Record<string, unknown>;
  result?: Record<string, unknown>;
  detail?: string;
  [key: string]: unknown;
}

export async function proceedWithPreparation(
  request: PreparationConfigurationRequest,
): Promise<PreparationProceedResponse> {
  const response =
    await apiClient.post<PreparationProceedResponse>(
      '/dataset-preparations/proceed',
      request,
    );

  return response.data;
}