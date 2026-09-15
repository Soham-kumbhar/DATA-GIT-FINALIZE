import apiClient from '../../../api/client';

export interface Project {
  id: number;
  name: string;
  path: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  path: string;
  description?: string;
}

export async function getProjects(): Promise<Project[]> {
  const response = await apiClient.get<Project[]>('/projects');
  return response.data;
}

export async function createProject(
  data: CreateProjectRequest,
): Promise<Project> {
  const response = await apiClient.post<Project>(
    '/projects',
    data,
  );

  return response.data;
}