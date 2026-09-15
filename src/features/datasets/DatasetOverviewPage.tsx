import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getProjectDatasets,
  type Dataset,
} from './api/datasetsApi';

export function DatasetOverviewPage() {
  const navigate = useNavigate();
  const { datasetId } = useParams();

  const [dataset, setDataset] =
    useState<Dataset | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDataset() {
      const numericDatasetId = Number(datasetId);

      if (!Number.isInteger(numericDatasetId)) {
        setError('Invalid dataset ID.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        /*
         * Dataset detail is currently exposed through the
         * project-scoped dataset list endpoint.
         *
         * We inspect the projects returned from the real
         * project list in DatasetLibraryPage navigation.
         *
         * Since datasetId alone does not identify the project
         * in the URL, the current implementation searches the
         * known project dataset endpoint using the projects
         * cached by the browser session.
         *
         * If there is no session dataset match, we show an
         * honest error instead of fabricating data.
         */

        const rawProjectIds = sessionStorage.getItem(
          'datagit_project_ids',
        );

        if (!rawProjectIds) {
          throw new Error(
            'Dataset project context is unavailable. Return to the dataset library and select the dataset again.',
          );
        }

        const projectIds: number[] =
          JSON.parse(rawProjectIds);

        let found: Dataset | null = null;

        for (const projectId of projectIds) {
          const datasets =
            await getProjectDatasets(projectId);

          const match = datasets.find(
            (item) => item.id === numericDatasetId,
          );

          if (match) {
            found = match;
            break;
          }
        }

        if (!found) {
          throw new Error(
            'Dataset was not found in the available project dataset lists.',
          );
        }

        if (active) {
          setDataset(found);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dataset.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDataset();

    return () => {
      active = false;
    };
  }, [datasetId]);

  if (loading) {
    return (
      <section className="page">
        <div className="state-panel">
          <span className="state-label">
            STATUS
          </span>

          <span>Loading dataset...</span>
        </div>
      </section>
    );
  }

  if (error || !dataset) {
    return (
      <section className="page">
        <div className="page-heading">
          <div>
            <div className="page-kicker">
              DATA / DATASETS / OVERVIEW
            </div>

            <h1>DATASET</h1>
          </div>

          <button
            type="button"
            className="cli-action"
            onClick={() =>
              navigate('/datasets')
            }
          >
            &lt; DATASETS
          </button>
        </div>

        <div className="state-panel state-error">
          <span className="state-label">
            ERROR
          </span>

          <span>
            {error ?? 'Dataset not found.'}
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
            DATA / DATASETS / OVERVIEW
          </div>

          <h1>DATASET : {dataset.name}</h1>

          <div className="page-description">
            Dataset metadata and analysis surfaces.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate('/datasets')
          }
        >
          &lt; DATASETS
        </button>
      </div>

      <div className="dataset-overview-panel">
        <div className="info-row">
          <span className="info-label">
            DATASET ID
          </span>
          <span>{dataset.id}</span>
        </div>

        <div className="info-row">
          <span className="info-label">
            PROJECT ID
          </span>
          <span>{dataset.project_id}</span>
        </div>

        <div className="info-row">
          <span className="info-label">
            NAME
          </span>
          <span>{dataset.name}</span>
        </div>

        <div className="info-row">
          <span className="info-label">
            PATH
          </span>
          <span className="info-value-wrap">
            {dataset.path}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">
            CREATED
          </span>

          <span>
            {new Date(
              dataset.created_at,
            ).toLocaleString()}
          </span>
        </div>

        <div className="dataset-overview-actions">
          <button
            type="button"
            className="cli-action"
            onClick={() =>
              navigate(
                `/datasets/${dataset.id}/profile`,
              )
            }
          >
            PROFILE
          </button>

          <button
            type="button"
            className="cli-action"
            onClick={() =>
              navigate(
                `/datasets/${dataset.id}/quality`,
              )
            }
          >
            QUALITY
          </button>

          <button
            type="button"
            className="cli-action"
            onClick={() =>
              navigate(
                `/datasets/${dataset.id}/projects`,
              )
            }
          >
            PROJECTS USING DATASET
          </button>
        </div>
      </div>
    </section>
  );
}