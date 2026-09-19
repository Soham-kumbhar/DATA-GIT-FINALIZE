
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getProjects,
  type Project,
} from './api/projectsApi';

export function ProjectsPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProjects();

        if (active) {
          setProjects(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load projects.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / PROJECTS
          </div>

          <h1>PROJECTS</h1>

          <div className="page-description">
            Manage project workspaces and their version
            history.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() => navigate('/projects/new')}
        >
          + CREATE NEW PROJECT
        </button>
      </div>

      {loading && (
        <div className="state-panel">
          <span className="state-label">STATUS</span>
          <span>Loading projects...</span>
        </div>
      )}

      {error && (
        <div className="state-panel state-error">
          <span className="state-label">ERROR</span>
          <span>{error}</span>
        </div>
      )}

      {!loading &&
        !error &&
        projects.length === 0 && (
          <div className="state-panel">
            <span className="state-label">EMPTY</span>
            <span>No projects found.</span>
          </div>
        )}

      {!loading &&
        !error &&
        projects.length > 0 && (
          <div className="projects-table">
            <div className="projects-table-header">
              <span>ID</span>
              <span>PROJECT</span>
              <span>PATH</span>
              <span>UPDATED</span>
            </div>

            {projects.map((project) => (
              <button
                type="button"
                className="project-entry"
                key={project.id}
                onClick={() =>
                  navigate(`/projects/${project.id}`)
                }
              >
                <span className="project-id">
                  {project.id}
                </span>

                <span className="project-name">
                  {project.name}
                </span>

                <span className="project-path">
                  {project.path || '—'}
                </span>

                <span className="project-date">
                  {project.updated_at
                    ? new Date(
                        project.updated_at,
                      ).toLocaleString()
                    : '—'}
                </span>
              </button>
            ))}
          </div>
        )}
    </section>
  );
}

