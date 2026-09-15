import type {
  ReportProject,
  ReportVersionDetail,
} from '../types/report';

function shortCommit(
  value?: string | null,
) {
  if (!value) {
    return '—';
  }

  return value.length > 12
    ? value.slice(0, 12)
    : value;
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function dvcStatus(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 'UNAVAILABLE';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const record =
      value as Record<string, unknown>;

    if (typeof record.status === 'string') {
      return record.status;
    }

    if (typeof record.synced === 'boolean') {
      return record.synced
        ? 'SYNCED'
        : 'NOT SYNCED';
    }
  }

  return 'AVAILABLE';
}

export function ReportContextHeader({
  project,
  version,
}: {
  project: ReportProject;
  version: ReportVersionDetail;
}) {
  return (
    <section className="report-context">
      <div className="report-context-title">
        REPORT
      </div>

      <div className="report-context-grid">
        <div>
          <span>PROJECT</span>
          <strong>{project.name}</strong>
        </div>

        <div>
          <span>VERSION</span>
          <strong>
            V{version.version_number}
          </strong>
        </div>

        <div>
          <span>GIT</span>
          <strong>
            {shortCommit(
              version.git_commit,
            )}
          </strong>
        </div>

        <div>
          <span>DVC</span>
          <strong>
            {dvcStatus(
              version.dvc_state,
            )}
          </strong>
        </div>

        <div>
          <span>CREATED</span>
          <strong>
            {formatDate(
              version.created_at,
            )}
          </strong>
        </div>
      </div>
    </section>
  );
}