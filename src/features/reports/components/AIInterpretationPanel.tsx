import { useMemo, useState, type ReactNode } from 'react';
import type { ReportVersionDetail } from '../types/report';
import './AIInterpretationPanel.css';

interface Props {
  projectId: number;
  version: ReportVersionDetail;
}

type RecordValue = Record<string, unknown>;

type MetricRow = {
  key: string;
  label: string;
  value: number;
  kind: 'percent' | 'number' | 'loss';
};

const SUGGESTED_QUESTIONS = [
  'Explain this version in simple words using only the recorded evidence.',
  'What is the most important thing that changed in this version?',
  'What model evidence, metrics, and evaluation evidence are recorded?',
  'What evidence is missing and how does that limit the conclusion?',
  'Can this version be reproduced from the recorded evidence?',
];

const PREFERRED_METRICS = [
  'accuracy',
  'precision',
  'recall',
  'f1',
  'f1_score',
  'loss',
];

function record(value: unknown): RecordValue {
  return value &&
    typeof value === 'object' &&
    !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function text(value: unknown, fallback = '—'): string {
  if (typeof value === 'string' && value.trim()) {
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

function list(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => text(item, ''))
    .filter(Boolean);
}

function findText(
  payload: RecordValue,
  keys: string[],
): string {
  for (const key of keys) {
    const value = payload[key];

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return '';
}

function metricRows(
  value: unknown,
): MetricRow[] {
  const source = record(value);

  const entries = Object.entries(source)
    .filter(
      ([, raw]) =>
        typeof raw === 'number' &&
        Number.isFinite(raw),
    ) as Array<[string, number]>;

  const ordered = entries.sort(([a], [b]) => {
    const ai = PREFERRED_METRICS.indexOf(
      a.toLowerCase(),
    );

    const bi = PREFERRED_METRICS.indexOf(
      b.toLowerCase(),
    );

    if (ai === -1 && bi === -1) {
      return a.localeCompare(b);
    }

    if (ai === -1) {
      return 1;
    }

    if (bi === -1) {
      return -1;
    }

    return ai - bi;
  });

  return ordered.slice(0, 6).map(
    ([key, value]) => {
      const normalized = key
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');

      const isPercentMetric = [
        'accuracy',
        'precision',
        'recall',
        'f1',
        'f1_score',
      ].includes(normalized);

      const isLoss =
        normalized === 'loss' ||
        normalized.includes('loss');

      return {
        key,
        label: key.replaceAll('_', ' '),
        value,
        kind: isPercentMetric
          ? 'percent'
          : isLoss
            ? 'loss'
            : 'number',
      };
    },
  );
}

function metricDisplay(
  row: MetricRow,
): string {
  if (
    row.kind === 'percent' &&
    row.value >= 0 &&
    row.value <= 1
  ) {
    return `${(
      row.value * 100
    ).toFixed(1)}%`;
  }

  if (Number.isInteger(row.value)) {
    return String(row.value);
  }

  return row.value
    .toFixed(4)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
}

function metricWidth(
  row: MetricRow,
): number {
  if (
    row.kind === 'percent' &&
    row.value >= 0 &&
    row.value <= 1
  ) {
    return Math.max(
      4,
      Math.min(row.value * 100, 100),
    );
  }

  const numeric = Math.abs(row.value);

  return Math.max(
    4,
    Math.min(numeric * 100, 100),
  );
}

function EvidenceDonut({
  recorded,
  total,
}: {
  recorded: number;
  total: number;
}) {
  const safeTotal = Math.max(total, 1);

  const percent = Math.round(
    (recorded / safeTotal) * 100,
  );

  const radius = 39;
  const circumference =
    2 * Math.PI * radius;

  const dash =
    (percent / 100) *
    circumference;

  return (
    <div className="ai-pro-donut-wrap">
      <svg
        viewBox="0 0 96 96"
        className="ai-pro-donut"
        aria-label={`${percent}% evidence recorded`}
      >
        <circle
          cx="48"
          cy="48"
          r={radius}
          className="ai-pro-donut-track"
        />

        <circle
          cx="48"
          cy="48"
          r={radius}
          className="ai-pro-donut-value"
          strokeDasharray={`${dash} ${
            circumference - dash
          }`}
          transform="rotate(-90 48 48)"
        />
      </svg>

      <div className="ai-pro-donut-center">
        <strong>{percent}%</strong>
        <span>recorded</span>
      </div>
    </div>
  );
}

function MetricChart({
  metrics,
}: {
  metrics: RecordValue;
}) {
  const rows = metricRows(metrics);

  if (!rows.length) {
    return null;
  }

  return (
    <div className="ai-pro-metric-chart">
      {rows.map((row) => (
        <div
          className="ai-pro-metric-row"
          key={row.key}
        >
          <div className="ai-pro-metric-topline">
            <span>{row.label}</span>
            <strong>
              {metricDisplay(row)}
            </strong>
          </div>

          <div className="ai-pro-metric-track">
            <i
              className={`ai-pro-metric-fill is-${row.kind}`}
              style={{
                width: `${metricWidth(row)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AIInterpretationPanel({
  projectId,
  version,
}: Props) {
  const [question, setQuestion] = useState(
    SUGGESTED_QUESTIONS[0],
  );

  const [answer, setAnswer] =
    useState<RecordValue | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const dataset = record(
    version.dataset,
  );

  const evidence =
    version.result_evidence ?? {};

  const model = record(
    evidence.model,
  );

  const metrics = record(
    evidence.metrics,
  );

  const evaluation = record(
    evidence.evaluation,
  );

  const dvc = record(
    version.dvc,
  );

  const dvcState = record(
    version.dvc_state,
  );

  const git = record(
    version.git,
  );

  const hasModel =
    Object.keys(model).length > 0;

  const hasMetrics =
    Object.keys(metrics).length > 0;

  const hasEvaluation =
    Object.keys(evaluation).length > 0;

  const hasDataset =
    Object.keys(dataset).length > 0;

  const hasGit = Boolean(
    version.git_commit ||
      git.commit ||
      git.sha,
  );

  const hasDvc = Boolean(
    dvc.md5 ||
      dvc.hash ||
      dvc.checksum ||
      dvcState.md5 ||
      dvcState.hash ||
      dvcState.checksum,
  );

  const preparation = Array.isArray(
    record(version.preparation).operations,
  )
    ? (record(version.preparation)
        .operations as unknown[])
    : [];

  const notes = text(
    evidence.notes,
    '',
  );

  const evidenceItems = [
    hasDataset,
    hasGit,
    hasDvc,
    preparation.length > 0,
    hasModel,
    hasMetrics,
    hasEvaluation,
    Boolean(evidence),
    Boolean(notes),
  ];

  const recorded =
    evidenceItems.filter(Boolean).length;

  const metricRowsData =
    metricRows(metrics);

  const evidenceSnapshot = useMemo(
    () => ({
      version: version.version_number,

      description:
        version.description ?? null,

      dataset: {
        path: text(
          dataset.path ??
            dataset.file_path ??
            dataset.dataset_path,
          'Not recorded',
        ),

        rows:
          dataset.row_count ??
          dataset.rows ??
          null,

        columns:
          dataset.column_count ??
          dataset.columns_count ??
          null,

        format:
          dataset.format ??
          dataset.file_format ??
          null,

        size_bytes:
          dataset.size_bytes ??
          dataset.size ??
          null,

        missing_values:
          dataset.missing_values ??
          dataset.missing_count ??
          null,

        duplicate_rows:
          dataset.duplicate_rows ??
          dataset.duplicates ??
          null,

        columns_list:
          Array.isArray(dataset.columns)
            ? dataset.columns
            : [],
      },

      git: {
        commit:
          version.git_commit ??
          git.commit ??
          git.sha ??
          null,

        author:
          git.author ??
          git.author_name ??
          null,

        committed_at:
          git.committed_at ??
          git.commit_time ??
          null,

        message:
          git.message ??
          git.commit_message ??
          version.description ??
          null,
      },

      dvc: {
        md5:
          dvc.md5 ??
          dvc.hash ??
          dvc.checksum ??
          dvcState.md5 ??
          dvcState.hash ??
          dvcState.checksum ??
          null,

        dvc_file:
          dvc.dvc_file ??
          dvcState.dvc_file ??
          null,

        state:
          dvc.state ??
          dvcState.state ??
          null,
      },

      result_evidence: {
        model: hasModel
          ? model
          : null,

        metrics: hasMetrics
          ? metrics
          : null,

        evaluation: hasEvaluation
          ? evaluation
          : null,

        notes:
          notes || null,
      },
    }),
    [
      dataset,
      dvc,
      dvcState,
      git,
      hasEvaluation,
      hasMetrics,
      hasModel,
      model,
      notes,
      version,
    ],
  );

  const context = useMemo(
    () =>
      [
        'DATAGIT EVIDENCE LOCK',

        `Selected version: ${version.version_number}`,

        'Use only the exact deterministic evidence snapshot below.',

        'Do not use other project versions, legacy ML runs, filesystem state, prior snapshots, or inferred DVC state.',

        'If a value is null or Not recorded, state NOT RECORDED.',

        'Never invent metrics, model details, evaluation outcomes, hashes, file sizes, or causal explanations.',

        '',

        JSON.stringify(
          evidenceSnapshot,
          null,
          2,
        ),
      ].join('\n'),
    [
      evidenceSnapshot,
      version.version_number,
    ],
  );

  async function askAI() {
    const trimmed =
      question.trim();

    if (!trimmed) {
      return;
    }

    setLoading(true);
    setError('');
    setAnswer(null);

    try {
      const base =
        import.meta.env
          .VITE_API_BASE_URL ||
        'http://127.0.0.1:8000';

      const response =
        await fetch(
          `${base}/projects/${projectId}/versions/ask-ai`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              question:
                `${context}\n\nUSER QUESTION:\n${trimmed}`,
            }),
          },
        );

      const payload =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          text(
            record(payload).detail,
            `AI request failed (${response.status}).`,
          ),
        );
      }

      setAnswer(
        record(payload),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach DATAGIT AI.',
      );
    } finally {
      setLoading(false);
    }
  }

  const answerText =
    answer
      ? findText(answer, [
          'answer',
          'summary',
          'response',
          'text',
          'message',
        ])
      : '';

  const facts =
    answer
      ? list(
          answer.facts ??
            answer.evidence ??
            answer.observations,
        )
      : [];

  const limitations =
    answer
      ? list(
          answer.limitations ??
            answer.insufficient_evidence,
        )
      : [];

  const recommendations =
    answer
      ? list(
          answer.recommendations,
        )
      : [];

  const confidence =
    answer
      ? findText(answer, [
          'confidence',
        ])
      : '';

  return (
    <div className="ai-pro">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="ai-pro-head">
        <div>
          <span className="ai-pro-eyebrow">
            DATAGIT AI · EVIDENCE INTERPRETER
          </span>

          <h3>
            Ask about version{' '}
            {version.version_number}
          </h3>

          <p>
            Interpret the recorded evidence
            for this exact version. AI explains
            evidence; it does not create it.
          </p>
        </div>

        <Pill>
          {recorded}/9 EVIDENCE SIGNALS
        </Pill>
      </div>

      {/* =====================================================
          SOURCE OVERVIEW
      ===================================================== */}
      <div className="ai-pro-overview">
        <div className="ai-pro-overview-card ai-pro-overview-card-ai">
          <div className="ai-pro-overview-mark">
            ✦
          </div>

          <div>
            <span>SOURCE</span>

            <strong>
              VERSION {version.version_number}
            </strong>

            <p>
              Deterministic evidence locked.
            </p>
          </div>
        </div>

        <div className="ai-pro-overview-card">
          <span>DATASET</span>

          <strong>
            {hasDataset
              ? 'RECORDED'
              : 'NOT RECORDED'}
          </strong>
        </div>

        <div className="ai-pro-overview-card">
          <span>DVC</span>

          <strong>
            {hasDvc
              ? 'RECORDED'
              : 'NOT RECORDED'}
          </strong>
        </div>

        <div className="ai-pro-overview-card">
          <span>RESULTS</span>

          <strong>
            {hasMetrics ||
            hasEvaluation
              ? 'RECORDED'
              : 'NOT RECORDED'}
          </strong>
        </div>
      </div>

      {/* =====================================================
          SUGGESTED QUESTIONS
          DELIBERATELY ABOVE USER QUESTION
      ===================================================== */}
      <div className="ai-pro-quick">
        <div className="ai-pro-panel-title">
          <span>
            SUGGESTED QUESTIONS
          </span>

          <em>
            SELECT TO USE
          </em>
        </div>

        <div className="ai-pro-quick-grid">
          {SUGGESTED_QUESTIONS.map(
            (item, index) => (
              <button
                key={item}
                type="button"
                className={
                  question === item
                    ? 'is-active'
                    : ''
                }
                onClick={() =>
                  setQuestion(item)
                }
              >
                <span>
                  Q{index + 1}
                </span>

                <strong>
                  {item}
                </strong>
              </button>
            ),
          )}
        </div>
      </div>

      {/* =====================================================
          USER QUESTION
      ===================================================== */}
      <div className="ai-pro-compose">
        <div className="ai-pro-panel-title">
          <span>YOUR QUESTION</span>

          <em>
            SOURCE LOCKED
          </em>
        </div>

        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value,
            )
          }
          rows={4}
          placeholder="Ask something about this version..."
        />

        <div className="ai-pro-compose-footer">
          <span>
            Only recorded deterministic
            evidence for V
            {version.version_number}
            is supplied to AI.
          </span>

          <button
            type="button"
            onClick={() =>
              void askAI()
            }
            disabled={
              loading ||
              !question.trim()
            }
          >
            {loading
              ? 'THINKING…'
              : 'ASK AI'}{' '}
            ↗
          </button>
        </div>
      </div>

      {/* =====================================================
          VISUAL EVIDENCE
      ===================================================== */}
      <div className="ai-pro-visuals">
        <div className="ai-pro-visual-card ai-pro-coverage-card">
          <div className="ai-pro-panel-title">
            <span>
              EVIDENCE COVERAGE
            </span>

            <em>
              {recorded}/9
            </em>
          </div>

          <div className="ai-pro-visual-row">
            <EvidenceDonut
              recorded={recorded}
              total={9}
            />

            <div>
              <strong>
                {recorded} of 9
              </strong>

              <p>
                evidence signals currently
                recorded for this version.
              </p>
            </div>
          </div>
        </div>

        <div className="ai-pro-visual-card ai-pro-performance-card">
          <div className="ai-pro-panel-title">
            <span>
              MODEL PERFORMANCE
            </span>

            <em>
              {hasMetrics
                ? 'RECORDED'
                : 'NOT RECORDED'}
            </em>
          </div>

          {metricRowsData.length ? (
            <MetricChart
              metrics={metrics}
            />
          ) : (
            <div className="ai-pro-no-metrics">
              <div className="ai-pro-no-metrics-grid" />

              <div>
                <strong>
                  No performance graph
                  available
                </strong>

                <p>
                  Accuracy, precision,
                  recall, F1-score,
                  loss, or other numeric
                  result metrics are not
                  recorded for this version.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}
      {error ? (
        <div className="ai-pro-error">
          <strong>
            AI UNAVAILABLE
          </strong>

          <p>{error}</p>
        </div>
      ) : null}

      {/* =====================================================
          ANSWER
      ===================================================== */}
      {answer ? (
        <div className="ai-pro-output">
          <div className="ai-pro-output-head">
            <div>
              <span>
                AI OUTPUT
              </span>

              <h4>
                Evidence-grounded
                interpretation
              </h4>
            </div>

            <div className="ai-pro-confidence">
              CONFIDENCE{' '}
              <strong>
                {confidence || '—'}
              </strong>
            </div>
          </div>

          <div className="ai-pro-answer-primary">
            <span>
              INTERPRETATION
            </span>

            <p>
              {answerText ||
                'No interpretation text was returned.'}
            </p>
          </div>

          <div className="ai-pro-output-grid">
            <div className="ai-pro-facts-card">
              <div className="ai-pro-panel-title">
                <span>
                  FACTS / EVIDENCE
                </span>

                <em>
                  {facts.length}
                </em>
              </div>

              {facts.length ? (
                <div className="ai-pro-fact-list">
                  {facts.map(
                    (item, index) => (
                      <div
                        key={`${item}-${index}`}
                      >
                        <span>
                          {String(
                            index + 1,
                          ).padStart(
                            2,
                            '0',
                          )}
                        </span>

                        <p>{item}</p>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="ai-pro-muted">
                  No separate fact list was
                  returned. The deterministic
                  report remains the factual
                  source.
                </p>
              )}
            </div>

            <div className="ai-pro-table-card">
              <div className="ai-pro-panel-title">
                <span>
                  RECORDED METRICS
                </span>

                <em>
                  {metricRowsData.length}
                </em>
              </div>

              {metricRowsData.length ? (
                <div className="ai-pro-mini-table">
                  {metricRowsData.map(
                    (row) => (
                      <div
                        key={row.key}
                      >
                        <span>
                          {row.label}
                        </span>

                        <strong>
                          {metricDisplay(
                            row,
                          )}
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="ai-pro-muted">
                  No numeric result
                  metrics are recorded
                  for this version.
                </p>
              )}
            </div>
          </div>

          {limitations.length ? (
            <div className="ai-pro-limits-card">
              <div className="ai-pro-panel-title">
                <span>
                  LIMITATIONS
                </span>
              </div>

              {limitations.map(
                (item, index) => (
                  <p
                    key={`${item}-${index}`}
                  >
                    • {item}
                  </p>
                ),
              )}
            </div>
          ) : null}

          {recommendations.length ? (
            <div className="ai-pro-limits-card ai-pro-recommend-card">
              <div className="ai-pro-panel-title">
                <span>
                  NEXT STEPS
                </span>
              </div>

              {recommendations.map(
                (item, index) => (
                  <p
                    key={`${item}-${index}`}
                  >
                    → {item}
                  </p>
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="ai-pro-ready">
          <span className="ai-pro-ready-icon">
            ✦
          </span>

          <div>
            <strong>
              AI interpretation is ready
            </strong>

            <p>
              Choose a question above or
              write your own. The answer will
              be grounded in Version{' '}
              {version.version_number}
              's recorded evidence only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="ai-pro-pill">
      {children}
    </span>
  );
}