import apiClient from '../../../api/client';

export async function uploadDataset(
  file: File,
): Promise<unknown> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await apiClient.post(
    '/dataset-preparations/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}