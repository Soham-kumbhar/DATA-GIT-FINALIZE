import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getPreparationFilename,
  getPreparationPlan,
} from './types/preparationWorkflow';

import { proceedWithPreparation } from './api/proceedApi';

const RESULT_STORAGE_KEY = 'datagit_preparation_result';

interface ExecuteResult {
  status?: string;
  message?: string;
  result?: {
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
    step_results?: Array<{
      step?: number;
      operation?: string;
      status?: string;
      parameters?: Record<string, unknown>;
      rows_before?: number;
      rows_after?: number;
      columns_before?: number;
      columns_after?: number;
      details?: Record<string, unknown>;
    }>;
  };
  detail?: string;
}

export function ExecutePreparationPage() {
  const navigate = useNavigate();

  const filename = useMemo(
    () => getPreparationFilename(),
    [],
  );

  const plan = useMemo(
    () => getPreparationPlan(),
    [],
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filename) {
      navigate('/data-preparation/upload', {
        replace: true,
      });
      return;
    }

    if (!plan.length) {
      navigate('/data-preparation', {
        replace: true,
      });
    }
  }, [filename, navigate, plan.length]);

  async function handleExecute() {
    if (!filename || !plan.length || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await proceedWithPreparation({
        filename,
        operations: plan,
      });

      setResult(response);

      if (
        response.status === 'success' &&
        response.result
      ) {
        sessionStorage.setItem(
          RESULT_STORAGE_KEY,
          JSON.stringify(response.result),
        );
      }
    } catch (requestError: any) {
      console.error(requestError);

      const detail =
        requestError?.response?.data?.detail;

      if (typeof detail === 'string') {
        setError(detail);
      } else if (
        detail &&
        typeof detail === 'object'
      ) {
        setError(
          detail.message ??
            'Dataset preparation execution failed.',
        );
      } else {
        setError(
          'Dataset preparation execution failed.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleViewResult() {
    if (!result?.result) {
      return;
    }

    sessionStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify(result.result),
    );

    navigate('/data-preparation/result');
  }

  return (
    <div className="page page-data-preparation">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            DATA / DATA PREPARATION / EXECUTE
          </div>

          <h1>EXECUTE PREPARATION</h1>
        </div>
      </div>

      <div className="preparation-workflow">
        <span className="workflow-step complete">
          01 SELECT
        </span>

        <span className="workflow-arrow">→</span>

        <span className="workflow-step complete">
          02 CONFIGURE
        </span>

        <span className="workflow-arrow">→</span>

        <span className="workflow-step complete">
          03 VALIDATE
        </span>

        <span className="workflow-arrow">→</span>

        <span className="workflow-step active">
          04 EXECUTE
        </span>

        <span className="workflow-arrow">→</span>

        <span className="workflow-step">
          05 RESULT
        </span>
      </div>

      <section className="panel">
        <div className="panel-header">
          <span className="panel-label">
            SOURCE
          </span>

          <strong>
            {filename ?? '—'}
          </strong>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">
            PLAN
          </div>

          <div className="profile-table">
            <div className="profile-table-header">
              <span>STEP</span>
              <span>OPERATION</span>
              <span>STATUS</span>
            </div>

            {plan.map((operation, index) => {
              let status = 'READY';

              if (loading) {
                status =
                  index === 0
                    ? 'RUNNING'
                    : 'QUEUED';
              }

              if (result?.result?.step_results?.[index]) {
                status =
                  result.result.step_results[index]
                    .status
                    ?.toUpperCase() ?? 'SUCCESS';
              }

              return (
                <div
                  className="profile-table-row"
                  key={`${operation.operation}-${index}`}
                >
                  <span>
                    {String(index + 1).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <strong>
                    {operation.operation}
                  </strong>

                  <span>{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {!loading && !result && !error && (
          <div className="profile-section">
            <div className="profile-section-title">
              STATUS
            </div>

            <div className="status-line">
              <strong>READY</strong>
            </div>
          </div>
        )}

        {loading && (
          <div className="profile-section">
            <div className="profile-section-title">
              EXECUTION
            </div>

            <div className="execution-console">
              <div>READING DATASET</div>
              <div>APPLYING PREPARATION PLAN</div>
              <div>WRITING PREPARED DATASET</div>
            </div>
          </div>
        )}

        {error && (
          <div className="profile-section">
            <div className="profile-section-title">
              EXECUTION ERROR
            </div>

            <div className="error-message">
              {error}
            </div>
          </div>
        )}

        {result?.result && (
          <div className="profile-section">
            <div className="profile-section-title">
              EXECUTION
            </div>

            <div className="result-grid">
              <div className="result-metric">
                <span>STATUS</span>
                <strong>SUCCESS</strong>
              </div>

              <div className="result-metric">
                <span>ROWS</span>
                <strong>
                  {result.result.rows_before ?? '—'}
                  {' → '}
                  {result.result.rows_after ?? '—'}
                </strong>
              </div>

              <div className="result-metric">
                <span>COLUMNS</span>
                <strong>
                  {result.result.columns_before ?? '—'}
                  {' → '}
                  {result.result.columns_after ?? '—'}
                </strong>
              </div>

              <div className="result-metric">
                <span>OUTPUT</span>
                <strong>
                  {result.result.output_file ?? '—'}
                </strong>
              </div>
            </div>
          </div>
        )}

        <div className="result-actions">
          {!result?.result && (
            <button
              type="button"
              className="primary-action"
              onClick={handleExecute}
              disabled={
                loading ||
                !filename ||
                !plan.length
              }
            >
              {loading
                ? 'EXECUTING…'
                : '> EXECUTE PREPARATION'}
            </button>
          )}

          {result?.result && (
            <button
              type="button"
              className="primary-action"
              onClick={handleViewResult}
            >
              &gt; VIEW RESULT
            </button>
          )}
        </div>
      </section>
    </div>
  );
}