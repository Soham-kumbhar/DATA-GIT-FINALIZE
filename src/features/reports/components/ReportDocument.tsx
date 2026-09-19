import { useState, type ReactNode } from 'react';
import type { ReportProject, ReportVersionDetail } from '../types/report';
import AIInterpretationPanel from './AIInterpretationPanel';
import './ReportDocument.css';

interface Props {
  project: ReportProject;
  version: ReportVersionDetail;
  onBack: () => void;
}

type Dict = Record<string, unknown>;

function dict(raw: unknown): Dict {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Dict)
    : {};
}

function list(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw : [];
}

function value(raw: unknown, fallback = 'Not recorded'): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }

  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw);
  }

  return fallback;
}

function pick(source: unknown, paths: string[]): unknown {
  for (const path of paths) {
    let current: unknown = source;

    for (const part of path.split('.')) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }

      current = (current as Dict)[part];
    }

    if (
      current !== undefined &&
      current !== null &&
      current !== ''
    ) {
      return current;
    }
  }

  return undefined;
}

function formatDate(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) {
    return 'Not recorded';
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function shortHash(raw: unknown): string {
  const hash = value(raw, 'Not recorded');

  return hash.length > 12
    ? `${hash.slice(0, 10)}…`
    : hash;
}

function Status({
  children,
  tone = 'neutral',
}: {
  children: string;
  tone?: 'neutral' | 'ok' | 'missing' | 'ai';
}) {
  return (
    <span className={`report-status report-status-${tone}`}>
      {children}
    </span>
  );
}

function CopyButton({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!raw || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="report-copy"
      onClick={() => void copy()}
      disabled={!raw}
    >
      {copied ? 'COPIED' : 'COPY'}
    </button>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      className="report-section"
      id={`report-section-${number}`}
    >
      <div className="report-section-head">
        <span className="report-section-number">
          {number}
        </span>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Metric({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  return (
    <div className="report-metric">
      <span>{label}</span>
      <strong>{content}</strong>
    </div>
  );
}

function Missing({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="report-missing">
      <Status tone="missing">NOT RECORDED</Status>

      <strong>{title}</strong>

      <p>{detail}</p>
    </div>
  );
}

function checkStatus(
  checks: Dict,
  key: string,
): string {
  return String(checks[key] ?? 'not_recorded').toLowerCase();
}

function isRecorded(
  checks: Dict,
  key: string,
): boolean {
  const status = checkStatus(checks, key);

  return (
    status === 'recorded' ||
    status === 'available' ||
    status === 'assessable'
  );
}

function changedFilePath(raw: unknown): string {
  const file = dict(raw);

  return value(
    file.path ??
      file.file_path ??
      file.name ??
      raw,
    'Not recorded',
  );
}

function changedFileStatus(raw: unknown): string {
  const file = dict(raw);

  return value(file.status, '—');
}

function ReportDocument({
  project,
  version,
  onBack,
}: Props) {
  /*
   * The backend version report is the source of truth.
   *
   * IMPORTANT:
   * Do not reconstruct evidence completeness from the
   * existence of frontend objects. The backend already
   * determines which evidence sections are recorded.
   */
  const rawVersion = dict(version);

  const dataset = dict(rawVersion.dataset);
  const git = dict(rawVersion.git);
  const dvc = dict(rawVersion.dvc);
  const dvcState = dict(rawVersion.dvc_state);

  const resultEvidence = dict(
    rawVersion.result_evidence,
  );

  const evidenceCompleteness = dict(
    rawVersion.evidence_completeness,
  );

  const checks = dict(
    evidenceCompleteness.checks,
  );

  const model = dict(resultEvidence.model);
  const metrics = dict(resultEvidence.metrics);
  const evaluation = dict(resultEvidence.evaluation);

  const preparation = list(
    pick(rawVersion, [
      'preparation.operations',
      'preparation_evidence.operations',
      'preparation_operations',
    ]),
  );

  const changedFiles = list(
    git.changed_files ??
      pick(rawVersion, [
        'changed_files',
      ]),
  );

  const columns = list(dataset.columns);

  const datasetFiles = list(dataset.files);
  const firstDatasetFile = dict(datasetFiles[0]);
  const datasetFileDvc = dict(
    firstDatasetFile.dvc,
  );

  const trackedFiles = list(dvc.tracked_files);
  const firstTrackedFile = dict(
    trackedFiles[0],
  );

  /*
   * Backend-authoritative evidence state.
   */
  const recordedCount =
    typeof evidenceCompleteness.recorded_sections ===
      'number'
      ? evidenceCompleteness.recorded_sections
      : 0;

  const totalCount =
    typeof evidenceCompleteness.total_sections ===
      'number'
      ? evidenceCompleteness.total_sections
      : 9;

  const completenessStatus = value(
    evidenceCompleteness.status,
    recordedCount === totalCount
      ? 'complete'
      : recordedCount > 0
        ? 'partial'
        : 'not_available',
  ).toLowerCase();

  const datasetRecorded = isRecorded(
    checks,
    'dataset',
  );

  const dataQualityRecorded = isRecorded(
    checks,
    'data_quality',
  );

  const preparationRecorded = isRecorded(
    checks,
    'preparation',
  );

  const modelRecorded = isRecorded(
    checks,
    'model',
  );

  const metricsRecorded = isRecorded(
    checks,
    'metrics',
  );

  const evaluationRecorded = isRecorded(
    checks,
    'evaluation',
  );

  const gitRecorded = isRecorded(
    checks,
    'git',
  );

  const dvcRecorded = isRecorded(
    checks,
    'dvc',
  );

  const datasetPath = value(
    pick(dataset, [
      'path',
      'file_path',
      'dataset_path',
    ]),
    'Dataset path not recorded',
  );

  const gitCommit = value(
    rawVersion.git_commit ??
      git.commit ??
      git.sha,
    'Not recorded',
  );

  /*
   * DVC hash is nested inside tracked_files in the
   * authoritative backend response.
   */
  const dvcHash = value(
    firstTrackedFile.md5 ??
      datasetFileDvc.md5 ??
      dvc.md5 ??
      dvc.hash ??
      dvc.checksum ??
      dvcState.md5,
    'Not recorded',
  );

  const dvcFile = value(
    firstTrackedFile.dvc_file ??
      datasetFileDvc.dvc_file ??
      dvc.dvc_file ??
      dvcState.dvc_file,
    'Not recorded',
  );

  const dvcDataPath = value(
    firstTrackedFile.data_path ??
      datasetFileDvc.data_path ??
      dvc.data_path,
    datasetPath,
  );

  const dvcStatus = value(
    dvc.status ??
      dvcState.status,
    'Not recorded',
  );

  const gitAuthor = value(
    git.author ??
      git.author_name,
    'Not recorded',
  );

  const gitMessage = value(
    git.message ??
      git.commit_message ??
      rawVersion.description,
    'Not recorded',
  );

  const gitTime = formatDate(
    git.committed_at ??
      git.commit_time ??
      git.date ??
      rawVersion.created_at,
  );

  const datasetSize = value(
    pick(dataset, [
      'size_bytes',
      'size',
    ]),
    'Not recorded',
  );

  const datasetRows = value(
    pick(dataset, [
      'row_count',
      'rows',
    ]),
    'Not recorded',
  );

  const datasetColumns = value(
    pick(dataset, [
      'column_count',
      'columns_count',
    ]),
    'Not recorded',
  );

  const datasetFormat = value(
    pick(dataset, [
      'format',
      'file_format',
    ]),
    'Not recorded',
  );

  const missingValues = value(
    pick(dataset, [
      'missing_values',
      'missing_count',
    ]),
    'Not recorded',
  );

  const duplicateRows = value(
    pick(dataset, [
      'duplicate_rows',
      'duplicates',
    ]),
    'Not recorded',
  );

  const reportSections = [
    ['01', 'Version snapshot'],
    ['02', 'Dataset evidence'],
    ['03', 'DVC provenance'],
    ['04', 'Git provenance'],
    ['05', 'Preparation'],
    ['06', 'Model evidence'],
    ['07', 'Metrics'],
    ['08', 'Evaluation evidence'],
    ['09', 'Lineage'],
    ['10', 'Evidence map'],
    ['11', 'AI interpretation'],
  ] as const;

  /*
   * Evidence Map deliberately follows the backend's
   * nine-section completeness contract.
   */
  const evidenceMap = [
    [
      'Version identity',
      checkStatus(checks, 'version_identity'),
    ],
    [
      'Dataset',
      checkStatus(checks, 'dataset'),
    ],
    [
      'Data quality',
      checkStatus(checks, 'data_quality'),
    ],
    [
      'Preparation',
      checkStatus(checks, 'preparation'),
    ],
    [
      'Model evidence',
      checkStatus(checks, 'model'),
    ],
    [
      'Metrics',
      checkStatus(checks, 'metrics'),
    ],
    [
      'Evaluation',
      checkStatus(checks, 'evaluation'),
    ],
    [
      'Git provenance',
      checkStatus(checks, 'git'),
    ],
    [
      'DVC provenance',
      checkStatus(checks, 'dvc'),
    ],
  ] as const;

  const evidenceStatusLabel =
    completenessStatus === 'complete'
      ? 'COMPLETE'
      : completenessStatus === 'partial'
        ? 'PARTIAL'
        : 'NOT AVAILABLE';

  const resultEvidenceStatus = value(
    resultEvidence.status,
    'not_recorded',
  ).toUpperCase();

  return (
    <article className="report-document">
      <header className="report-hero">
        <div className="report-topbar">
          <button
            type="button"
            className="report-back"
            onClick={onBack}
          >
            ← VERSION HISTORY
          </button>

          <span>DETAILED VERSION REPORT</span>
        </div>

        <div className="report-hero-grid">
          <div>
            <div className="report-breadcrumb">
              DATAGIT / EVIDENCE / VERSION{' '}
              {String(
                rawVersion.version_number,
              ).padStart(2, '0')}
            </div>

            <h1>{project.name}</h1>

            <div className="report-title-line">
              <strong>
                VERSION{' '}
                {String(
                  rawVersion.version_number,
                ).padStart(2, '0')}
              </strong>

              <span>
                {value(
                  rawVersion.description,
                  'No description recorded.',
                )}
              </span>
            </div>
          </div>

          <div className="report-hero-meta">
            <Status tone="ok">
              FINALIZED
            </Status>

            <span>
              {formatDate(
                rawVersion.created_at,
              )}
            </span>

            <span>
              EVIDENCE {recordedCount}/{totalCount}{' '}
              RECORDED
            </span>
          </div>
        </div>

        <div className="report-summary-grid">
          <Metric
            label="GIT"
            content={shortHash(gitCommit)}
          />

          <Metric
            label="DVC"
            content={
              dvcRecorded
                ? shortHash(dvcHash)
                : 'Not recorded'
            }
          />

          <Metric
            label="DATASET"
            content={
              datasetRecorded
                ? datasetPath
                : 'Not recorded'
            }
          />

          <Metric
            label="STATUS"
            content={evidenceStatusLabel}
          />
        </div>
      </header>

      <div className="report-layout">
        <aside className="report-sidebar">
          <div className="report-index">
            <span className="report-sidebar-label">
              REPORT INDEX
            </span>

            {reportSections.map(
              ([number, title]) => (
                <a
                  key={number}
                  href={`#report-section-${number}`}
                >
                  <span>{number}</span>
                  {title}
                </a>
              ),
            )}
          </div>

          <div className="report-sidebar-card">
            <span className="report-sidebar-label">
              EVIDENCE STATUS
            </span>

            <Status
              tone={
                completenessStatus ===
                'complete'
                  ? 'ok'
                  : 'missing'
              }
            >
              {evidenceStatusLabel}
            </Status>

            <strong className="report-sidebar-count">
              {recordedCount}/{totalCount}
            </strong>

            <p>
              Recorded facts stay separate
              from missing evidence. Missing
              evidence does not imply that an
              action did not happen.
            </p>
          </div>
        </aside>

        <main className="report-main">
          <Section
            number="01"
            title="Version Snapshot"
            description="Recorded state of this exact version."
          >
            <div className="report-card-grid report-card-grid-6">
              <Metric
                label="VERSION"
                content={`V${rawVersion.version_number}`}
              />

              <Metric
                label="STATUS"
                content="FINALIZED"
              />

              <Metric
                label="DATASETS"
                content={
                  datasetRecorded
                    ? '1'
                    : '0'
                }
              />

              <Metric
                label="MODEL EVIDENCE"
                content={
                  modelRecorded
                    ? 'Recorded'
                    : 'Not recorded'
                }
              />

              <Metric
                label="METRICS"
                content={
                  metricsRecorded
                    ? 'Recorded'
                    : 'Not recorded'
                }
              />

              <Metric
                label="EVALUATION"
                content={
                  evaluationRecorded
                    ? 'Recorded'
                    : 'Not recorded'
                }
              />
            </div>

            <div className="report-card-grid report-card-grid-3 report-space-top">
              <Metric
                label="PREPARATION OPS"
                content={String(
                  preparation.length,
                )}
              />

              <Metric
                label="CHANGED FILES"
                content={String(
                  changedFiles.length,
                )}
              />

              <Metric
                label="EVIDENCE"
                content={`${recordedCount}/${totalCount}`}
              />
            </div>
          </Section>

          <Section
            number="02"
            title="Dataset Evidence"
            description="Profiled facts about the dataset associated with this version."
          >
            {datasetRecorded ? (
              <>
                <div className="report-card report-dataset-title">
                  <span>DATASET</span>

                  <strong>
                    {datasetPath}
                  </strong>
                </div>

                <div className="report-card-grid report-card-grid-6">
                  <Metric
                    label="ROWS"
                    content={datasetRows}
                  />

                  <Metric
                    label="COLUMNS"
                    content={datasetColumns}
                  />

                  <Metric
                    label="FORMAT"
                    content={datasetFormat}
                  />

                  <Metric
                    label="SIZE"
                    content={`${datasetSize} bytes`}
                  />

                  <Metric
                    label="MISSING VALUES"
                    content={missingValues}
                  />

                  <Metric
                    label="DUPLICATE ROWS"
                    content={duplicateRows}
                  />
                </div>

                <div className="report-card report-column-card">
                  <span>DATASET COLUMNS</span>

                  <div className="report-column-list">
                    {columns.length ? (
                      columns.map(
                        (column, index) => (
                          <div
                            key={`${String(
                              column,
                            )}-${index}`}
                          >
                            <small>
                              {String(
                                index + 1,
                              ).padStart(2, '0')}
                            </small>

                            <strong>
                              {value(column)}
                            </strong>
                          </div>
                        ),
                      )
                    ) : (
                      <span>
                        Not recorded
                      </span>
                    )}
                  </div>
                </div>

                <div className="report-status-row">
                  <Status tone="ok">
                    DATASET RECORDED
                  </Status>

                  <Status
                    tone={
                      dataQualityRecorded
                        ? 'ok'
                        : 'missing'
                    }
                  >
                    {dataQualityRecorded
                      ? 'DATA QUALITY RECORDED'
                      : 'DATA QUALITY NOT RECORDED'}
                  </Status>
                </div>
              </>
            ) : (
              <Missing
                title="Dataset profile not recorded"
                detail="No deterministic dataset profile is attached to this version."
              />
            )}
          </Section>

          <Section
            number="03"
            title="DVC Provenance"
            description="The dataset identity anchoring this version."
          >
            <div className="report-card-grid report-card-grid-3">
              <Metric
                label="DVC HASH"
                content={
                  dvcRecorded
                    ? dvcHash
                    : 'Not recorded'
                }
              />

              <Metric
                label="DVC FILE"
                content={dvcFile}
              />

              <Metric
                label="DATA PATH"
                content={dvcDataPath}
              />
            </div>

            <div className="report-card report-space-top">
              <div className="report-card-grid report-card-grid-2">
                <Metric
                  label="REPOSITORY"
                  content={
                    dvc.is_repository === true
                      ? 'DVC repository'
                      : 'Not recorded'
                  }
                />

                <Metric
                  label="STATUS"
                  content={dvcStatus}
                />
              </div>
            </div>

            <div className="report-status-row">
              <Status
                tone={
                  dvcRecorded
                    ? 'ok'
                    : 'missing'
                }
              >
                {dvcRecorded
                  ? 'RECORDED'
                  : 'NOT RECORDED'}
              </Status>

              {dvcRecorded ? (
                <CopyButton raw={dvcHash} />
              ) : null}
            </div>
          </Section>

          <Section
            number="04"
            title="Git Provenance"
            description="The code state linked to this exact version."
          >
            <div className="report-commit-line">
              <div>
                <span>COMMIT</span>

                <strong>
                  {gitCommit}
                </strong>
              </div>

              <CopyButton raw={gitCommit} />
            </div>

            <div className="report-card-grid report-card-grid-3">
              <Metric
                label="AUTHOR"
                content={gitAuthor}
              />

              <Metric
                label="COMMITTED"
                content={gitTime}
              />

              <Metric
                label="MESSAGE"
                content={gitMessage}
              />
            </div>

            <div className="report-card report-file-list">
              <span>CHANGED FILES</span>

              {changedFiles.length ? (
                changedFiles.map(
                  (file, index) => (
                    <div
                      key={`${changedFilePath(
                        file,
                      )}-${index}`}
                    >
                      <small>
                        {String(
                          index + 1,
                        ).padStart(2, '0')}
                      </small>

                      <strong>
                        {changedFilePath(
                          file,
                        )}
                      </strong>

                      <em>
                        {changedFileStatus(
                          file,
                        )}
                      </em>
                    </div>
                  ),
                )
              ) : (
                <p>Not recorded</p>
              )}
            </div>
          </Section>

          <Section
            number="05"
            title="Preparation"
            description="Only operations explicitly recorded for this version are shown."
          >
            {preparation.length ? (
              <div className="report-card report-list">
                {preparation.map(
                  (item, index) => (
                    <div key={index}>
                      <small>
                        {String(
                          index + 1,
                        ).padStart(2, '0')}
                      </small>

                      <pre>
                        {JSON.stringify(
                          item,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <Missing
                title="No preparation operations"
                detail="No preparation operations are attached to this version."
              />
            )}
          </Section>

          <Section
            number="06"
            title="Model Evidence"
            description="Model information recorded at version finalization."
          >
            {modelRecorded ? (
              <div className="report-card-grid report-card-grid-3">
                {Object.entries(model).map(
                  ([key, item]) => (
                    <Metric
                      key={key}
                      label={key
                        .replaceAll('_', ' ')
                        .toUpperCase()}
                      content={value(item)}
                    />
                  ),
                )}
              </div>
            ) : (
              <Missing
                title="Model evidence not recorded"
                detail="This does not imply that training failed or did not happen."
              />
            )}
          </Section>

          <Section
            number="07"
            title="Metrics"
            description="Recorded result metrics such as accuracy, precision, recall, F1-score, or loss."
          >
            {metricsRecorded ? (
              <div className="report-card-grid report-card-grid-4">
                {Object.entries(metrics).map(
                  ([key, item]) => (
                    <Metric
                      key={key}
                      label={key
                        .replaceAll('_', ' ')
                        .toUpperCase()}
                      content={value(item)}
                    />
                  ),
                )}
              </div>
            ) : (
              <Missing
                title="Metrics not recorded"
                detail="Performance change cannot be concluded from DATAGIT evidence."
              />
            )}
          </Section>

          <Section
            number="08"
            title="Evaluation Evidence"
            description="Recorded evaluation outputs and conclusions for this version."
          >
            <div className="report-card report-space-top">
              <div className="report-card-grid report-card-grid-3">
                <Metric
                  label="RESULT EVIDENCE"
                  content={resultEvidenceStatus}
                />
              </div>
            </div>

            {evaluationRecorded ? (
              <div className="report-card report-json">
                {Object.entries(evaluation).map(
                  ([key, item]) => (
                    <div key={key}>
                      <span>
                        {key
                          .replaceAll('_', ' ')
                          .toUpperCase()}
                      </span>

                      <strong>
                        {value(item)}
                      </strong>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <Missing
                title="Evaluation not recorded"
                detail="No evaluation evidence is attached to this version."
              />
            )}
          </Section>

          <Section
            number="09"
            title="Lineage"
            description="Recorded links between project, data, code, and this version."
          >
            <div className="report-lineage">
              {[
                ['PROJECT', project.name],
                ['DATASET', datasetPath],
                [
                  'DVC',
                  dvcRecorded
                    ? shortHash(dvcHash)
                    : 'Not recorded',
                ],
                [
                  'GIT',
                  gitRecorded
                    ? shortHash(gitCommit)
                    : 'Not recorded',
                ],
                [
                  `VERSION ${rawVersion.version_number}`,
                  value(
                    rawVersion.description,
                    'No description recorded',
                  ),
                ],
              ].map(
                ([label, item], index, rows) => (
                  <div
                    key={label}
                    className="report-lineage-step"
                  >
                    <div>
                      <small>
                        {String(
                          index + 1,
                        ).padStart(2, '0')}
                      </small>

                      <span>{label}</span>

                      <strong>{item}</strong>
                    </div>

                    {index <
                    rows.length - 1 ? (
                      <b>↓</b>
                    ) : null}
                  </div>
                ),
              )}
            </div>
          </Section>

          <Section
            number="10"
            title="Evidence Map"
            description="The authoritative evidence completeness state returned by DATAGIT."
          >
            <div className="report-card-grid report-card-grid-3">
              <Metric
                label="STATUS"
                content={evidenceStatusLabel}
              />

              <Metric
                label="RECORDED SECTIONS"
                content={String(
                  recordedCount,
                )}
              />

              <Metric
                label="TOTAL SECTIONS"
                content={String(
                  totalCount,
                )}
              />
            </div>

            <div className="report-card report-space-top">
              <div className="report-evidence-map">
                {evidenceMap.map(
                  ([label, status]) => {
                    const recorded =
                      status === 'recorded' ||
                      status === 'available' ||
                      status === 'assessable';

                    return (
                      <div key={label}>
                        <span>{label}</span>

                        <Status
                          tone={
                            recorded
                              ? 'ok'
                              : 'missing'
                          }
                        >
                          {recorded
                            ? 'RECORDED'
                            : 'NOT RECORDED'}
                        </Status>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <div className="report-card report-space-top">
              <p>
                Missing evidence is reported as
                not recorded. It is not treated as
                proof that the corresponding action
                did not happen.
              </p>
            </div>
          </Section>

          <Section
            number="11"
            title="AI Interpretation"
            description="Evidence-grounded interpretation of the selected version. DATAGIT AI does not track or invent the training process."
          >
            <AIInterpretationPanel
              projectId={project.id}
              version={version}
            />
          </Section>
        </main>
      </div>
    </article>
  );
}

export { ReportDocument };
export default ReportDocument;