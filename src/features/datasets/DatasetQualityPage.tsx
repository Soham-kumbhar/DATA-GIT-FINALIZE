import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getProjectDatasets,
  type Dataset,
} from './api/datasetsApi';

interface QualityMetric {
  label: string;
  value: string;
}

export function DatasetQualityPage() {
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
      try {
        const rawProjectIds =
          sessionStorage.getItem(
            'datagit_project_ids',
          );

        if (!rawProjectIds) {
          throw new Error(
            'Project context is unavailable.',
          );
        }

        const projectIds: number[] =
          JSON.parse(rawProjectIds);

        const numericDatasetId =
          Number(datasetId);

        for (const projectId of projectIds) {
          const datasets =
            await getProjectDatasets(projectId);

          const match = datasets.find(
            (item) =>
              item.id === numericDatasetId,
          );

          if (match) {
            if (active) {
              setDataset(match);
            }

            return;
          }
        }

        throw new Error(
          'Dataset was not found.',
        );
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

  const metrics: QualityMetric[] = [
    {
      label: 'DATASET',
      value: dataset.name,
    },
    {
      label: 'SOURCE',
      value: dataset.path,
    },
    {
      label: 'PROJECT ID',
      value: String(dataset.project_id),
    },
    {
      label: 'CREATED',
      value: new Date(
        dataset.created_at,
      ).toLocaleString(),
    },
  ];

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATASETS / QUALITY
          </div>

          <h1>QUALITY</h1>

          <div className="page-description">
            Verified dataset metadata currently exposed by
            the backend.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate(
              `/datasets/${dataset.id}`,
            )
          }
        >
          &lt; DATASET
        </button>
      </div>

      <div className="quality-grid">
        {metrics.map((metric) => (
          <div
            className="quality-card"
            key={metric.label}
          >
            <div className="quality-label">
              {metric.label}
            </div>

            <div className="quality-value">
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="state-panel">
        <span className="state-label">
          NOTE
        </span>

        <span>
          The current backend does not expose a dedicated
          quality-analysis endpoint, so no missingness,
          duplicate, schema, or quality score is fabricated
          here.
        </span>
      </div>
    </section>
  );
}