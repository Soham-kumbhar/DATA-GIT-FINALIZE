import type { ReportProject } from '../types/report';

interface Props {
  projects: ReportProject[];
  value: number | null;
  loading: boolean;
  onChange: (projectId: number) => void;
}

export function ReportProjectSelector({
  projects,
  value,
  loading,
  onChange,
}: Props) {
  return (
    <div className="report-selector">
      <label htmlFor="report-project">
        PROJECT
      </label>

      <select
        id="report-project"
        value={value ?? ''}
        disabled={loading}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      >
        <option value="">
          SELECT PROJECT
        </option>

        {projects.map((project) => (
          <option
            value={project.id}
            key={project.id}
          >
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}