import { useNavigate } from 'react-router-dom';

const dataItems = [
  'DATASETS',
  'PROJECTS',
  'DATA PREPARATION',
];

const insightItems = [
  'REPORTS',
  'COMPARE',
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleNavigation = (
    item: string,
  ) => {
    switch (item) {
      case 'DATASETS':
        navigate('/datasets');
        break;

      case 'PROJECTS':
        navigate('/projects');
        break;

      case 'DATA PREPARATION':
        navigate('/data-preparation');
        break;

      case 'REPORTS':
        navigate('/reports');
        break;

      case 'COMPARE':
        navigate('/compare');
        break;

      default:
        break;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-heading">
          DATA
        </div>

        {dataItems.map((item) => (
          <button
            type="button"
            className="sidebar-item"
            key={item}
            onClick={() =>
              handleNavigation(item)
            }
          >
            <span className="sidebar-caret">
              &gt;
            </span>

            <span>{item}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-heading">
          AI &amp; INSIGHTS
        </div>

        {insightItems.map((item) => (
          <button
            type="button"
            className="sidebar-item"
            key={item}
            onClick={() =>
              handleNavigation(item)
            }
          >
            <span className="sidebar-caret">
              &gt;
            </span>

            <span>{item}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <span>DATAGIT CLI</span>
        <span>v0.1.0</span>
      </div>
    </aside>
  );
}