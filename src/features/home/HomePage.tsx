import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <section className="page">
      <div className="workspace-header">
        <span className="prompt">&gt;</span>
        <span>DATAGIT</span>
        <span className="muted">/</span>
        <span className="muted">HOME</span>
      </div>

      <div className="workspace-content">
        <div className="welcome-block">
          <div className="welcome-title">
            DATAGIT
          </div>

          <div className="welcome-subtitle">
            Dataset versioning, preparation, and
            engineering workspace.
          </div>

          <div className="command-line">
            <span className="command-symbol">
              &gt;
            </span>

            <span className="command-text">
              SELECT A WORKSPACE
            </span>
          </div>
        </div>

        <div className="home-command-grid">
          <button
            type="button"
            className="home-command-row"
            onClick={() => navigate('/projects')}
          >
            <span className="home-command-symbol">
              &gt;
            </span>

            <span className="home-command-name">
              SELECT PROJECT
            </span>

            <span className="home-command-description">
              Open a project and inspect its versions.
            </span>
          </button>

          <button
            type="button"
            className="home-command-row"
            onClick={() => navigate('/datasets')}
          >
            <span className="home-command-symbol">
              &gt;
            </span>

            <span className="home-command-name">
              OPEN DATASETS
            </span>

            <span className="home-command-description">
              Browse datasets registered in project
              context.
            </span>
          </button>

          <button
            type="button"
            className="home-command-row"
            onClick={() =>
              navigate('/data-preparation')
            }
          >
            <span className="home-command-symbol">
              &gt;
            </span>

            <span className="home-command-name">
              PREPARE DATA
            </span>

            <span className="home-command-description">
              Configure and validate a preparation plan.
            </span>
          </button>

          <button
            type="button"
            className="home-command-row"
            onClick={() => navigate('/reports')}
          >
            <span className="home-command-symbol">
              &gt;
            </span>

            <span className="home-command-name">
              VIEW REPORTS
            </span>

            <span className="home-command-description">
              Open backend-generated reports and insights.
            </span>
          </button>

          <button
            type="button"
            className="home-command-row"
            onClick={() => navigate('/compare')}
          >
            <span className="home-command-symbol">
              &gt;
            </span>

            <span className="home-command-name">
              COMPARE VERSIONS
            </span>

            <span className="home-command-description">
              Compare available project versions.
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}