import type { Version } from '../api/versionsApi';

interface VersionRowProps {
  version: Version;
  onClick: () => void;
}

export function VersionRow({
  version,
  onClick,
}: VersionRowProps) {
  return (
    <button
      type="button"
      className="version-row"
      onClick={onClick}
    >
      <span className="version-number">
        V{version.version_number}
      </span>

      <span className="version-description">
        {version.description?.trim() ||
          'No version description'}
      </span>

      <span className="version-commit">
        {version.git_commit || '—'}
      </span>

      <span className="version-date">
        {new Date(
          version.created_at,
        ).toLocaleString()}
      </span>
    </button>
  );
}