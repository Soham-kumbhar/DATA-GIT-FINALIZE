import apiClient from '../../../api/client';

export interface DatasetProfile {
  [key: string]: unknown;
}

export async function getPreparationProfile(
  filename: string,
): Promise<DatasetProfile> {
  const response =
    await apiClient.get<DatasetProfile>(
      `/dataset-preparations/profile/${encodeURIComponent(
        filename,
      )}`,
    );

  return response.data;
}