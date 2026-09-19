import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  CSSProperties,
  MouseEvent,
} from 'react';

import type {
  ReportProject,
  ReportVersion,
} from '../types/report';

import './ReportVersionTimeline.css';

interface Props {
  project: ReportProject;
  versions: ReportVersion[];
  loading: boolean;
  selectedVersionId: number | null;
  onSelectVersion: (
    versionId: number,
  ) => void;
  onBack: () => void;
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

function shortHash(
  value: unknown,
): string {
  const raw = text(
    value,
    '',
  );

  if (!raw) {
    return '—';
  }

  return raw.length > 9
    ? raw.slice(0, 9)
    : raw;
}

function datasetPath(
  version: ReportVersion,
): string {
  const dvc = asRecord(
    version.dvc_state,
  );

  const dataPath = text(
    dvc.data_path,
    '',
  );

  const dvcFile = text(
    dvc.dvc_file,
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

  return 'DATASET STATE NOT RECORDED';
}

function status(
  version: ReportVersion,
): string {
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

function formatDate(
  value: unknown,
): string {
  const raw = text(
    value,
    '',
  );

  if (!raw) {
    return '—';
  }

  const date =
    new Date(raw);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return raw;
  }

  return date.toLocaleString(
    undefined,
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );
}

function statusTone(
  value: string,
): string {
  if (
    value === 'FINALIZED'
  ) {
    return 'report-version-status-finalized';
  }

  if (
    value === 'PARTIAL'
  ) {
    return 'report-version-status-partial';
  }

  return 'report-version-status-recorded';
}

export function ReportVersionTimeline({
  project,
  versions,
  loading,
  selectedVersionId,
  onSelectVersion,
  onBack,
}: Props) {
  const cardRefs = useRef<
    Record<
      number,
      HTMLButtonElement | null
    >
  >({});

  const [
    visibleVersions,
    setVisibleVersions,
  ] = useState<Set<number>>(
    new Set(),
  );

  const [
    hoveredVersionId,
    setHoveredVersionId,
  ] = useState<number | null>(
    null,
  );

  const orderedVersions =
    useMemo(
      () =>
        [...versions].sort(
          (a, b) =>
            b.version_number -
            a.version_number,
        ),
      [versions],
    );

  useEffect(() => {
    const elements =
      orderedVersions
        .map(
          (version) =>
            cardRefs.current[
              version.id
            ],
        )
        .filter(
          (
            element,
          ): element is HTMLButtonElement =>
            Boolean(element),
        );

    if (
      elements.length === 0
    ) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          setVisibleVersions(
            (current) => {
              const next =
                new Set(current);

              for (
                const entry of entries
              ) {
                const element =
                  entry.target as HTMLElement;

                const id =
                  Number(
                    element.dataset
                      .versionId,
                  );

                if (
                  entry.isIntersecting
                ) {
                  next.add(id);
                }
              }

              return next;
            },
          );
        },
        {
          root: null,
          rootMargin:
            '0px 0px -10% 0px',
          threshold: 0.12,
        },
      );

    elements.forEach(
      (element) =>
        observer.observe(element),
    );

    return () =>
      observer.disconnect();
  }, [orderedVersions]);

  function setPointerPosition(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    const element =
      event.currentTarget;

    const rect =
      element.getBoundingClientRect();

    const x =
      event.clientX -
      rect.left;

    const y =
      event.clientY -
      rect.top;

    element.style.setProperty(
      '--pointer-x',
      `${x}px`,
    );

    element.style.setProperty(
      '--pointer-y',
      `${y}px`,
    );
  }

  if (loading) {
    return (
      <section className="report-version-page">
        <div className="report-version-header">
          <button
            type="button"
            className="report-version-back"
            onClick={onBack}
          >
            <span>←</span>{' '}
            PROJECTS
          </button>

          <div className="report-version-heading">
            <span className="report-version-kicker">
              PROJECT / VERSION HISTORY
            </span>

            <h1>
              {project.name}
            </h1>

            <p>
              Reading recorded
              project versions...
            </p>
          </div>
        </div>

        <div className="report-version-loading">
          {[0, 1, 2, 3].map(
            (index) => (
              <div
                className="report-version-skeleton"
                key={index}
              >
                <div />

                <span />

                <span />

                <span />
              </div>
            ),
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="report-version-page">
      <div className="report-version-header">
        <button
          type="button"
          className="report-version-back"
          onClick={onBack}
        >
          <span>←</span>{' '}
          PROJECTS
        </button>

        <div className="report-version-heading">
          <span className="report-version-kicker">
            PROJECT / VERSION HISTORY
          </span>

          <h1>
            {project.name}
          </h1>

          <p>
            Move through the
            recorded states of
            this ML workspace.
            Hover a version to
            inspect it; click to
            select it for the
            next report step.
          </p>
        </div>

        <div className="report-version-counter">
          <span>VERSIONS</span>

          <strong>
            {orderedVersions.length}
          </strong>
        </div>
      </div>

      {orderedVersions.length ===
      0 ? (
        <div className="report-version-empty">
          <span className="report-version-empty-code">
            NO_VERSION_STATE
          </span>

          <p>
            No versions are
            currently recorded
            for this project.
          </p>
        </div>
      ) : (
        <div className="report-version-scroll">
          <div className="report-version-timeline">
            <div className="report-version-line" />

            {orderedVersions.map(
              (
                version,
                index,
              ) => {
                const versionStatus =
                  status(version);

                const visible =
                  visibleVersions.has(
                    version.id,
                  );

                const hovered =
                  hoveredVersionId ===
                  version.id;

                const selected =
                  selectedVersionId ===
                  version.id;

                return (
                  <div
                    className={`report-version-item ${
                      visible
                        ? 'is-visible'
                        : ''
                    } ${
                      hovered
                        ? 'is-hovered'
                        : ''
                    } ${
                      selected
                        ? 'is-selected'
                        : ''
                    }`}
                    key={version.id}
                    style={
                      {
                        '--item-delay': `${Math.min(
                          index * 80,
                          480,
                        )}ms`,
                      } as CSSProperties
                    }
                  >
                    <span
                      className="report-version-node"
                      aria-hidden="true"
                    />

                    <button
                      ref={(
                        element:
                          | HTMLButtonElement
                          | null,
                      ) => {
                        cardRefs.current[
                          version.id
                        ] = element;
                      }}
                      data-version-id={
                        version.id
                      }
                      type="button"
                      className="report-version-card"
                      onClick={() =>
                        onSelectVersion(
                          version.id,
                        )
                      }
                      onMouseEnter={() =>
                        setHoveredVersionId(
                          version.id,
                        )
                      }
                      onMouseLeave={() =>
                        setHoveredVersionId(
                          null,
                        )
                      }
                      onMouseMove={
                        setPointerPosition
                      }
                      aria-pressed={
                        selected
                      }
                    >
                      <span className="report-version-glow" />

                      <span className="report-version-card-topline">
                        <span className="report-version-label">
                          VERSION{' '}
                          {
                            version.version_number
                          }
                        </span>

                        <span
                          className={`report-version-status ${statusTone(
                            versionStatus,
                          )}`}
                        >
                          <i />

                          {
                            versionStatus
                          }
                        </span>
                      </span>

                      <span className="report-version-card-main">
                        <strong className="report-version-number">
                          {
                            version.version_number
                          }
                        </strong>

                        <span className="report-version-description">
                          {text(
                            version.description,
                            'No description recorded for this version.',
                          )}
                        </span>
                      </span>

                      <span className="report-version-divider" />

                      <span className="report-version-facts">
                        <span>
                          <em>
                            CREATED
                          </em>

                          <strong>
                            {formatDate(
                              version.created_at,
                            )}
                          </strong>
                        </span>

                        <span>
                          <em>
                            COMMIT
                          </em>

                          <strong>
                            {shortHash(
                              version.git_commit,
                            )}
                          </strong>
                        </span>

                        <span>
                          <em>
                            DATASET
                          </em>

                          <strong>
                            {datasetPath(
                              version,
                            )}
                          </strong>
                        </span>
                      </span>

                      <span className="report-version-card-footer">
                        <span>
                          {selected
                            ? '[ VERSION SELECTED ]'
                            : '[ INSPECT VERSION → ]'}
                        </span>

                        {version.ml_run_id ? (
                          <span>
                            ML RUN #
                            {
                              version.ml_run_id
                            }
                          </span>
                        ) : (
                          <span>
                            ML RUN NOT
                            RECORDED
                          </span>
                        )}
                      </span>
                    </button>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      {selectedVersionId !==
      null ? (
        <div className="report-version-selected-bar">
          <span>
            V
            {orderedVersions.find(
              (version) =>
                version.id ===
                selectedVersionId,
            )?.version_number ??
              '—'}{' '}
            SELECTED
          </span>

          <span>
            NEXT → DETAILED REPORT
          </span>
        </div>
      ) : null}
    </section>
  );
}

export default ReportVersionTimeline;