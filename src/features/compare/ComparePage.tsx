import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCompareProjects,
  getCompareVersions,
  getVersionComparison,
} from './compareApi';

import type {
  ComparePayload,
  CompareRecommendation,
} from './compareApi';

import AIExplanationPanel from './AIExplanationPanel';

import type {
  ReportProject,
  ReportVersion,
} from '../reports/types/report';

import './Compare.css';


function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}


function formatNumber(
  value: unknown,
): string {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return '—';
  }

  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 4,
    },
  ).format(value);
}


function shortCommit(
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }

  return value.length > 12
    ? `${value.slice(0, 12)}…`
    : value;
}


function getDvcLabel(
  value:
    | Record<string, unknown>
    | null
    | undefined,
): string {
  if (!value) {
    return 'NOT AVAILABLE';
  }

  if (
    value.is_repository ===
    false
  ) {
    return 'NOT DETECTED';
  }

  if (
    value.is_repository ===
    true
  ) {
    return 'PRESENT';
  }

  return 'RECORDED';
}


function objectEntries(
  value: unknown,
): [string, unknown][] {
  return isRecord(value)
    ? Object.entries(value)
    : [];
}


function EvidenceValue({
  value,
}: {
  value: unknown;
}) {
  if (
    value === null ||
    value === undefined
  ) {
    return (
      <span className="compare-muted">
        —
      </span>
    );
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return (
      <span>
        {String(value)}
      </span>
    );
  }

  return (
    <pre className="compare-structured-value">
      {JSON.stringify(
        value,
        null,
        2,
      )}
    </pre>
  );
}


function EvidenceState({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="compare-evidence-state">
      <span className="compare-evidence-marker">
        ×
      </span>

      <span>
        {children}
      </span>
    </div>
  );
}


function MetricRow({
  label,
  before,
  after,
}: {
  label: string;
  before: React.ReactNode;
  after: React.ReactNode;
}) {
  return (
    <div className="compare-metric-row">
      <div className="compare-metric-label">
        {label}
      </div>

      <div className="compare-metric-value">
        {before}
      </div>

      <div className="compare-metric-arrow">
        →
      </div>

      <div className="compare-metric-value">
        {after}
      </div>
    </div>
  );
}


function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="compare-section">
      <div className="compare-section-heading">
        <span className="compare-section-number">
          {number}
        </span>

        <div>
          <h2 className="compare-section-title">
            {title}
          </h2>

          <p className="compare-section-subtitle">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="compare-section-body">
        {children}
      </div>
    </section>
  );
}


export default function ComparePage() {
  const [
    projects,
    setProjects,
  ] = useState<
    ReportProject[]
  >([]);

  const [
    versions,
    setVersions,
  ] = useState<
    ReportVersion[]
  >([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState<
    number | null
  >(null);

  const [
    versionAId,
    setVersionAId,
  ] = useState<
    number | null
  >(null);

  const [
    versionBId,
    setVersionBId,
  ] = useState<
    number | null
  >(null);

  const [
    comparison,
    setComparison,
  ] = useState<
    ComparePayload | null
  >(null);

  const [
    loadingProjects,
    setLoadingProjects,
  ] = useState(true);

  const [
    loadingVersions,
    setLoadingVersions,
  ] = useState(false);

  const [
    loadingComparison,
    setLoadingComparison,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoadingProjects(true);
        setError('');

        const result =
          await getCompareProjects();

        if (!active) {
          return;
        }

        setProjects(result);

        if (result.length > 0) {
          setSelectedProjectId(
            result[0].id,
          );
        } else {
          setSelectedProjectId(
            null,
          );
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load projects.',
        );
      } finally {
        if (active) {
          setLoadingProjects(
            false,
          );
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    if (
      selectedProjectId ===
      null
    ) {
      setVersions([]);
      setVersionAId(null);
      setVersionBId(null);
      setComparison(null);
      return;
    }

    const projectId =
      selectedProjectId;

    let active = true;

    async function loadVersions() {
      try {
        setLoadingVersions(true);
        setError('');
        setComparison(null);

        const result =
          await getCompareVersions(
            projectId,
          );

        if (!active) {
          return;
        }

        const sorted =
          [...result].sort(
            (a, b) =>
              a.version_number -
              b.version_number,
          );

        setVersions(sorted);

        if (sorted.length >= 2) {
          setVersionAId(
            sorted[
              sorted.length - 2
            ].id,
          );

          setVersionBId(
            sorted[
              sorted.length - 1
            ].id,
          );
        } else {
          setVersionAId(
            sorted[0]?.id ??
              null,
          );

          setVersionBId(
            null,
          );
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setVersions([]);
        setVersionAId(null);
        setVersionBId(null);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load project versions.',
        );
      } finally {
        if (active) {
          setLoadingVersions(
            false,
          );
        }
      }
    }

    void loadVersions();

    return () => {
      active = false;
    };
  }, [
    selectedProjectId,
  ]);


  useEffect(() => {
    if (
      selectedProjectId ===
        null ||
      versionAId === null ||
      versionBId === null ||
      versionAId ===
        versionBId
    ) {
      setComparison(null);
      return;
    }

    const projectId =
      selectedProjectId;

    const versionA =
      versionAId;

    const versionB =
      versionBId;

    let active = true;

    async function loadComparison() {
      try {
        setLoadingComparison(
          true,
        );

        setError('');

        const result =
          await getVersionComparison(
            projectId,
            versionA,
            versionB,
            true,
          );

        if (!active) {
          return;
        }

        setComparison(result);
      } catch (err) {
        if (!active) {
          return;
        }

        setComparison(null);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load version comparison.',
        );
      } finally {
        if (active) {
          setLoadingComparison(
            false,
          );
        }
      }
    }

    void loadComparison();

    return () => {
      active = false;
    };
  }, [
    selectedProjectId,
    versionAId,
    versionBId,
  ]);


  const selectedVersionA =
    versions.find(
      (version) =>
        version.id ===
        versionAId,
    ) ?? null;


  const selectedVersionB =
    versions.find(
      (version) =>
        version.id ===
        versionBId,
    ) ?? null;


  const profileBefore =
    comparison
      ?.dataset_profiles
      ?.before ?? null;


  const profileAfter =
    comparison
      ?.dataset_profiles
      ?.after ?? null;


  const analysis =
    comparison
      ?.dataset_analysis ??
    null;


  const datasetRecords =
    comparison
      ?.dataset_diff
      ?.datasets ?? [];


  const featureChanges =
    analysis
      ?.feature_changes
      ?.features_changed ??
    {};


  const columnsAdded =
    analysis
      ?.columns_added ??
    [];


  const columnsRemoved =
    analysis
      ?.columns_removed ??
    [];


  const rowChangeCount =
    datasetRecords.reduce(
      (
        total,
        item,
      ) =>
        total +
        Math.abs(
          item.rows_added ??
            0,
        ) +
        Math.abs(
          item.rows_removed ??
            0,
        ),
      0,
    );


  const actualSchemaChanges =
    columnsAdded.length +
    columnsRemoved.length;


  const actualDatasetChanges =
    actualSchemaChanges +
    Object.keys(
      featureChanges,
    ).length +
    rowChangeCount;


  const hasQualityEvidence =
    profileBefore !== null ||
    profileAfter !== null ||
    analysis
      ?.available === true;


  const hasModelEvidence =
    comparison
      ?.ml_comparison !==
      null &&
    comparison
      ?.ml_comparison !==
      undefined;


  const metricBefore =
    comparison
      ?.performance
      ?.metrics_before ??
    comparison
      ?.ml_comparison
      ?.performance_before ??
    {};


  const metricAfter =
    comparison
      ?.performance
      ?.metrics_after ??
    comparison
      ?.ml_comparison
      ?.performance_after ??
    {};


  const comparableMetricNames =
    Object.keys(
      metricBefore,
    ).filter(
      (key) =>
        Object.prototype.hasOwnProperty.call(
          metricAfter,
          key,
        ),
    );


  const aiRecommendations =
    comparison
      ?.ai_insights
      ?.recommendations ??
    [];


  const aiSummary =
    comparison
      ?.ai_insights
      ?.summary ??
    comparison
      ?.ai_insights
      ?.root_cause
      ?.summary ??
    '';


  const aiConfidence =
    comparison
      ?.ai_insights
      ?.root_cause
      ?.overall_confidence ??
    'low';


  const aiImpactAssessments =
    comparison
      ?.ai_insights
      ?.impact_assessment ??
    [];


  const hasAIInterpretation =
    comparison
      ?.ai_insights
      ?.status ===
      'success' &&
    Boolean(
      aiSummary,
    );


  const overviewChanges =
    useMemo(() => {
      const changes: string[] =
        [];

      if (
        comparison?.git_changed
      ) {
        changes.push(
          'Git commit changed',
        );
      }

      if (
        comparison?.dvc_changed
      ) {
        changes.push(
          'DVC dataset state changed',
        );
      }

      if (
        comparison?.code_changed
      ) {
        changes.push(
          'Training/model code changed',
        );
      }

      if (
        (analysis?.row_delta ??
          0) !== 0
      ) {
        changes.push(
          `Row count changed by ${analysis?.row_delta}`,
        );
      }

      if (
        columnsAdded.length >
        0
      ) {
        changes.push(
          `${columnsAdded.length} column${
            columnsAdded.length ===
            1
              ? ''
              : 's'
          } added`,
        );
      }

      if (
        columnsRemoved.length >
        0
      ) {
        changes.push(
          `${columnsRemoved.length} column${
            columnsRemoved.length ===
            1
              ? ''
              : 's'
          } removed`,
        );
      }

      if (
        analysis
          ?.duplicates_changed
      ) {
        changes.push(
          'Duplicate-row count changed',
        );
      }

      return changes;
    }, [
      comparison,
      analysis,
      columnsAdded,
      columnsRemoved,
    ]);


  function swapVersions() {
    setVersionAId(
      versionBId,
    );

    setVersionBId(
      versionAId,
    );
  }


  function handleProjectChange(
    projectId: number | null,
  ) {
    setSelectedProjectId(
      projectId,
    );
  }


  function handleVersionAChange(
    versionId: number | null,
  ) {
    if (
      versionId !== null &&
      versionId ===
        versionBId
    ) {
      return;
    }

    setVersionAId(
      versionId,
    );
  }


  function handleVersionBChange(
    versionId: number | null,
  ) {
    if (
      versionId !== null &&
      versionId ===
        versionAId
    ) {
      return;
    }

    setVersionBId(
      versionId,
    );
  }


  return (
    <div className="compare-page">
      <header className="compare-header">
        <div className="compare-kicker">
          DATAGIT / VERSION CONTROL / COMPARE
        </div>

        <h1 className="compare-title">
          Compare Versions
        </h1>

        <p className="compare-subtitle">
          Evidence-first comparison
          of two project
          checkpoints.
        </p>
      </header>


      <section className="compare-context">
        <div className="compare-context-row">
          <div className="compare-selector-group">
            <label className="compare-selector-label">
              PROJECT
            </label>

            <select
              value={
                selectedProjectId ??
                ''
              }
              disabled={
                loadingProjects ||
                projects.length === 0
              }
              onChange={(
                event,
              ) => {
                const value =
                  Number(
                    event.target.value,
                  );

                handleProjectChange(
                  Number.isFinite(
                    value,
                  )
                    ? value
                    : null,
                );
              }}
            >
              {projects.length ===
              0 ? (
                <option value="">
                  No projects
                </option>
              ) : (
                projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {
                        project.name
                      }
                    </option>
                  ),
                )
              )}
            </select>
          </div>


          <div className="compare-selector-group">
            <label className="compare-selector-label">
              BASELINE
            </label>

            <select
              value={
                versionAId ?? ''
              }
              disabled={
                loadingVersions ||
                versions.length <
                  2
              }
              onChange={(
                event,
              ) => {
                const value =
                  Number(
                    event.target.value,
                  );

                handleVersionAChange(
                  Number.isFinite(
                    value,
                  )
                    ? value
                    : null,
                );
              }}
            >
              {versions.map(
                (version) => (
                  <option
                    key={
                      version.id
                    }
                    value={
                      version.id
                    }
                  >
                    V
                    {
                      version.version_number
                    }
                  </option>
                ),
              )}
            </select>
          </div>


          <div className="compare-arrow">
            →
          </div>


          <div className="compare-selector-group">
            <label className="compare-selector-label">
              TARGET
            </label>

            <select
              value={
                versionBId ?? ''
              }
              disabled={
                loadingVersions ||
                versions.length <
                  2
              }
              onChange={(
                event,
              ) => {
                const value =
                  Number(
                    event.target.value,
                  );

                handleVersionBChange(
                  Number.isFinite(
                    value,
                  )
                    ? value
                    : null,
                );
              }}
            >
              {versions.map(
                (version) => (
                  <option
                    key={
                      version.id
                    }
                    value={
                      version.id
                    }
                  >
                    V
                    {
                      version.version_number
                    }
                  </option>
                ),
              )}
            </select>
          </div>


          <button
            type="button"
            className="compare-swap-button"
            onClick={
              swapVersions
            }
            disabled={
              versionAId ===
                null ||
              versionBId ===
                null
            }
          >
            SWAP A ↔ B
          </button>
        </div>


        <div className="compare-context-direction">
          <strong>
            {selectedVersionA
              ? `V${selectedVersionA.version_number}`
              : '—'}
          </strong>

          <span>
            ──────────────────→
          </span>

          <strong>
            {selectedVersionB
              ? `V${selectedVersionB.version_number}`
              : '—'}
          </strong>
        </div>


        <div className="compare-context-labels">
          <span>
            BASELINE → TARGET
          </span>
        </div>
      </section>


      {error ? (
        <section className="compare-error">
          <strong>
            COMPARE ERROR
          </strong>

          <span>
            {error}
          </span>
        </section>
      ) : null}


      {loadingComparison ? (
        <section className="compare-loading">
          <span className="compare-loading-caret">
            &gt;
          </span>

          loading comparison
          evidence...
        </section>
      ) : null}


      {comparison ? (
        <>
          <section className="compare-status-line">
            <span
              className={
                comparableMetricNames.length >
                0
                  ? 'compare-status-ok'
                  : 'compare-status-warning'
              }
            >
              {comparableMetricNames.length >
              0
                ? '✓'
                : '!'}
            </span>

            <strong>
              STATUS:{' '}
              {comparableMetricNames.length >
              0
                ? 'COMPARABLE EVIDENCE AVAILABLE'
                : 'INSUFFICIENT METRIC EVIDENCE'}
            </strong>

            <span>
              {overviewChanges.length >
              0
                ? overviewChanges.join(
                    ' · ',
                  )
                : 'No recorded changes detected.'}
            </span>
          </section>


          <Section
            number="01"
            title="COMPARISON OVERVIEW"
            subtitle="The first answer: what changed, and what direction the recorded evidence moved."
          >
            {overviewChanges.length ===
            0 ? (
              <EvidenceState>
                No recorded
                comparison changes
                were returned
                for these versions.
              </EvidenceState>
            ) : (
              <div className="compare-overview-list">
                {overviewChanges.map(
                  (
                    change,
                  ) => (
                    <div
                      key={
                        change
                      }
                      className="compare-overview-item"
                    >
                      <span>
                        ✓
                      </span>

                      <span>
                        {change}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}


            <div className="compare-metric-strip">
              <MetricRow
                label="Rows"
                before={
                  formatNumber(
                    profileBefore?.rows,
                  )
                }
                after={
                  formatNumber(
                    profileAfter?.rows,
                  )
                }
              />

              <MetricRow
                label="Columns"
                before={
                  formatNumber(
                    profileBefore?.column_count,
                  )
                }
                after={
                  formatNumber(
                    profileAfter?.column_count,
                  )
                }
              />

              <MetricRow
                label="Missing"
                before={
                  formatNumber(
                    profileBefore
                      ?.total_missing_values,
                  )
                }
                after={
                  formatNumber(
                    profileAfter
                      ?.total_missing_values,
                  )
                }
              />

              <MetricRow
                label="Duplicates"
                before={
                  formatNumber(
                    profileBefore
                      ?.duplicate_rows,
                  )
                }
                after={
                  formatNumber(
                    profileAfter
                      ?.duplicate_rows,
                  )
                }
              />
            </div>
          </Section>


          <Section
            number="02"
            title="METRIC SUMMARY"
            subtitle="Before → after with absolute movement where meaningful."
          >
            {comparableMetricNames.length ===
            0 ? (
              <EvidenceState>
                No comparable
                scalar metrics
                are available.
              </EvidenceState>
            ) : (
              <div className="compare-table-wrap">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>
                        METRIC
                      </th>

                      <th>
                        BASELINE
                      </th>

                      <th>
                        TARGET
                      </th>

                      <th>
                        DELTA
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {comparableMetricNames.map(
                      (
                        name,
                      ) => {
                        const before =
                          metricBefore[
                            name
                          ];

                        const after =
                          metricAfter[
                            name
                          ];

                        const numericBefore =
                          typeof before ===
                          'number'
                            ? before
                            : null;

                        const numericAfter =
                          typeof after ===
                          'number'
                            ? after
                            : null;

                        const delta =
                          numericBefore !==
                            null &&
                          numericAfter !==
                            null
                            ? numericAfter -
                              numericBefore
                            : null;

                        return (
                          <tr
                            key={
                              name
                            }
                          >
                            <td>
                              {name}
                            </td>

                            <td>
                              <EvidenceValue
                                value={
                                  before
                                }
                              />
                            </td>

                            <td>
                              <EvidenceValue
                                value={
                                  after
                                }
                              />
                            </td>

                            <td>
                              {delta ===
                              null
                                ? '—'
                                : formatNumber(
                                    delta,
                                  )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Section>


          <Section
            number="03"
            title="QUALITY"
            subtitle="Dataset quality evidence is displayed directly from the selected version profiles."
          >
            {!hasQualityEvidence ? (
              <EvidenceState>
                No comparable
                quality evidence
                recorded for these
                versions.
              </EvidenceState>
            ) : (
              <>
                <div className="compare-quality-grid">
                  <MetricRow
                    label="ROWS"
                    before={
                      formatNumber(
                        profileBefore?.rows,
                      )
                    }
                    after={
                      formatNumber(
                        profileAfter?.rows,
                      )
                    }
                  />

                  <MetricRow
                    label="COLUMNS"
                    before={
                      formatNumber(
                        profileBefore
                          ?.column_count,
                      )
                    }
                    after={
                      formatNumber(
                        profileAfter
                          ?.column_count,
                      )
                    }
                  />

                  <MetricRow
                    label="MISSING VALUES"
                    before={
                      formatNumber(
                        profileBefore
                          ?.total_missing_values,
                      )
                    }
                    after={
                      formatNumber(
                        profileAfter
                          ?.total_missing_values,
                      )
                    }
                  />

                  <MetricRow
                    label="DUPLICATE ROWS"
                    before={
                      formatNumber(
                        profileBefore
                          ?.duplicate_rows,
                      )
                    }
                    after={
                      formatNumber(
                        profileAfter
                          ?.duplicate_rows,
                      )
                    }
                  />
                </div>


                {profileBefore
                  ?.target_column ||
                profileAfter
                  ?.target_column ? (
                  <div className="compare-quality-detail">
                    <div className="compare-detail-title">
                      TARGET
                      DISTRIBUTION
                    </div>

                    <div className="compare-distribution-grid">
                      <div>
                        <div className="compare-detail-version">
                          BASELINE
                        </div>

                        {objectEntries(
                          profileBefore
                            ?.target_distribution,
                        ).map(
                          (
                            [
                              key,
                              value,
                            ],
                          ) => (
                            <div
                              key={
                                key
                              }
                              className="compare-distribution-row"
                            >
                              <span>
                                {key}
                              </span>

                              <strong>
                                {formatNumber(
                                  value,
                                )}
                              </strong>
                            </div>
                          ),
                        )}
                      </div>


                      <div>
                        <div className="compare-detail-version">
                          TARGET
                        </div>

                        {objectEntries(
                          profileAfter
                            ?.target_distribution,
                        ).map(
                          (
                            [
                              key,
                              value,
                            ],
                          ) => (
                            <div
                              key={
                                key
                              }
                              className="compare-distribution-row"
                            >
                              <span>
                                {key}
                              </span>

                              <strong>
                                {formatNumber(
                                  value,
                                )}
                              </strong>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </Section>


          <Section
            number="04"
            title="DATASET / SCHEMA"
            subtitle="Added, removed, and modified structured dataset evidence only."
          >
            <div className="compare-change-counts">
              <div>
                <span>
                  +
                </span>

                <strong>
                  {columnsAdded.length}
                </strong>

                <small>
                  ADDED
                </small>
              </div>

              <div>
                <span>
                  −
                </span>

                <strong>
                  {columnsRemoved.length}
                </strong>

                <small>
                  REMOVED
                </small>
              </div>

              <div>
                <span>
                  ~
                </span>

                <strong>
                  {
                    Object.keys(
                      featureChanges,
                    ).length
                  }
                </strong>

                <small>
                  MODIFIED
                </small>
              </div>

              <div>
                <span>
                  ↕
                </span>

                <strong>
                  {rowChangeCount}
                </strong>

                <small>
                  ROW CHANGES
                </small>
              </div>
            </div>


            {columnsAdded.length >
            0 ? (
              <div className="compare-change-block">
                <h3>
                  ADDED COLUMNS
                </h3>

                {columnsAdded.map(
                  (
                    column,
                  ) => (
                    <div
                      key={
                        column
                      }
                      className="compare-change-line compare-change-added"
                    >
                      +{' '}
                      {column}
                    </div>
                  ),
                )}
              </div>
            ) : null}


            {columnsRemoved.length >
            0 ? (
              <div className="compare-change-block">
                <h3>
                  REMOVED COLUMNS
                </h3>

                {columnsRemoved.map(
                  (
                    column,
                  ) => (
                    <div
                      key={
                        column
                      }
                      className="compare-change-line compare-change-removed"
                    >
                      −{' '}
                      {column}
                    </div>
                  ),
                )}
              </div>
            ) : null}


            {datasetRecords.length >
            0 ? (
              <div className="compare-change-block">
                <h3>
                  DATASET CHANGES
                </h3>

                {datasetRecords.map(
                  (
                    dataset,
                  ) => (
                    <div
                      key={
                        dataset.dataset ??
                        'dataset'
                      }
                      className="compare-dataset-record"
                    >
                      <div className="compare-dataset-name">
                        {dataset.dataset ??
                          'dataset'}
                      </div>

                      <div className="compare-dataset-facts">
                        <span>
                          rows{' '}
                          <strong>
                            {formatNumber(
                              dataset.old_rows,
                            )}
                          </strong>
                          {' → '}
                          <strong>
                            {formatNumber(
                              dataset.new_rows,
                            )}
                          </strong>
                        </span>

                        <span>
                          added{' '}
                          <strong>
                            {formatNumber(
                              dataset.rows_added,
                            )}
                          </strong>
                        </span>

                        <span>
                          removed{' '}
                          <strong>
                            {formatNumber(
                              dataset.rows_removed,
                            )}
                          </strong>
                        </span>
                      </div>


                      {dataset.added_rows &&
                      dataset.added_rows.length >
                        0 ? (
                        <div className="compare-row-diff">
                          <div className="compare-detail-title">
                            ADDED ROWS
                          </div>

                          {dataset.added_rows.map(
                            (
                              row,
                              index,
                            ) => (
                              <pre
                                key={`${dataset.dataset}-added-${index}`}
                                className="compare-row-code"
                              >
                                +{' '}
                                {JSON.stringify(
                                  row,
                                )}
                              </pre>
                            ),
                          )}
                        </div>
                      ) : null}


                      {dataset.removed_rows &&
                      dataset.removed_rows.length >
                        0 ? (
                        <div className="compare-row-diff">
                          <div className="compare-detail-title">
                            REMOVED ROWS
                          </div>

                          {dataset.removed_rows.map(
                            (
                              row,
                              index,
                            ) => (
                              <pre
                                key={`${dataset.dataset}-removed-${index}`}
                                className="compare-row-code compare-row-code-removed"
                              >
                                −{' '}
                                {JSON.stringify(
                                  row,
                                )}
                              </pre>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  ),
                )}
              </div>
            ) : null}


            {Object.keys(
              featureChanges,
            ).length > 0 ? (
              <div className="compare-change-block">
                <h3>
                  FEATURE
                  STATISTICS
                </h3>

                <div className="compare-table-wrap">
                  <table className="compare-table">
                    <thead>
                      <tr>
                        <th>
                          FIELD
                        </th>

                        <th>
                          BASELINE
                        </th>

                        <th>
                          TARGET
                        </th>

                        <th>
                          DELTA
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {Object.entries(
                        featureChanges,
                      ).map(
                        ([
                          feature,
                          metrics,
                        ]) =>
                          Object.entries(
                            metrics,
                          ).map(
                            ([
                              metric,
                              values,
                            ]) => (
                              <tr
                                key={`${feature}-${metric}`}
                              >
                                <td>
                                  {
                                    feature
                                  }{' '}
                                  /{' '}
                                  {
                                    metric
                                  }
                                </td>

                                <td>
                                  {formatNumber(
                                    values.before,
                                  )}
                                </td>

                                <td>
                                  {formatNumber(
                                    values.after,
                                  )}
                                </td>

                                <td>
                                  {formatNumber(
                                    values.delta,
                                  )}
                                </td>
                              </tr>
                            ),
                          ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}


            {actualDatasetChanges ===
            0 ? (
              <EvidenceState>
                No structured
                dataset
                differences
                were recorded.
              </EvidenceState>
            ) : null}
          </Section>


          <Section
            number="05"
            title="PREPARATION DIFF"
            subtitle="Recorded preparation evidence between the two checkpoints."
          >
            {comparison.preparation
              ?.available ? (
              <div>
                <div className="compare-change-counts">
                  <div>
                    <span>
                      +
                    </span>
                    <strong>
                      {
                        comparison
                          .preparation
                          .added
                          ?.length ??
                        0
                      }
                    </strong>
                    <small>
                      ADDED
                    </small>
                  </div>

                  <div>
                    <span>
                      −
                    </span>
                    <strong>
                      {
                        comparison
                          .preparation
                          .removed
                          ?.length ??
                        0
                      }
                    </strong>
                    <small>
                      REMOVED
                    </small>
                  </div>

                  <div>
                    <span>
                      ~
                    </span>
                    <strong>
                      {
                        comparison
                          .preparation
                          .modified
                          ?.length ??
                        0
                      }
                    </strong>
                    <small>
                      MODIFIED
                    </small>
                  </div>
                </div>

                {comparison
                  .preparation
                  .added
                  ?.map(
                    (
                      item,
                      index,
                    ) => (
                      <pre
                        key={`prep-added-${index}`}
                        className="compare-row-code"
                      >
                        +{' '}
                        {JSON.stringify(
                          item,
                        )}
                      </pre>
                    ),
                  )}

                {comparison
                  .preparation
                  .removed
                  ?.map(
                    (
                      item,
                      index,
                    ) => (
                      <pre
                        key={`prep-removed-${index}`}
                        className="compare-row-code compare-row-code-removed"
                      >
                        −{' '}
                        {JSON.stringify(
                          item,
                        )}
                      </pre>
                    ),
                  )}

                {comparison
                  .preparation
                  .modified
                  ?.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`prep-modified-${index}`}
                        className="compare-change-block"
                      >
                        <div className="compare-detail-title">
                          {item.operation ??
                            'OPERATION'}
                        </div>

                        <pre className="compare-row-code">
                          BASELINE:{' '}
                          {JSON.stringify(
                            item.baseline ??
                              {},
                          )}
                        </pre>

                        <pre className="compare-row-code">
                          TARGET:{' '}
                          {JSON.stringify(
                            item.target ??
                              {},
                          )}
                        </pre>
                      </div>
                    ),
                  )}
              </div>
            ) : (
              <EvidenceState>
                {comparison.preparation
                  ?.message ??
                  'Preparation history is not recorded for the selected versions.'}
              </EvidenceState>
            )}
          </Section>


          <Section
            number="06"
            title="MODEL / EVALUATION"
            subtitle="Comparable ML evidence only when it exists in both version records."
          >
            {!hasModelEvidence ? (
              <EvidenceState>
                No evaluation evidence
                recorded for this
                comparison.
              </EvidenceState>
            ) : (
              <div className="compare-model-evidence">
                <div className="compare-model-header">
                  <span>
                    FIELD
                  </span>

                  <span>
                    BASELINE
                  </span>

                  <span>
                    TARGET
                  </span>
                </div>


                <div className="compare-model-row">
                  <span>
                    MODEL
                  </span>

                  <span>
                    {comparison
                      .ml_comparison
                      ?.model_name_before ??
                      '—'}
                  </span>

                  <span>
                    {comparison
                      .ml_comparison
                      ?.model_name_after ??
                      '—'}
                  </span>
                </div>


                <div className="compare-model-row">
                  <span>
                    FEATURES
                  </span>

                  <span>
                    {formatNumber(
                      comparison
                        .ml_comparison
                        ?.features_before
                        ?.length,
                    )}
                  </span>

                  <span>
                    {formatNumber(
                      comparison
                        .ml_comparison
                        ?.features_after
                        ?.length,
                    )}
                  </span>
                </div>


                {Object.keys(
                  comparison
                    .ml_comparison
                    ?.performance_before ??
                    {},
                ).map(
                  (
                    metric,
                  ) => (
                    <div
                      key={
                        metric
                      }
                      className="compare-model-row"
                    >
                      <span>
                        {metric}
                      </span>

                      <span>
                        <EvidenceValue
                          value={
                            comparison
                              .ml_comparison
                              ?.performance_before?.[
                              metric
                            ]
                          }
                        />
                      </span>

                      <span>
                        <EvidenceValue
                          value={
                            comparison
                              .ml_comparison
                              ?.performance_after?.[
                              metric
                            ]
                          }
                        />
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </Section>


          <Section
            number="07"
            title="PROVENANCE"
            subtitle="Git, DVC, timestamps, and descriptions supporting the comparison."
          >
            <div className="compare-provenance-grid">
              <div>
                <span>
                  GIT COMMIT
                </span>

                <strong>
                  {shortCommit(
                    comparison
                      .git_commit_before,
                  )}
                </strong>

                <em>
                  →
                </em>

                <strong>
                  {shortCommit(
                    comparison
                      .git_commit_after,
                  )}
                </strong>
              </div>


              <div>
                <span>
                  DVC STATE
                </span>

                <strong>
                  {getDvcLabel(
                    comparison
                      .dvc_state_before,
                  )}
                </strong>

                <em>
                  →
                </em>

                <strong>
                  {getDvcLabel(
                    comparison
                      .dvc_state_after,
                  )}
                </strong>
              </div>


              <div>
                <span>
                  CHANGED FILES
                </span>

                <strong>
                  {formatNumber(
                    comparison
                      .changed_files
                      ?.length,
                  )}
                </strong>
              </div>


              <div>
                <span>
                  CODE FILES CHANGED
                </span>

                <strong>
                  {formatNumber(
                    comparison
                      .code_changed_files
                      ?.length,
                  )}
                </strong>
              </div>


              <div>
                <span>
                  DESCRIPTION
                </span>

                <strong>
                  {selectedVersionA
                    ?.description ??
                    '—'}
                </strong>

                <em>
                  →
                </em>

                <strong>
                  {selectedVersionB
                    ?.description ??
                    '—'}
                </strong>
              </div>
            </div>
          </Section>


          <Section
            number="08"
            title="AI SUMMARY"
            subtitle="Evidence-grounded interpretation placed after the comparison facts."
          >
            {hasAIInterpretation ? (
              <div className="compare-ai-summary">
                <div className="compare-ai-label">
                  EVIDENCE-BASED
                  INTERPRETATION
                </div>

                <p className="compare-ai-text">
                  {aiSummary}
                </p>

                <div className="compare-ai-meta">
                  CONFIDENCE:{' '}
                  {aiConfidence}
                </div>


                {aiImpactAssessments.length >
                0 ? (
                  <div className="compare-ai-list">
                    <div className="compare-detail-title">
                      IMPACT
                      ASSESSMENT
                    </div>

                    {aiImpactAssessments.map(
                      (
                        item,
                        index,
                      ) => (
                        <div
                          key={`${item.area}-${index}`}
                          className="compare-ai-list-item"
                        >
                          <strong>
                            {item.area}
                          </strong>
                          {' — '}
                          {item.status}
                          {item.explanation
                            ? `: ${item.explanation}`
                            : ''}
                        </div>
                      ),
                    )}
                  </div>
                ) : null}


                {comparison
                  .ai_insights
                  ?.root_cause
                  ?.limitations
                  ?.length ? (
                  <div className="compare-ai-list">
                    <div className="compare-detail-title">
                      LIMITATIONS
                    </div>

                    {comparison
                      .ai_insights
                      .root_cause
                      .limitations
                      .map(
                        (
                          item,
                        ) => (
                          <div
                            key={
                              item
                            }
                            className="compare-ai-list-item"
                          >
                            ×{' '}
                            {item}
                          </div>
                        ),
                      )}
                  </div>
                ) : null}
              </div>
            ) : (
              <EvidenceState>
                {comparison
                  .ai_insights
                  ?.status ===
                'disabled'
                  ? 'AI comparison generation was disabled.'
                  : comparison
                      .ai_insights
                      ?.reason ??
                    'No evidence-grounded AI interpretation was returned.'}
              </EvidenceState>
            )}
          </Section>


          <Section
            number="09"
            title="RECOMMENDATIONS"
            subtitle="Short, evidence-backed follow-up actions."
          >
            {aiRecommendations.length ===
            0 ? (
              <EvidenceState>
                No recommendations
                were returned by
                the backend.
              </EvidenceState>
            ) : (
              <div className="compare-recommendations">
                {aiRecommendations.map(
                  (
                    item: CompareRecommendation,
                    index,
                  ) => (
                    <div
                      key={`${item.recommendation}-${index}`}
                      className="compare-recommendation"
                    >
                      <div className="compare-recommendation-index">
                        {String(
                          index +
                            1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </div>

                      <div className="compare-recommendation-content">
                        <div className="compare-recommendation-top">
                          <strong>
                            {
                              item.recommendation
                            }
                          </strong>

                          <span
                            className={`compare-priority compare-priority-${String(
                              item.priority,
                            ).toLowerCase()}`}
                          >
                            {String(
                              item.priority,
                            ).toUpperCase()}
                          </span>
                        </div>

                        <p>
                          {
                            item.reason
                          }
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </Section>


          <AIExplanationPanel
            projectId={
              selectedProjectId
            }
            versionAId={
              versionAId
            }
            versionBId={
              versionBId
            }
            versionANumber={
              selectedVersionA
                ?.version_number ??
              null
            }
            versionBNumber={
              selectedVersionB
                ?.version_number ??
              null
            }
          />


          <Section
            number="11"
            title="RAW EVIDENCE"
            subtitle="Developer-level payload details are intentionally collapsed."
          >
            <details className="compare-raw-details">
              <summary>
                SHOW VERSION PAYLOADS
              </summary>

              <div className="compare-raw-grid">
                <pre>
                  {JSON.stringify(
                    comparison,
                    null,
                    2,
                  )}
                </pre>
              </div>
            </details>
          </Section>
        </>
      ) : null}


      <div className="compare-terminal">
        <span>
          &gt; datagit@local:~/project$
        </span>

        <span>
          {loadingComparison
            ? 'loading comparison...'
            : comparison
              ? `compare V${
                  selectedVersionA
                    ?.version_number ??
                  '?'
                } → V${
                  selectedVersionB
                    ?.version_number ??
                  '?'
                } ready.`
              : 'compare ready.'}
        </span>

        <span className="compare-terminal-ready">
          READY
        </span>
      </div>
    </div>
  );
}