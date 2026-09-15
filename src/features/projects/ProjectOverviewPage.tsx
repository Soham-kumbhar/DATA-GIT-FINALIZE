import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getProject,
} from './api/projectDetailsApi';

import type { Project } from './api/projectsApi';

export function ProjectOverviewPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProject() {
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

        const data = await getProject(numericProjectId);

        if (active) {
          setProject(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load project.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <section className="page">
        <div className="state-panel">
          <span className="state-label">STATUS</span>
          <span>Loading project...</span>
        </div>
      </section>
    );
  }

  if (error || !project) {
    return (
      <section className="page">
        <div className="page-heading">
          <div>
            <div className="page-kicker">
              DATA / PROJECTS / PROJECT
            </div>

            <h1>PROJECT</h1>
          </div>

          <button
            className="cli-action"
            onClick={() => navigate('/projects')}
          >
            &lt; PROJECTS
          </button>
        </div>

        <div className="state-panel state-error">
          <span className="state-label">ERROR</span>
          <span>{error ?? 'Project not found.'}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="page project-overview-page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / PROJECTS / OVERVIEW
          </div>

          <h1>PROJECT : {project.name}</h1>

          <div className="page-description">
            Project workspace and version history.
          </div>
        </div>

        <button
          className="cli-action"
          onClick={() => navigate('/projects')}
        >
          &lt; PROJECTS
        </button>
      </div>

      <div className="project-overview-grid">
        <div className="project-info-panel">
          <div className="info-row">
            <span className="info-label">PROJECT ID</span>
            <span>{project.id}</span>
          </div>

          <div className="info-row">
            <span className="info-label">NAME</span>
            <span>{project.name}</span>
          </div>

          <div className="info-row">
            <span className="info-label">PATH</span>
            <span className="info-value-wrap">
              {project.path}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">CREATED</span>
            <span>
              {new Date(
                project.created_at,
              ).toLocaleString()}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">UPDATED</span>
            <span>
              {new Date(
                project.updated_at,
              ).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="project-description-panel">
          <div className="panel-label">
            DESCRIPTION
          </div>

          <div className="panel-value">
            {project.description?.trim() ||
              'No description provided.'}
          </div>
        </div>
      </div>

      <button
  type="button"
  className="cli-action"
  onClick={() =>
    navigate(
      `/projects/${project.id}/versions`,
    )
  }
>
  &gt; VIEW VERSIONS
</button>
    </section>
  );
}