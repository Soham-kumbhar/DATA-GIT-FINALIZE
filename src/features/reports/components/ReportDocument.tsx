import type {
  ReportProject,
  ReportVersionDetail,
} from '../types/report';

interface ReportDocumentProps {
  project: ReportProject | null;
  version: ReportVersionDetail;
}

type AnyRecord = Record<string, unknown>;

interface AIChange {
  change?: string;
  explanation?: string;
}

interface AIRecommendation {
  recommendation?: string;
  reason?: string;
  priority?: string;
}

interface AIInsights {
  status?: string;
  summary?: string;
  quality_assessment?: string;
  changes_explained?: AIChange[];
  recommendations?: AIRecommendation[];
  reason?: string;
}

function asRecord(value: unknown): AnyRecord | null {
  if (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value as AnyRecord;
  }

  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function firstValue(
  source: AnyRecord | null | undefined,
  keys: string[],
): unknown {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return undefined;
}

function textValue(value: unknown): string {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '—';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  return '—';
}

function versionLabel(value: unknown): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 'V—';
  }

  return `V${number}`;
}

function renderArray(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) {
    return '—';
  }

  return value
    .map((item) => textValue(item))
    .join(', ');
}

function renderObject(value: unknown): string {
  const record = asRecord(value);

  if (!record) {
    return textValue(value);
  }

  const entries = Object.entries(record);

  if (entries.length === 0) {
    return '—';
  }

  return entries
    .map(([key, item]) => `${key}: ${textValue(item)}`)
    .join(' | ');
}

function getTrackedFiles(
  dvc: AnyRecord | null,
): AnyRecord[] {
  return asArray(dvc?.tracked_files).filter(
    (item): item is AnyRecord =>
      Boolean(
        item &&
          typeof item === 'object' &&
          !Array.isArray(item),
      ),
  );
}

function normalizeAIInsights(
  value: unknown,
): AIInsights | null {
  const direct = asRecord(value);

  if (!direct) {
    return null;
  }

  const status =
    typeof direct.status === 'string'
      ? direct.status
      : undefined;

  const summary =
    typeof direct.summary === 'string'
      ? direct.summary
      : undefined;

  const qualityAssessment =
    typeof direct.quality_assessment === 'string'
      ? direct.quality_assessment
      : undefined;

  const rawChanges = asArray(
    direct.changes_explained,
  );

  const changes: AIChange[] = rawChanges
    .map((item) => asRecord(item))
    .filter(Boolean)
    .map((item) => ({
      change:
        typeof item?.change === 'string'
          ? item.change
          : undefined,
      explanation:
        typeof item?.explanation === 'string'
          ? item.explanation
          : undefined,
    }));

  const rawRecommendations = asArray(
    direct.recommendations,
  );

  const recommendations: AIRecommendation[] =
    rawRecommendations
      .map((item) => asRecord(item))
      .filter(Boolean)
      .map((item) => ({
        recommendation:
          typeof item?.recommendation === 'string'
            ? item.recommendation
            : undefined,
        reason:
          typeof item?.reason === 'string'
            ? item.reason
            : undefined,
        priority:
          typeof item?.priority === 'string'
            ? item.priority
            : undefined,
      }));

  return {
    status,
    summary,
    quality_assessment: qualityAssessment,
    changes_explained: changes,
    recommendations,
    reason:
      typeof direct.reason === 'string'
        ? direct.reason
        : undefined,
  };
}

function getAIInsights(
  record: AnyRecord,
): AIInsights | null {
  const directCandidates = [
    record.ai_insights,
    record.aiInsights,
    asRecord(record.report)?.ai_insights,
    asRecord(record.ai_report)?.ai_insights,
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizeAIInsights(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function priorityClass(
  priority: string | undefined,
): string {
  const normalized =
    priority?.trim().toLowerCase();

  if (normalized === 'high') {
    return 'reports-ai-priority reports-ai-priority-high';
  }

  if (normalized === 'medium') {
    return 'reports-ai-priority reports-ai-priority-medium';
  }

  if (normalized === 'low') {
    return 'reports-ai-priority reports-ai-priority-low';
  }

  return 'reports-ai-priority';
}

function getAIChangeItems(
  insights: AIInsights | null,
): AIChange[] {
  return insights?.changes_explained ?? [];
}

function getAIRecommendationItems(
  insights: AIInsights | null,
): AIRecommendation[] {
  return insights?.recommendations ?? [];
}

export function ReportDocument({
  project,
  version,
}: ReportDocumentProps) {
  const record = version as AnyRecord;

  const dvc = asRecord(record.dvc_state);
  const dataset = asRecord(record.dataset);
  const dataQuality = asRecord(record.data_quality);
  const preparation = asRecord(record.preparation);
  const training = asRecord(record.training);
  const evaluation = asRecord(record.evaluation);
  const git = asRecord(record.git);

  const rows =
    firstValue(record, [
      'rows',
      'row_count',
      'rows_count',
    ]) ??
    firstValue(dataset, [
      'rows',
      'row_count',
    ]);

  const columns =
    firstValue(record, [
      'columns',
      'column_count',
      'columns_count',
    ]) ??
    firstValue(dataset, [
      'columns',
      'column_count',
    ]);

  const missing =
    firstValue(record, [
      'missing',
      'missing_values',
      'missing_count',
    ]) ??
    firstValue(dataQuality, [
      'missing',
      'missing_values',
      'missing_count',
    ]);

  const duplicates =
    firstValue(record, [
      'duplicates',
      'duplicate_count',
    ]) ??
    firstValue(dataQuality, [
      'duplicates',
      'duplicate_count',
    ]);

  const datasetName =
    firstValue(dataset, [
      'name',
      'filename',
      'file_name',
    ]) ??
    firstValue(record, [
      'dataset_name',
      'filename',
    ]);

  const datasetFormat =
    firstValue(dataset, [
      'format',
      'file_format',
    ]) ??
    firstValue(record, [
      'dataset_format',
      'format',
    ]);

  const datasetPath =
    firstValue(dataset, [
      'path',
      'file_path',
    ]) ??
    firstValue(record, [
      'dataset_path',
      'path',
    ]);

  const validity =
    firstValue(record, [
      'validity',
      'validation_status',
    ]) ??
    firstValue(dataQuality, [
      'validity',
      'status',
    ]);

  const qualityStatus =
    firstValue(dataQuality, [
      'status',
      'quality',
      'quality_score',
    ]) ??
    'not available';

  const preparationHistory =
    firstValue(record, [
      'preparation_history',
      'operations',
    ]) ??
    firstValue(preparation, [
      'history',
      'operations',
      'steps',
    ]);

  const gitCommit =
    firstValue(record, [
      'git_commit',
      'commit',
    ]) ??
    firstValue(git, [
      'commit',
      'commit_hash',
    ]) ??
    version.git_commit;

  const trackedFiles = getTrackedFiles(dvc);

  const aiInsights = getAIInsights(record);
  const aiChanges = getAIChangeItems(aiInsights);
  const aiRecommendations =
    getAIRecommendationItems(aiInsights);

  const aiAvailable =
    aiInsights?.status === 'success';

  return (
    <article className="reports-document">
      <section className="reports-report-header">
        <div className="reports-report-title">
          <div className="reports-eyebrow">
            03 DETAILED VERSION REPORT
          </div>

          <h1>REPORT</h1>
        </div>

        <div className="reports-report-header-grid">
          <div className="reports-meta-cell">
            <div className="reports-meta-label">
              PROJECT
            </div>

            <div className="reports-meta-value">
              {project?.name ?? '—'}
            </div>
          </div>

          <div className="reports-meta-cell">
            <div className="reports-meta-label">
              VERSION
            </div>

            <div className="reports-meta-value">
              {versionLabel(version.version_number)}
            </div>
          </div>

          <div className="reports-meta-cell">
            <div className="reports-meta-label">
              GIT
            </div>

            <div className="reports-meta-value">
              {textValue(gitCommit)}
            </div>
          </div>

          <div className="reports-meta-cell">
            <div className="reports-meta-label">
              CREATED
            </div>

            <div className="reports-meta-value">
              {textValue(version.created_at)}
            </div>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            01
          </span>

          <h2 className="reports-section-title">
            EXECUTIVE SUMMARY
          </h2>
        </div>

        <div className="reports-summary">
          {textValue(
            firstValue(record, [
              'summary',
              'description',
              'message',
            ]),
          )}
        </div>

        <div
          className="reports-metric-strip"
          style={{ marginTop: 16 }}
        >
          <div className="reports-metric">
            <div className="reports-metric-label">
              ROWS
            </div>

            <div className="reports-metric-value">
              {textValue(rows)}
            </div>
          </div>

          <div className="reports-metric">
            <div className="reports-metric-label">
              COLUMNS
            </div>

            <div className="reports-metric-value">
              {textValue(columns)}
            </div>
          </div>

          <div className="reports-metric">
            <div className="reports-metric-label">
              MISSING
            </div>

            <div className="reports-metric-value">
              {textValue(missing)}
            </div>
          </div>

          <div className="reports-metric">
            <div className="reports-metric-label">
              DUPLICATES
            </div>

            <div className="reports-metric-value">
              {textValue(duplicates)}
            </div>
          </div>

          <div className="reports-metric">
            <div className="reports-metric-label">
              VALIDITY
            </div>

            <div className="reports-metric-value">
              {textValue(validity)}
            </div>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            02
          </span>

          <h2 className="reports-section-title">
            DATASET SNAPSHOT
          </h2>
        </div>

        <div className="reports-info-grid">
          <div className="reports-info-item">
            <div className="reports-info-label">
              NAME
            </div>

            <div className="reports-info-value">
              {textValue(datasetName)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              FORMAT
            </div>

            <div className="reports-info-value">
              {textValue(datasetFormat)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              PATH
            </div>

            <div className="reports-info-value">
              {textValue(datasetPath)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              ROWS
            </div>

            <div className="reports-info-value">
              {textValue(rows)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              COLUMNS
            </div>

            <div className="reports-info-value">
              {textValue(columns)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              QUALITY
            </div>

            <div className="reports-info-value">
              {textValue(qualityStatus)}
            </div>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            03
          </span>

          <h2 className="reports-section-title">
            DATA QUALITY
          </h2>
        </div>

        <div className="reports-info-grid">
          <div className="reports-info-item">
            <div className="reports-info-label">
              ROWS
            </div>

            <div className="reports-info-value">
              {textValue(rows)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              COLUMNS
            </div>

            <div className="reports-info-value">
              {textValue(columns)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              MISSING VALUES
            </div>

            <div className="reports-info-value">
              {textValue(missing)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              DUPLICATES
            </div>

            <div className="reports-info-value">
              {textValue(duplicates)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              VALIDITY
            </div>

            <div className="reports-info-value">
              {textValue(validity)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              STATUS
            </div>

            <div className="reports-info-value">
              {textValue(qualityStatus)}
            </div>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            04
          </span>

          <h2 className="reports-section-title">
            PREPARATION HISTORY
          </h2>
        </div>

        {preparationHistory ? (
          <pre className="reports-code">
            {Array.isArray(preparationHistory)
              ? renderArray(preparationHistory)
              : typeof preparationHistory ===
                  'object'
                ? renderObject(preparationHistory)
                : textValue(preparationHistory)}
          </pre>
        ) : (
          <div className="reports-empty">
            <p className="reports-empty-title">
              PREPARATION DETAILS NOT AVAILABLE
            </p>

            <p className="reports-empty-text">
              No preparation history is recorded
              for this version.
            </p>
          </div>
        )}
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            05
          </span>

          <h2 className="reports-section-title">
            TRAINING / EVALUATION
          </h2>
        </div>

        {training || evaluation ? (
          <div className="reports-info-grid">
            <div className="reports-info-item">
              <div className="reports-info-label">
                TRAINING
              </div>

              <div className="reports-info-value">
                {renderObject(training)}
              </div>
            </div>

            <div className="reports-info-item">
              <div className="reports-info-label">
                EVALUATION
              </div>

              <div className="reports-info-value">
                {renderObject(evaluation)}
              </div>
            </div>
          </div>
        ) : (
          <div className="reports-empty">
            <p className="reports-empty-title">
              NO TRAINING RUN RECORDED
            </p>

            <p className="reports-empty-text">
              No training or evaluation evidence is
              recorded for this version.
            </p>
          </div>
        )}
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            06
          </span>

          <h2 className="reports-section-title">
            GIT / DVC PROVENANCE
          </h2>
        </div>

        <div className="reports-provenance-grid">
          <div className="reports-provenance-block">
            <div className="reports-provenance-label">
              GIT COMMIT
            </div>

            <div className="reports-inline-code">
              {textValue(gitCommit)}
            </div>
          </div>

          <div className="reports-provenance-block">
            <div className="reports-provenance-label">
              DVC STATUS
            </div>

            <div className="reports-inline-code">
              {textValue(dvc?.status)}
            </div>
          </div>
        </div>

        <div className="reports-divider" />

        {trackedFiles.length > 0 ? (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>FILE</th>
                  <th>STATUS</th>
                  <th>HASH</th>
                </tr>
              </thead>

              <tbody>
                {trackedFiles.map(
                  (file, index) => (
                    <tr
                      key={`${String(
                        file.path ?? index,
                      )}-${index}`}
                    >
                      <td>
                        {textValue(
                          file.path ??
                            file.file ??
                            file.name,
                        )}
                      </td>

                      <td>
                        {textValue(file.status)}
                      </td>

                      <td>
                        {textValue(
                          file.hash ??
                            file.md5 ??
                            file.checksum,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <pre className="reports-code">
            {dvc
              ? renderObject(dvc)
              : 'DVC state not available.'}
          </pre>
        )}
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            07
          </span>

          <h2 className="reports-section-title">
            VERSION METADATA
          </h2>
        </div>

        <div className="reports-info-grid">
          <div className="reports-info-item">
            <div className="reports-info-label">
              ID
            </div>

            <div className="reports-info-value">
              {textValue(version.id)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              VERSION
            </div>

            <div className="reports-info-value">
              {versionLabel(
                version.version_number,
              )}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              PROJECT ID
            </div>

            <div className="reports-info-value">
              {textValue(version.project_id)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              ML RUN ID
            </div>

            <div className="reports-info-value">
              {textValue(version.ml_run_id)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              CREATED
            </div>

            <div className="reports-info-value">
              {textValue(version.created_at)}
            </div>
          </div>

          <div className="reports-info-item">
            <div className="reports-info-label">
              DESCRIPTION
            </div>

            <div className="reports-info-value">
              {textValue(version.description)}
            </div>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            08
          </span>

          <h2 className="reports-section-title">
            ADDITIONAL EVIDENCE
          </h2>
        </div>

        <pre className="reports-code">
          {JSON.stringify(record, null, 2)}
        </pre>
      </section>

      <section className="reports-section reports-ai-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            AI
          </span>

          <h2 className="reports-section-title">
            AI INSIGHTS
          </h2>
        </div>

        <p className="reports-section-description">
          DATAGIT AI ANALYSIS
        </p>

        {!aiInsights ? (
          <div className="reports-empty">
            <p className="reports-empty-title">
              AI INSIGHTS NOT AVAILABLE
            </p>

            <p className="reports-empty-text">
              Generate an AI interpretation from the
              most recent successful Data Preparation
              result.
            </p>
          </div>
        ) : aiAvailable ? (
          <div className="reports-ai">
            <div className="reports-ai-status-row">
              <span className="reports-ai-status-label">
                STATUS
              </span>

              <span className="reports-ai-status">
                SUCCESS
              </span>
            </div>

            {aiInsights.summary ? (
              <div className="reports-ai-block">
                <div className="reports-ai-heading">
                  SUMMARY
                </div>

                <p className="reports-ai-text">
                  {aiInsights.summary}
                </p>
              </div>
            ) : null}

            {aiInsights.quality_assessment ? (
              <div className="reports-ai-block">
                <div className="reports-ai-heading">
                  QUALITY ASSESSMENT
                </div>

                <p className="reports-ai-text">
                  {aiInsights.quality_assessment}
                </p>
              </div>
            ) : null}

            <div className="reports-ai-block">
              <div className="reports-ai-heading">
                CHANGES EXPLAINED
              </div>

              {aiChanges.length > 0 ? (
                <div className="reports-ai-change-list">
                  {aiChanges.map(
                    (item, index) => (
                      <div
                        className="reports-ai-change"
                        key={`change-${index}`}
                      >
                        <div className="reports-ai-change-title">
                          <span className="reports-ai-index">
                            {String(index + 1).padStart(
                              2,
                              '0',
                            )}
                          </span>

                          <span>
                            {item.change ??
                              'Change detected'}
                          </span>
                        </div>

                        {item.explanation ? (
                          <p className="reports-ai-change-explanation">
                            {item.explanation}
                          </p>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="reports-ai-muted">
                  No additional changes were reported.
                </p>
              )}
            </div>

            <div className="reports-ai-block">
              <div className="reports-ai-heading">
                RECOMMENDATIONS
              </div>

              {aiRecommendations.length > 0 ? (
                <div className="reports-ai-recommendation-list">
                  {aiRecommendations.map(
                    (item, index) => (
                      <div
                        className="reports-ai-recommendation"
                        key={`recommendation-${index}`}
                      >
                        <div className="reports-ai-recommendation-top">
                          <span className="reports-ai-recommendation-number">
                            {String(index + 1).padStart(
                              2,
                              '0',
                            )}
                          </span>

                          <span className="reports-ai-recommendation-title">
                            {item.recommendation ??
                              'Recommendation'}
                          </span>

                          <span
                            className={priorityClass(
                              item.priority,
                            )}
                          >
                            {(
                              item.priority ??
                              'normal'
                            ).toUpperCase()}
                          </span>
                        </div>

                        {item.reason ? (
                          <p className="reports-ai-recommendation-reason">
                            {item.reason}
                          </p>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="reports-ai-muted">
                  No recommendations were returned.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="reports-empty">
            <p className="reports-empty-title">
              AI ANALYSIS UNAVAILABLE
            </p>

            <p className="reports-empty-text">
              {aiInsights.reason ??
                'The deterministic report is available, but AI analysis is not available.'}
            </p>
          </div>
        )}
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            09
          </span>

          <h2 className="reports-section-title">
            REPORT STATUS
          </h2>
        </div>

        <div className="reports-empty">
          <p className="reports-empty-title">
            BACKEND VERSION REPORT
          </p>

          <p className="reports-empty-text">
            This report is rendered directly from the
            selected project and version records.
            Deterministic backend evidence remains the
            source of truth. AI interpretation is shown
            separately when available.
          </p>
        </div>
      </section>
    </article>
  );
}