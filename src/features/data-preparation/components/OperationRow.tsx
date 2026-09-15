import type { PreparationOperation } from '../api/preparationApi';

interface OperationRowProps {
  operation: PreparationOperation;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function getOperationLabel(
  operation: PreparationOperation,
): string {
  return (
    operation.label ||
    operation.name ||
    operation.operation ||
    'Unnamed operation'
  );
}

export default function OperationRow({
  operation,
  selected,
  disabled = false,
  onToggle,
}: OperationRowProps) {
  const label = getOperationLabel(operation);

  return (
    <button
      type="button"
      className={`preparation-operation-row ${
        selected
          ? 'preparation-operation-row-active'
          : ''
      }`}
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <input
        className="operation-checkbox"
        type="checkbox"
        checked={selected}
        disabled={disabled}
        readOnly
        tabIndex={-1}
        aria-label={`Select ${label}`}
      />

      <span className="operation-name">
        {label}
      </span>

      <span className="operation-category">
        {operation.status || 'available'}
      </span>

      <span className="operation-description">
        {operation.description || 'No description provided.'}
      </span>
    </button>
  );
}