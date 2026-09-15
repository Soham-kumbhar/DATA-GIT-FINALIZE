import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getVersions,
  type Version,
} from './api/versionsApi';

import { VersionRow } from './components/VersionRow';

export function VersionsPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadVersions() {
      if (!projectId) {
        setError('Project ID is missing.');
        setLoading(false);
        return;
      }

      const numericProjectId = Number(projectId);

      if (!Number.isInteger(numericProjectId)) {
        setError('Invalid project ID.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getVersions(
          numericProjectId,
        );

        if (active) {
          setVersions(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load versions.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadVersions();

    return () => {
      active = false;
    };
  }, [projectId]);

  const numericProjectId = Number(projectId);

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / PROJECTS / VERSIONS
          </div>

          <h1>VERSIONS</h1>

          <div className="page-description">
            Project version history. Version numbering is
            controlled by the backend.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate(`/projects/${projectId}`)
          }
        >
          &lt; PROJECT
        </button>
      </div>

      {loading && (
        <div className="state-panel">
          <span className="state-label">STATUS</span>
          <span>Loading versions...</span>
        </div>
      )}

      {error && (
        <div className="state-panel state-error">
          <span className="state-label">ERROR</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && versions.length === 0 && (
        <div className="state-panel">
          <span className="state-label">EMPTY</span>
          <span>No versions exist for this project.</span>
        </div>
      )}

      {!loading && !error && versions.length > 0 && (
        <div className="versions-table">
          <div className="versions-table-header">
            <span>VERSION</span>
            <span>DESCRIPTION</span>
            <span>GIT</span>
            <span>CREATED</span>
          </div>

          {versions.map((version) => (
            <VersionRow
              key={version.id}
              version={version}
              onClick={() =>
                navigate(
                  `/projects/${numericProjectId}/versions/${version.id}`,
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}