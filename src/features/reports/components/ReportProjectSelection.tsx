import type {
  ReportProject,
  ReportVersion,
} from '../types/report';

import './ReportProjectSelection.css';

interface Props {
  projects: ReportProject[];
  latestVersions: Record<
    number,
    ReportVersion | null
  >;
  selectedProjectId: number | null;
  loading: boolean;
  onSelect: (
    projectId: number,
  ) => void;
}

function asRecord(
  value: unknown,
): Record<string, unknown> {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function text(
  value: unknown,
  fallback = '—',
): string {
  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    return value.trim();
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  return fallback;
}

function datasetLabel(
  version: ReportVersion | null,
): string {
  if (!version) {
    return '—';
  }

  const state = asRecord(
    version.dvc_state,
  );

  const dataPath = text(
    state.data_path,
    '',
  );

  const dvcFile = text(
    state.dvc_file,
    '',
  );

  if (dataPath) {
    const normalizedDvcFile =
      dvcFile.replaceAll(
        '\\',
        '/',
      );

    const normalizedDataPath =
      dataPath.replaceAll(
        '\\',
        '/',
      );

    const slash =
      normalizedDvcFile.lastIndexOf(
        '/',
      );

    if (
      slash >= 0 &&
      !normalizedDataPath.includes(
        '/',
      )
    ) {
      return `${normalizedDvcFile.slice(
        0,
        slash,
      )}/${normalizedDataPath}`;
    }

    return normalizedDataPath;
  }

  if (dvcFile) {
    return dvcFile
      .replaceAll('\\', '/')
      .replace(/\.dvc$/i, '');
  }

  return '—';
}

function versionStatus(
  version: ReportVersion | null,
): string {
  if (!version) {
    return 'NO VERSION';
  }

  const hasGit =
    Boolean(version.git_commit);

  const hasDvc =
    Object.keys(
      asRecord(
        version.dvc_state,
      ),
    ).length > 0;

  if (hasGit && hasDvc) {
    return 'FINALIZED';
  }

  if (hasGit || hasDvc) {
    return 'PARTIAL';
  }

  return 'RECORDED';
}

function relativeDate(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !value
  ) {
    return '—';
  }

  const time =
    new Date(value).getTime();

  if (Number.isNaN(time)) {
    return '—';
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - time) /
        1000,
    ),
  );

  if (seconds < 60) {
    return 'just now';
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  const months =
    Math.floor(days / 30);

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(
    months / 12,
  )}y ago`;
}

function shortDescription(
  project: ReportProject,
): string {
  return text(
    project.description,
    'Local ML workspace with versioned data and experiment evidence.',
  );
}

export function ReportProjectSelection({
  projects,
  latestVersions,
  selectedProjectId,
  loading,
  onSelect,
}: Props) {
  return (
    <section className="report-project-selection">
      <div className="report-project-page-title">
        <span>PROJECTS</span>
      </div>

      <div className="report-project-grid">
        {loading
          ? [0, 1, 2].map(
              (item) => (
                <div
                  className="report-project-card report-project-card-skeleton"
                  key={`project-skeleton-${item}`}
                >
                  <div className="report-project-skeleton-title" />

                  <div className="report-project-terminal-skeleton">
                    <div className="report-project-skeleton-line large" />

                    <div className="report-project-skeleton-line" />

                    <div className="report-project-skeleton-line" />

                    <div className="report-project-skeleton-line short" />

                    <div className="report-project-skeleton-box" />
                  </div>
                </div>
              ),
            )
          : projects.map(
              (project, index) => {
                const version =
                  latestVersions[
                    project.id
                  ] ?? null;

                const selected =
                  selectedProjectId ===
                  project.id;

                return (
                  <button
                    type="button"
                    key={project.id}
                    className={`report-project-card ${
                      selected
                        ? 'is-selected'
                        : ''
                    }`}
                    onClick={() =>
                      onSelect(
                        project.id,
                      )
                    }
                    aria-pressed={
                      selected
                    }
                  >
                    <span className="report-project-card-index">
                      PROJECT {index + 1}
                    </span>

                    <span className="report-project-terminal">
                      <span className="report-project-terminal-bar">
                        <span className="report-project-terminal-lights">
                          <i />
                          <i />
                          <i />
                        </span>

                        <span className="report-project-terminal-name">
                          {project.name}
                        </span>

                        <span className="report-project-terminal-live">
                          <b /> LIVE
                        </span>
                      </span>

                      <span className="report-project-terminal-body">
                        <span className="report-project-command">
                          &gt;_ report --project{' '}
                          {project.id}
                        </span>

                        <span className="report-project-summary-box">
                          <span className="report-project-summary-name">
                            {project.name}
                          </span>

                          <span className="report-project-summary-description">
                            {shortDescription(
                              project,
                            )}
                          </span>

                          <span className="report-project-facts">
                            <span>
                              <em>
                                Owner
                              </em>

                              <strong>
                                LOCAL WORKSPACE
                              </strong>
                            </span>

                            <span>
                              <em>
                                Dataset
                              </em>

                              <strong>
                                {datasetLabel(
                                  version,
                                )}
                              </strong>
                            </span>

                            <span>
                              <em>
                                Version
                              </em>

                              <strong>
                                {version
                                  ? `V${version.version_number}`
                                  : '—'}
                              </strong>
                            </span>
                          </span>

                          <span className="report-project-status-block">
                            <span className="report-project-status-label">
                              VERSION STATUS
                            </span>

                            <strong
                              className={
                                versionStatus(
                                  version,
                                ) ===
                                'FINALIZED'
                                  ? 'is-positive'
                                  : versionStatus(
                                        version,
                                      ) ===
                                    'PARTIAL'
                                  ? 'is-warning'
                                  : ''
                              }
                            >
                              <b>
                                •
                              </b>{' '}
                              {versionStatus(
                                version,
                              )}
                            </strong>
                          </span>

                          <span className="report-project-dates">
                            <span>
                              <em>
                                CREATED
                              </em>

                              <strong>
                                {relativeDate(
                                  project.created_at,
                                )}
                              </strong>
                            </span>

                            <span>
                              <em>
                                UPDATED
                              </em>

                              <strong>
                                {relativeDate(
                                  project.updated_at,
                                )}
                              </strong>
                            </span>
                          </span>

                          <span className="report-project-open">
                            {selected
                              ? '[ Project Selected ]'
                              : '[ Open Project → ]'}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              },
            )}
      </div>

      {!loading &&
      selectedProjectId !==
        null ? (
        <div className="report-project-selection-command">
          <span>
            PROJECT{' '}
            {selectedProjectId}{' '}
            SELECTED
          </span>

          <span>
            NEXT &gt; VERSION
            HISTORY
          </span>
        </div>
      ) : null}
    </section>
  );
}

export default ReportProjectSelection;