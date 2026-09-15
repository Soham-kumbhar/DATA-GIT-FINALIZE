import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getProjects } from '../projects/api/projectsApi';
import type { Project } from '../projects/api/projectsApi';

import {
  getProjectDatasets,
  type Dataset,
} from './api/datasetsApi';

import { DatasetRow } from './components/DatasetRow';

export function DatasetLibraryPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);

  const [datasets, setDatasets] = useState<Dataset[]>([]);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingDatasets, setLoadingDatasets] =
    useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoadingProjects(true);
        setError(null);

        const data = await getProjects();

        if (!active) return;

        setProjects(data);

        // Keep project context available for dataset
        // detail/profile/usage screens.
        sessionStorage.setItem(
          'datagit_project_ids',
          JSON.stringify(
            data.map((project) => project.id),
          ),
        );

        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        } else {
          setSelectedProjectId(null);
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
          setLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDatasets() {
      if (selectedProjectId === null) {
        setDatasets([]);
        setLoadingDatasets(false);
        return;
      }

      try {
        setLoadingDatasets(true);
        setError(null);

        const data = await getProjectDatasets(
          selectedProjectId,
        );

        if (active) {
          setDatasets(data);
        }
      } catch (err) {
        if (active) {
          setDatasets([]);
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load datasets.',
          );
        }
      } finally {
        if (active) {
          setLoadingDatasets(false);
        }
      }
    }

    loadDatasets();

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );

  function handleDatasetSelect(dataset: Dataset) {
    navigate(`/datasets/${dataset.id}`);
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATASETS
          </div>

          <h1>DATASETS</h1>

          <div className="page-description">
            Dataset library scoped to a project.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() => navigate('/projects')}
        >
          &lt; PROJECTS
        </button>
      </div>

      {loadingProjects && (
        <div className="state-panel">
          <span className="state-label">
            STATUS
          </span>

          <span>
            Loading projects...
          </span>
        </div>
      )}

      {error && !loadingProjects && (
        <div className="state-panel state-error">
          <span className="state-label">
            ERROR
          </span>

          <span>{error}</span>
        </div>
      )}

      {!loadingProjects &&
        !error &&
        projects.length === 0 && (
          <div className="state-panel">
            <span className="state-label">
              EMPTY
            </span>

            <span>
              No projects are available.
            </span>
          </div>
        )}

      {!loadingProjects && projects.length > 0 && (
        <>
          <div className="dataset-project-selector">
            <label htmlFor="dataset-project">
              SELECT PROJECT
            </label>

            <select
              id="dataset-project"
              value={selectedProjectId ?? ''}
              onChange={(event) => {
                const nextProjectId = Number(
                  event.target.value,
                );

                setSelectedProjectId(
                  Number.isInteger(nextProjectId)
                    ? nextProjectId
                    : null,
                );
              }}
            >
              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))}
            </select>

            {selectedProject && (
              <span className="selector-context">
                PROJECT ID : {selectedProject.id}
              </span>
            )}
          </div>

          {loadingDatasets && (
            <div className="state-panel">
              <span className="state-label">
                STATUS
              </span>

              <span>
                Loading datasets...
              </span>
            </div>
          )}

          {!loadingDatasets &&
            !error &&
            datasets.length === 0 && (
              <div className="state-panel">
                <span className="state-label">
                  EMPTY
                </span>

                <span>
                  No datasets found for this project.
                </span>
              </div>
            )}

          {!loadingDatasets &&
            !error &&
            datasets.length > 0 && (
              <div className="datasets-table">
                <div className="datasets-table-header">
                  <span>ID</span>
                  <span>DATASET</span>
                  <span>PATH</span>
                  <span>CREATED</span>
                </div>

                {datasets.map((dataset) => (
                  <DatasetRow
                    key={dataset.id}
                    dataset={dataset}
                    onClick={() =>
                      handleDatasetSelect(dataset)
                    }
                  />
                ))}
              </div>
            )}
        </>
      )}
    </section>
  );
}