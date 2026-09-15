import type { Dataset } from '../api/datasetsApi';

interface DatasetRowProps {
  dataset: Dataset;
  onClick: () => void;
}

export function DatasetRow({
  dataset,
  onClick,
}: DatasetRowProps) {
  return (
    <button
      type="button"
      className="dataset-row"
      onClick={onClick}
    >
      <span className="dataset-id">
        {dataset.id}
      </span>

      <span className="dataset-name">
        {dataset.name}
      </span>

      <span className="dataset-path">
        {dataset.path}
      </span>

      <span className="dataset-date">
        {new Date(
          dataset.created_at,
        ).toLocaleString()}
      </span>
    </button>
  );
}