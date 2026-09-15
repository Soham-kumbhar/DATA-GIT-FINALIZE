import apiClient from '../../../api/client';

import type { Project } from './projectsApi';

export async function getProject(projectId: number): Promise<Project> {
  const response = await apiClient.get<Project>(
    `/projects/${projectId}`,
  );

  return response.data;
}