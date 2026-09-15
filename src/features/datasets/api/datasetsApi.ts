import apiClient from '../../../api/client';

export interface Dataset {
  id: number;
  project_id: number;
  name: string;
  path: string;
  created_at: string;
}

export async function getProjectDatasets(
  projectId: number,
): Promise<Dataset[]> {
  const response = await apiClient.get<Dataset[]>(
    `/projects/${projectId}/datasets`,
  );

  return response.data;
}

export async function getAllProjectDatasets(
  projectIds: number[],
): Promise<Dataset[]> {
  const results = await Promise.all(
    projectIds.map((projectId) =>
      getProjectDatasets(projectId),
    ),
  );

  return results.flat();
}