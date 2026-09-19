import apiClient from '../../../api/client';

import type {
  ReportProject,
  ReportVersion,
  ReportVersionDetail,
} from '../types/report';

type AnyRecord = Record<string, unknown>;

function asRecord(
  value: unknown,
): AnyRecord {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value as AnyRecord;
  }

  return {};
}

function hasCoreVersionEvidence(
  value: unknown,
  projectId: number,
  versionId: number,
): boolean {
  const data = asRecord(value);

  return (
    data.id === versionId &&
    data.project_id === projectId &&
    typeof data.version_number === 'number'
  );
}

function isUsefulReportPayload(
  value: unknown,
  projectId: number,
  versionId: number,
): boolean {
  if (
    !hasCoreVersionEvidence(
      value,
      projectId,
      versionId,
    )
  ) {
    return false;
  }

  const data = asRecord(value);

  const coreOnlyFields = new Set([
    'id',
    'project_id',
    'version_number',
    'git_commit',
    'dvc_state',
    'description',
    'created_at',
    'ml_run_id',
  ]);

  return Object.keys(data).some(
    (key) => !coreOnlyFields.has(key),
  );
}

function buildHistoricalFallback(
  version: ReportVersion,
  reason: string,
): ReportVersionDetail {
  const dvc = asRecord(
    version.dvc_state,
  );

  const trackedFiles = Array.isArray(
    dvc.tracked_files,
  )
    ? dvc.tracked_files
    : [];

  const firstTracked =
    trackedFiles.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        !Array.isArray(item),
    );

  const tracked = asRecord(
    firstTracked,
  );

  const dvcFile =
    tracked.dvc_file ??
    dvc.dvc_file ??
    null;

  const dataPath =
    tracked.data_path ??
    dvc.data_path ??
    null;

  const dvcHash =
    tracked.md5 ??
    tracked.hash ??
    tracked.checksum ??
    dvc.md5 ??
    dvc.hash ??
    dvc.checksum ??
    null;

  const normalizedDvcFile =
    dvcFile === null
      ? ''
      : String(dvcFile).replaceAll(
          '\\',
          '/',
        );

  const normalizedDataPath =
    dataPath === null
      ? ''
      : String(dataPath).replaceAll(
          '\\',
          '/',
        );

  let datasetPath = '—';

  if (normalizedDataPath) {
    if (
      normalizedDvcFile.includes(
        '/',
      )
    ) {
      const directory =
        normalizedDvcFile.slice(
          0,
          normalizedDvcFile.lastIndexOf(
            '/',
          ) + 1,
        );

      datasetPath =
        `${directory}${normalizedDataPath}`;
    } else {
      datasetPath =
        normalizedDataPath;
    }
  } else if (
    normalizedDvcFile
  ) {
    datasetPath =
      normalizedDvcFile.replace(
        /\.dvc$/i,
        '',
      );
  }

  return {
    ...version,

    report_mode:
      'stored_version_evidence',

    report_fallback_reason:
      reason,

    dataset: {
      path: datasetPath,
    },

    dvc: {
      dvc_file: dvcFile,
      data_path: dataPath,
      md5: dvcHash,
      tracked_files:
        trackedFiles,
    },

    git: {
      commit:
        version.git_commit ??
        null,
    },

    training: {
      status:
        version.ml_run_id == null
          ? 'not_recorded'
          : 'linked_without_run_payload',

      ml_run_id:
        version.ml_run_id ??
        null,
    },

    models: [],
  };
}

export async function getReportProjects(): Promise<
  ReportProject[]
> {
  const response =
    await apiClient.get(
      '/projects',
    );

  return Array.isArray(
    response.data,
  )
    ? response.data
    : [];
}

export async function getReportVersions(
  projectId: number,
): Promise<ReportVersion[]> {
  const response =
    await apiClient.get(
      `/projects/${projectId}/versions`,
    );

  return Array.isArray(
    response.data,
  )
    ? response.data
    : [];
}

export async function getReportVersionDetail(
  projectId: number,
  versionId: number,
): Promise<ReportVersionDetail> {
  try {
    const response =
      await apiClient.get(
        `/projects/${projectId}/versions/${versionId}/report`,
      );

    if (
      isUsefulReportPayload(
        response.data,
        projectId,
        versionId,
      )
    ) {
      return response.data as ReportVersionDetail;
    }

    const basicResponse =
      await apiClient.get(
        `/projects/${projectId}/versions/${versionId}`,
      );

    return buildHistoricalFallback(
      basicResponse.data as ReportVersion,
      'The detailed report endpoint returned no additional historical evidence.',
    );
  } catch (reportError) {
    try {
      const basicResponse =
        await apiClient.get(
          `/projects/${projectId}/versions/${versionId}`,
        );

      return buildHistoricalFallback(
        basicResponse.data as ReportVersion,
        reportError instanceof Error
          ? reportError.message
          : 'Detailed report endpoint unavailable.',
      );
    } catch {
      throw new Error(
        `Unable to load report for version ${versionId}.`,
      );
    }
  }
}