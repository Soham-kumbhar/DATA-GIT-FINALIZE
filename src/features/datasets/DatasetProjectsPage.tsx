import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getProjects,
  type Project,
} from '../projects/api/projectsApi';

import {
  getProjectDatasets,
} from './api/datasetsApi';

export function DatasetProjectsPage() {
  const navigate = useNavigate();
  const { datasetId } = useParams();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [projectIds, setProjectIds] =
    useState<number[]>([]);

  useEffect(() => {
    let active = true;

    async function loadUsage() {
      try {
        const projectData =
          await getProjects();

        const matches: number[] = [];

        for (const project of projectData) {
          const datasets =
            await getProjectDatasets(
              project.id,
            );

          const hasDataset = datasets.some(
            (dataset) =>
              dataset.id === Number(datasetId),
          );

          if (hasDataset) {
            matches.push(project.id);
          }
        }

        if (!active) return;

        setProjects(
          projectData.filter((project) =>
            matches.includes(project.id),
          ),
        );

        setProjectIds(matches);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to determine project usage.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUsage();

    return () => {
      active = false;
    };
  }, [datasetId]);

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATASETS / PROJECTS
          </div>

          <h1>PROJECTS USING DATASET</h1>

          <div className="page-description">
            Derived from the backend project-scoped dataset
            relationships.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate(
              `/datasets/${datasetId}`,
            )
          }
        >
          &lt; DATASET
        </button>
      </div>

      {loading && (
        <div className="state-panel">
          <span className="state-label">
            STATUS
          </span>

          <span>
            Checking project dataset relationships...
          </span>
        </div>
      )}

      {error && (
        <div className="state-panel state-error">
          <span className="state-label">
            ERROR
          </span>

          <span>{error}</span>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="state-panel">
          <span className="state-label">
            EMPTY
          </span>

          <span>
            No project currently exposes dataset ID{' '}
            {datasetId}.
          </span>
        </div>
      )}

      {!loading &&
        !error &&
        projects.length > 0 && (
          <div className="dataset-project-list">
            <div className="dataset-project-header">
              <span>ID</span>
              <span>PROJECT</span>
              <span>PATH</span>
            </div>

            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="dataset-project-row"
                onClick={() =>
                  navigate(
                    `/projects/${project.id}`,
                  )
                }
              >
                <span>{project.id}</span>

                <span className="dataset-project-name">
                  {project.name}
                </span>

                <span className="dataset-project-path">
                  {project.path}
                </span>
              </button>
            ))}
          </div>
        )}

      {!loading &&
        !error &&
        projectIds.length > 0 && (
          <div className="state-panel">
            <span className="state-label">
              PROJECTS
            </span>

            <span>
              {projectIds.length} matching project
              {projectIds.length === 1 ? '' : 's'}.
            </span>
          </div>
        )}
    </section>
  );
}