import apiClient from '../../../api/client';

import type {
  PreparationConfigurationRequest,
  PreparationConfigurationResponse,
  PreparationValidationResponse,
} from '../types/preparationWorkflow';

export async function configurePreparation(
  request: PreparationConfigurationRequest,
): Promise<PreparationConfigurationResponse> {
  const response =
    await apiClient.post<PreparationConfigurationResponse>(
      '/dataset-preparations/configure',
      request,
    );

  return response.data;
}

export async function validatePreparation(
  request: PreparationConfigurationRequest,
): Promise<PreparationValidationResponse> {
  const response =
    await apiClient.post<PreparationValidationResponse>(
      '/dataset-preparations/validate',
      request,
    );

  return response.data;
}