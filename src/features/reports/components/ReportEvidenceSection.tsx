interface Props {
  title: string;
  data?: unknown;
}

function renderValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  if (
    typeof value === 'object'
  ) {
    return JSON.stringify(value);
  }

  return String(value);
}

export function ReportEvidenceSection({
  title,
  data,
}: Props) {
  if (
    data === null ||
    data === undefined
  ) {
    return null;
  }

  if (
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    return (
      <section className="report-section">
        <div className="report-section-title">
          {title}
        </div>

        <div className="report-single-value">
          {renderValue(data)}
        </div>
      </section>
    );
  }

  const entries = Object.entries(
    data as Record<string, unknown>,
  );

  if (!entries.length) {
    return null;
  }

  return (
    <section className="report-section">
      <div className="report-section-title">
        {title}
      </div>

      <div className="report-evidence-grid">
        {entries.map(([key, value]) => (
          <div
            className="report-evidence-item"
            key={key}
          >
            <span>
              {key
                .replace(/_/g, ' ')
                .toUpperCase()}
            </span>

            <strong>
              {renderValue(value)}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}