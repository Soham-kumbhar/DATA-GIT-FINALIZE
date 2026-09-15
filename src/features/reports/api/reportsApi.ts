import apiClient from '../../../api/client';

import type {
  ReportProject,
  ReportVersion,
  ReportVersionDetail,
} from '../types/report';

export async function getReportProjects(): Promise<
  ReportProject[]
> {
  const response = await apiClient.get('/projects');

  return Array.isArray(response.data)
    ? response.data
    : [];
}

export async function getReportVersions(
  projectId: number,
): Promise<ReportVersion[]> {
  const response = await apiClient.get(
    `/projects/${projectId}/versions`,
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

export async function getReportVersionDetail(
  projectId: number,
  versionId: number,
): Promise<ReportVersionDetail> {
  const response = await apiClient.get(
    `/projects/${projectId}/versions/${versionId}`,
  );

  return response.data;
}