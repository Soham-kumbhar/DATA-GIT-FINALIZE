import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getVersion,
  type Version,
} from './api/versionsApi';

export function VersionDetailPage() {
  const navigate = useNavigate();
  const { projectId, versionId } = useParams();

  const [version, setVersion] = useState<Version | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadVersion() {
      if (!projectId || !versionId) {
        setError('Project or version ID is missing.');
        setLoading(false);
        return;
      }

      const numericProjectId = Number(projectId);
      const numericVersionId = Number(versionId);

      if (
        !Number.isInteger(numericProjectId) ||
        !Number.isInteger(numericVersionId)
      ) {
        setError('Invalid project or version ID.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getVersion(
          numericProjectId,
          numericVersionId,
        );

        if (active) {
          setVersion(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load version.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadVersion();

    return () => {
      active = false;
    };
  }, [projectId, versionId]);

  if (loading) {
    return (
      <section className="page">
        <div className="state-panel">
          <span className="state-label">STATUS</span>
          <span>Loading version...</span>
        </div>
      </section>
    );
  }

  if (error || !version) {
    return (
      <section className="page">
        <div className="page-heading">
          <div>
            <div className="page-kicker">
              DATA / PROJECTS / VERSION
            </div>

            <h1>VERSION</h1>
          </div>

          <button
            type="button"
            className="cli-action"
            onClick={() =>
              navigate(
                `/projects/${projectId}/versions`,
              )
            }
          >
            &lt; VERSIONS
          </button>
        </div>

        <div className="state-panel state-error">
          <span className="state-label">ERROR</span>
          <span>
            {error ?? 'Version not found.'}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / PROJECTS / VERSION DETAIL
          </div>

          <h1>
            VERSION : V{version.version_number}
          </h1>

          <div className="page-description">
            Version evidence, provenance and metadata.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate(
              `/projects/${projectId}/versions`,
            )
          }
        >
          &lt; VERSIONS
        </button>
      </div>

      <div className="version-detail-grid">
        <div className="project-info-panel">
          <div className="info-row">
            <span className="info-label">VERSION ID</span>
            <span>{version.id}</span>
          </div>

          <div className="info-row">
            <span className="info-label">VERSION</span>
            <span>V{version.version_number}</span>
          </div>

          <div className="info-row">
            <span className="info-label">PROJECT ID</span>
            <span>{version.project_id}</span>
          </div>

          <div className="info-row">
            <span className="info-label">ML RUN</span>
            <span>
              {version.ml_run_id ?? '—'}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">GIT</span>
            <span>{version.git_commit || '—'}</span>
          </div>

          <div className="info-row">
            <span className="info-label">CREATED</span>
            <span>
              {new Date(
                version.created_at,
              ).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="project-description-panel">
          <div className="panel-label">
            DESCRIPTION
          </div>

          <div className="panel-value">
            {version.description?.trim() ||
              'No version description provided.'}
          </div>

          <div className="panel-label version-panel-label">
            DVC STATE
          </div>

          <pre className="json-block">
            {version.dvc_state
              ? JSON.stringify(
                  version.dvc_state,
                  null,
                  2,
                )
              : 'No DVC state recorded.'}
          </pre>
        </div>
      </div>
    </section>
  );
}