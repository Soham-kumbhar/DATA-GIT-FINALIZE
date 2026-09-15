interface ProfileTableProps {
  data: Record<string, unknown>;
}

export function ProfileTable({
  data,
}: ProfileTableProps) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div className="state-panel">
        <span className="state-label">EMPTY</span>
        <span>No profile information returned.</span>
      </div>
    );
  }

  return (
    <div className="dataset-profile-table">
      {entries.map(([key, value]) => (
        <div className="dataset-profile-row" key={key}>
          <span className="dataset-profile-key">
            {key}
          </span>

          <span className="dataset-profile-value">
            {typeof value === 'object'
              ? JSON.stringify(value)
              : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}