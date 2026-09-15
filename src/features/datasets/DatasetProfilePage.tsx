import { useNavigate, useParams } from 'react-router-dom';

export function DatasetProfilePage() {
  const navigate = useNavigate();
  const { datasetId } = useParams();

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATASETS / PROFILE
          </div>

          <h1>PROFILE</h1>

          <div className="page-description">
            Dataset profiling is performed through the
            Data Preparation upload workflow.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate(`/datasets/${datasetId}`)
          }
        >
          &lt; DATASET
        </button>
      </div>

      <div className="state-panel">
        <span className="state-label">
          PROFILE WORKFLOW
        </span>

        <span>
          This dataset has not been uploaded into the
          Data Preparation workspace yet.
        </span>
      </div>

      <div className="profile-action-panel">
        <div>
          <div className="panel-label">
            DATA PREPARATION
          </div>

          <div className="panel-value">
            Upload the source dataset to generate its
            backend profile.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate('/data-preparation/upload')
          }
        >
          &gt; UPLOAD &amp; PROFILE
        </button>
      </div>
    </section>
  );
}