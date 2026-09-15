interface Metric {
  label: string;
  value: string;
}

interface Props {
  metrics: Metric[];
}

export function ReportMetricStrip({
  metrics,
}: Props) {
  return (
    <div className="report-metrics">
      {metrics.map((metric) => (
        <div
          className="report-metric"
          key={metric.label}
        >
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}