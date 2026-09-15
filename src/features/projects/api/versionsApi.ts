import apiClient from '../../../api/client';

export interface Version {
  id: number;
  project_id: number;
  ml_run_id: number | null;
  version_number: number;
  git_commit: string;
  dvc_state: Record<string, unknown> | null;
  description: string | null;
  created_at: string;
}

function normalizeVersions(data: unknown): Version[] {
  if (Array.isArray(data)) {
    return data as Version[];
  }

  if (
    data &&
    typeof data === 'object' &&
    'versions' in data &&
    Array.isArray((data as { versions: unknown }).versions)
  ) {
    return (data as { versions: Version[] }).versions;
  }

  return [];
}

export async function getVersions(
  projectId: number,
): Promise<Version[]> {
  const response = await apiClient.get(
    `/projects/${projectId}/versions`,
  );

  return normalizeVersions(response.data);
}

export async function getVersion(
  projectId: number,
  versionId: number,
): Promise<Version> {
  const response = await apiClient.get<Version>(
    `/projects/${projectId}/versions/${versionId}`,
  );

  return response.data;
}