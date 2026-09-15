import type { ReportVersion } from '../types/report';

interface Props {
  versions: ReportVersion[];
  value: number | null;
  loading: boolean;
  onChange: (versionId: number) => void;
}

export function ReportVersionSelector({
  versions,
  value,
  loading,
  onChange,
}: Props) {
  return (
    <div className="report-selector">
      <label htmlFor="report-version">
        VERSION
      </label>

      <select
        id="report-version"
        value={value ?? ''}
        disabled={
          loading || versions.length === 0
        }
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      >
        <option value="">
          SELECT VERSION
        </option>

        {versions.map((version) => (
          <option
            value={version.id}
            key={version.id}
          >
            V{version.version_number}
            {version.description
              ? ` — ${version.description}`
              : ''}
          </option>
        ))}
      </select>
    </div>
  );
}