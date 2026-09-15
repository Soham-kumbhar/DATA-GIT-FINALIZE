import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getPreparationFilename,
  getPreparationPlan,
} from './types/preparationWorkflow';

const RESULT_STORAGE_KEY = 'datagit_preparation_result';

interface StepResult {
  step?: number;
  operation?: string;
  status?: string;
  parameters?: Record<string, unknown>;
  rows_before?: number;
  rows_after?: number;
  columns_before?: number;
  columns_after?: number;
  details?: Record<string, unknown>;
}

interface PreparationResult {
  status?: string;
  input_file?: string;
  output_file?: string;
  output_path?: string;
  output_format?: string;
  rows_before?: number;
  rows_after?: number;
  columns_before?: number;
  columns_after?: number;
  operation_count?: number;
  step_results?: StepResult[];
}

function loadResult(): PreparationResult | null {
  const raw = sessionStorage.getItem(
    RESULT_STORAGE_KEY,
  );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PreparationResult;
  } catch {
    return null;
  }
}

function formatDetailValue(
  value: unknown,
): string {
  if (
    value !== null &&
    typeof value === 'object'
  ) {
    return JSON.stringify(value);
  }

  return String(value);
}

export function PreparationResultPage() {
  const navigate = useNavigate();

  const result = useMemo(
    () => loadResult(),
    [],
  );

  const sourceFilename = useMemo(
    () => getPreparationFilename(),
    [],
  );

  const plan = useMemo(
    () => getPreparationPlan(),
    [],
  );

  const outputFile =
    result?.output_file ?? 'prepared-dataset.csv';

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL?.replace(
      /\/$/,
      '',
    ) ?? '';

  const downloadUrl =
    `${apiBaseUrl}/dataset-preparations/prepared/` +
    encodeURIComponent(outputFile);

  const steps: StepResult[] =
    result?.step_results ??
    plan.map((operation, index): StepResult => ({
      step: index + 1,
      operation: operation.operation,
      status: 'success',
    }));

  function handlePrepareAgain() {
    sessionStorage.removeItem(
      RESULT_STORAGE_KEY,
    );

    sessionStorage.removeItem(
      'datagit_preparation_plan',
    );

    navigate('/data-preparation');
  }

  if (!result) {
    return (
      <div className="datagit-result-page">
        <style>{`
          .datagit-result-page {
            min-height: 100%;
            padding: 28px 32px 40px;
            color: #e5e7eb;
            font-family: "JetBrains Mono", monospace;
            background: #0d1117;
          }

          .result-breadcrumb {
            color: #8b949e;
            font-size: 11px;
            letter-spacing: .06em;
            margin-bottom: 20px;
          }

          .result-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .result-muted {
            color: #8b949e;
            font-size: 12px;
          }

          .result-empty {
            margin-top: 30px;
            border-top: 1px solid #30363d;
            border-bottom: 1px solid #30363d;
            padding: 26px 0;
          }

          .result-empty button {
            margin-top: 20px;
            border: 1px solid #484f58;
            background: #161b22;
            color: #f0f6fc;
            padding: 9px 13px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          }

          .result-empty button:hover {
            background: #21262d;
          }
        `}</style>

        <div className="result-breadcrumb">
          DATA / DATA PREPARATION / RESULT
        </div>

        <div className="result-title">
          PREPARATION RESULT
        </div>

        <div className="result-muted">
          No preparation result is available.
        </div>

        <div className="result-empty">
          Execute a preparation plan first.
          <br />

          <button
            type="button"
            onClick={() =>
              navigate('/data-preparation')
            }
          >
            &gt; OPEN DATA PREPARATION
          </button>
        </div>
      </div>
    );
  }

  const rowsBefore = result.rows_before ?? '—';
  const rowsAfter = result.rows_after ?? '—';
  const columnsBefore =
    result.columns_before ?? '—';
  const columnsAfter =
    result.columns_after ?? '—';

  return (
    <div className="datagit-result-page">
      <style>{`
        .datagit-result-page {
          min-height: 100%;
          padding: 24px 30px 40px;
          color: #e6edf3;
          font-family: "JetBrains Mono", monospace;
          background: #0d1117;
        }

        .result-breadcrumb {
          color: #8b949e;
          font-size: 11px;
          letter-spacing: .06em;
          margin-bottom: 20px;
        }

        .result-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid #30363d;
        }

        .result-title {
          margin: 0;
          color: #f0f6fc;
          font-size: 25px;
          line-height: 1.2;
          font-weight: 700;
        }

        .result-subtitle {
          margin-top: 8px;
          color: #8b949e;
          font-size: 12px;
        }

        .result-success {
          flex-shrink: 0;
          border: 1px solid #30363d;
          background: #11161c;
          color: #c9d1d9;
          padding: 8px 12px;
          font-size: 10px;
          letter-spacing: .06em;
        }

        .result-success::before {
          content: "●";
          margin-right: 7px;
          color: #8b949e;
        }

        .result-section {
          padding: 20px 0;
          border-bottom: 1px solid #30363d;
        }

        .result-section-label {
          margin-bottom: 12px;
          color: #8b949e;
          font-size: 10px;
          letter-spacing: .08em;
        }

        .result-source {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 7px 20px;
          font-size: 12px;
        }

        .result-source-key {
          color: #8b949e;
        }

        .result-source-value {
          color: #e6edf3;
          overflow-wrap: anywhere;
        }

        .result-file-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .result-file-name {
          color: #f0f6fc;
          font-size: 14px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .result-file-path {
          margin-top: 6px;
          color: #6e7681;
          font-size: 10px;
          overflow-wrap: anywhere;
        }

        .result-download {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 14px;
          border: 1px solid #6e7681;
          background: #161b22;
          color: #f0f6fc;
          text-decoration: none;
          font-family: inherit;
          font-size: 10px;
          letter-spacing: .03em;
        }

        .result-download:hover {
          border-color: #8b949e;
          background: #21262d;
        }

        .result-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(120px, 1fr));
          border-top: 1px solid #30363d;
          border-left: 1px solid #30363d;
        }

        .result-metric {
          min-height: 76px;
          padding: 13px 14px;
          border-right: 1px solid #30363d;
          border-bottom: 1px solid #30363d;
        }

        .result-metric-label {
          display: block;
          margin-bottom: 10px;
          color: #8b949e;
          font-size: 9px;
          letter-spacing: .06em;
        }

        .result-metric-value {
          display: block;
          color: #f0f6fc;
          font-size: 16px;
          font-weight: 700;
        }

        .result-change {
          margin-top: 5px;
          color: #8b949e;
          font-size: 10px;
        }

        .result-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .result-table th {
          padding: 10px;
          border-top: 1px solid #30363d;
          border-bottom: 1px solid #30363d;
          color: #8b949e;
          text-align: left;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: .06em;
        }

        .result-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #21262d;
          color: #c9d1d9;
        }

        .result-operation {
          color: #f0f6fc;
          font-weight: 700;
        }

        .result-status {
          color: #c9d1d9;
          font-size: 9px;
          letter-spacing: .05em;
        }

        .result-details {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(150px, 1fr)
          );
          border-top: 1px solid #30363d;
          border-left: 1px solid #30363d;
        }

        .result-detail {
          padding: 12px;
          border-right: 1px solid #30363d;
          border-bottom: 1px solid #30363d;
        }

        .result-detail-key {
          display: block;
          margin-bottom: 7px;
          color: #8b949e;
          font-size: 9px;
          letter-spacing: .06em;
        }

        .result-detail-value {
          color: #e6edf3;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .result-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 20px;
        }

        .result-secondary {
          border: 1px solid #30363d;
          background: transparent;
          color: #8b949e;
          padding: 9px 13px;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .result-secondary:hover {
          background: #161b22;
          color: #e6edf3;
        }

        @media (max-width: 900px) {
          .result-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .result-header,
          .result-file-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 600px) {
          .datagit-result-page {
            padding: 18px;
          }

          .result-source {
            grid-template-columns: 1fr;
          }

          .result-metrics {
            grid-template-columns: 1fr;
          }

          .result-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>

      <div className="result-breadcrumb">
        DATA / DATA PREPARATION / RESULT
      </div>

      <div className="result-header">
        <div>
          <h1 className="result-title">
            PREPARATION RESULT
          </h1>

          <div className="result-subtitle">
            Prepared dataset generated successfully.
          </div>
        </div>

        <div className="result-success">
          SUCCESS
        </div>
      </div>

      <section className="result-section">
        <div className="result-section-label">
          SOURCE
        </div>

        <div className="result-source">
          <span className="result-source-key">
            FILE
          </span>

          <span className="result-source-value">
            {sourceFilename ??
              result.input_file ??
              '—'}
          </span>

          <span className="result-source-key">
            FORMAT
          </span>

          <span className="result-source-value">
            {(
              result.output_format ?? 'csv'
            ).toUpperCase()}
          </span>
        </div>
      </section>

      <section className="result-section">
        <div className="result-section-label">
          PREPARED DATASET
        </div>

        <div className="result-file-row">
          <div>
            <div className="result-file-name">
              {outputFile}
            </div>

            <div className="result-file-path">
              {result.output_path ??
                `dataset_preparations\\prepared\\${outputFile}`}
            </div>
          </div>

          <a
            className="result-download"
            href={downloadUrl}
            download={outputFile}
          >
            ↓ DOWNLOAD DATASET
          </a>
        </div>
      </section>

      <section className="result-section">
        <div className="result-section-label">
          DATASET CHANGE
        </div>

        <div className="result-metrics">
          <div className="result-metric">
            <span className="result-metric-label">
              ROWS
            </span>

            <span className="result-metric-value">
              {rowsAfter}
            </span>

            <div className="result-change">
              {rowsBefore} → {rowsAfter}
            </div>
          </div>

          <div className="result-metric">
            <span className="result-metric-label">
              COLUMNS
            </span>

            <span className="result-metric-value">
              {columnsAfter}
            </span>

            <div className="result-change">
              {columnsBefore} → {columnsAfter}
            </div>
          </div>

          <div className="result-metric">
            <span className="result-metric-label">
              OPERATIONS
            </span>

            <span className="result-metric-value">
              {result.operation_count ??
                steps.length}
            </span>
          </div>

          <div className="result-metric">
            <span className="result-metric-label">
              STATUS
            </span>

            <span className="result-metric-value">
              SUCCESS
            </span>
          </div>
        </div>
      </section>

      <section className="result-section">
        <div className="result-section-label">
          OPERATIONS APPLIED
        </div>

        <table className="result-table">
          <thead>
            <tr>
              <th>STEP</th>
              <th>OPERATION</th>
              <th>ROWS</th>
              <th>COLUMNS</th>
              <th>STATUS</th>
            </tr>
          </thead>

          <tbody>
            {steps.map(
              (step, index) => (
                <tr
                  key={`${step.step ?? index}-${step.operation ?? 'operation'}`}
                >
                  <td>
                    {String(
                      step.step ?? index + 1,
                    ).padStart(2, '0')}
                  </td>

                  <td className="result-operation">
                    {step.operation ?? '—'}
                  </td>

                  <td>
                    {step.rows_before ?? '—'}
                    {' → '}
                    {step.rows_after ?? '—'}
                  </td>

                  <td>
                    {step.columns_before ?? '—'}
                    {' → '}
                    {step.columns_after ?? '—'}
                  </td>

                  <td className="result-status">
                    {(
                      step.status ?? 'success'
                    ).toUpperCase()}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      <section className="result-section">
        <div className="result-section-label">
          OPERATION DETAILS
        </div>

        {steps.map(
          (step, index) => {
            const details = Object.entries(
              step.details ?? {},
            );

            if (!details.length) {
              return null;
            }

            return (
              <div
                key={`details-${step.step ?? index}`}
                style={{
                  marginBottom:
                    index < steps.length - 1
                      ? 18
                      : 0,
                }}
              >
                <div
                  style={{
                    marginBottom: 10,
                    color: '#f0f6fc',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {step.operation ?? 'operation'}
                </div>

                <div className="result-details">
                  {details.map(
                    ([key, value]) => (
                      <div
                        className="result-detail"
                        key={`${step.operation}-${key}`}
                      >
                        <span className="result-detail-key">
                          {key
                            .replace(/_/g, ' ')
                            .toUpperCase()}
                        </span>

                        <span className="result-detail-value">
                          {formatDetailValue(
                            value,
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            );
          },
        )}
      </section>

      <div className="result-actions">
        <a
          className="result-download"
          href={downloadUrl}
          download={outputFile}
        >
          ↓ DOWNLOAD DATASET
        </a>

        <button
          type="button"
          className="result-secondary"
          onClick={() =>
            navigate(
              '/data-preparation/execute',
            )
          }
        >
          &lt; EXECUTE
        </button>

        <button
          type="button"
          className="result-secondary"
          onClick={handlePrepareAgain}
        >
          NEW PREPARATION
        </button>
      </div>
    </div>
  );
}