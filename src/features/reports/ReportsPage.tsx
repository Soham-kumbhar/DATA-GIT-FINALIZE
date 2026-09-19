import { useEffect, useState } from 'react';

import {
  getReportProjects,
  getReportVersions,
  getReportVersionDetail,
} from './api/reportsApi';

import type {
  ReportProject,
  ReportVersion,
  ReportVersionDetail,
} from './types/report';

import { ReportProjectSelection } from './components/ReportProjectSelection';
import { ReportVersionTimeline } from './components/ReportVersionTimeline';
import { ReportDocument } from './components/ReportDocument';

import './Reports.css';

export default function ReportsPage() {
  const [projects, setProjects] = useState<ReportProject[]>([]);
  const [latestVersions, setLatestVersions] = useState<
    Record<number, ReportVersion | null>
  >({});

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const [versions, setVersions] = useState<ReportVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null,
  );

  const [versionDetail, setVersionDetail] =
    useState<ReportVersionDetail | null>(null);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [error, setError] = useState('');

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoadingProjects(true);
        setError('');

        const projectList = await getReportProjects();

        if (!active) {
          return;
        }

        setProjects(projectList);

        const versionEntries = await Promise.all(
          projectList.map(async (project) => {
            try {
              const projectVersions = await getReportVersions(project.id);

              const ordered = [...projectVersions].sort(
                (a, b) => b.version_number - a.version_number,
              );

              return [project.id, ordered[0] ?? null] as const;
            } catch {
              return [project.id, null] as const;
            }
          }),
        );

        if (!active) {
          return;
        }

        setLatestVersions(Object.fromEntries(versionEntries));
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load projects.',
        );
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  // ============================================================
  // LOAD PROJECT VERSIONS
  // ============================================================

  useEffect(() => {
    if (selectedProjectId === null) {
      setVersions([]);
      setSelectedVersionId(null);
      setVersionDetail(null);
      return;
    }

    const projectId = selectedProjectId;
    let active = true;

    async function loadVersions() {
      try {
        setLoadingVersions(true);
        setError('');

        setSelectedVersionId(null);
        setVersionDetail(null);

        const result = await getReportVersions(projectId);

        if (!active) {
          return;
        }

        setVersions(result);
      } catch (err) {
        if (!active) {
          return;
        }

        setVersions([]);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load project versions.',
        );
      } finally {
        if (active) {
          setLoadingVersions(false);
        }
      }
    }

    void loadVersions();

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  // ============================================================
  // LOAD SELECTED VERSION REPORT
  // ============================================================

  useEffect(() => {
    if (
      selectedProjectId === null ||
      selectedVersionId === null
    ) {
      setVersionDetail(null);
      return;
    }

    const projectId = selectedProjectId;
    const versionId = selectedVersionId;

    let active = true;

    async function loadVersionDetail() {
      try {
        setLoadingDetail(true);
        setError('');

        const detail = await getReportVersionDetail(
          projectId,
          versionId,
        );

        if (!active) {
          return;
        }

        setVersionDetail(detail);
      } catch (err) {
        if (!active) {
          return;
        }

        setVersionDetail(null);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load version report.',
        );
      } finally {
        if (active) {
          setLoadingDetail(false);
        }
      }
    }

    void loadVersionDetail();

    return () => {
      active = false;
    };
  }, [selectedProjectId, selectedVersionId]);

  // ============================================================
  // SELECTED PROJECT
  // ============================================================

  const selectedProject =
    projects.find(
      (project) => project.id === selectedProjectId,
    ) ?? null;

  // ============================================================
  // NAVIGATION
  // ============================================================

  function handleSelectProject(projectId: number) {
    setSelectedProjectId(projectId);
  }


  function handleBackToProjects() {
    setSelectedProjectId(null);
    setVersions([]);
    setSelectedVersionId(null);
    setVersionDetail(null);
    setError('');
  }

  function handleBackToVersions() {
    setSelectedVersionId(null);
    setVersionDetail(null);
    setError('');
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="reports-page">
      {error ? (
        <div className="reports-alert">
          {error}
        </div>
      ) : null}

      {/* ======================================================
          PROJECT SELECTION
          ====================================================== */}

      {!selectedProject ? (
        <ReportProjectSelection
          projects={projects}
          latestVersions={latestVersions}
          selectedProjectId={selectedProjectId}
          loading={loadingProjects}
          onSelect={handleSelectProject}

        />
      ) : null}

      {/* ======================================================
          VERSION HISTORY
          ====================================================== */}

      {selectedProject &&
      selectedVersionId === null ? (
        <ReportVersionTimeline
          project={selectedProject}
          versions={versions}
          loading={loadingVersions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={setSelectedVersionId}
          onBack={handleBackToProjects}
        />
      ) : null}

      {/* ======================================================
          VERSION REPORT
          ====================================================== */}

      {selectedProject &&
      selectedVersionId !== null ? (
        loadingDetail ? (
          <section className="report-detail-loading-state">
            <button
              type="button"
              className="report-detail-back-fallback"
              onClick={handleBackToVersions}
            >
              ← VERSION HISTORY
            </button>

            <div className="report-detail-loading-shell">
              <span>LOADING VERSION REPORT</span>
              <strong>
                Reading deterministic evidence...
              </strong>
            </div>
          </section>
        ) : versionDetail ? (
          <ReportDocument
            project={selectedProject}
            version={versionDetail}
            onBack={handleBackToVersions}
          />
        ) : null
      ) : null}
    </div>
  );
}



