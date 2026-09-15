import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import apiClient from '../../api/client';
import {
  getPreparationFilename,
  getPreparationPlan,
  type PreparationConfigurationRequest,
} from './types/preparationWorkflow';

interface ValidationResponse {
  filename?: string;
  valid?: boolean;
  errors?: string[];
  warnings?: string[];
  [key: string]: unknown;
}

export function ValidatePreparationPage() {
  const navigate = useNavigate();

  const [filename, setFilename] =
    useState<string | null>(null);

  const [plan, setPlan] = useState<
    PreparationConfigurationRequest['operations']
  >([]);

  const [loading, setLoading] = useState(false);

  const [validation, setValidation] =
    useState<ValidationResponse | null>(null);

  const [error, setError] = useState('');

  useEffect(() => {
    setFilename(getPreparationFilename());
    setPlan(getPreparationPlan());
  }, []);

  async function runValidation() {
    if (!filename) {
      setError('No source dataset is selected.');
      return;
    }

    if (plan.length === 0) {
      setError('No preparation operations are configured.');
      return;
    }

    setLoading(true);
    setError('');
    setValidation(null);

    try {
      const response =
        await apiClient.post<ValidationResponse>(
          '/dataset-preparations/validate',
          {
            filename,
            operations: plan,
          },
        );

      setValidation(response.data);
    } catch (requestError: unknown) {
      let message =
        'Backend validation could not be completed.';

      if (
        typeof requestError === 'object' &&
        requestError !== null &&
        'response' in requestError
      ) {
        const response = (
          requestError as {
            response?: {
              data?: {
                detail?: string;
              };
            };
          }
        ).response;

        if (response?.data?.detail) {
          message = response.data.detail;
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function continueToExecute() {
    navigate('/data-preparation/execute');
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATA PREPARATION / VALIDATE
          </div>

          <h1>VALIDATE PLAN</h1>

          <div className="page-description">
            Backend validation determines whether the
            preparation plan can execute safely.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate('/data-preparation/configure')
          }
        >
          &lt; CONFIGURE
        </button>
      </div>

      <section className="preparation-step-bar">
        <span className="preparation-step">
          01 SELECT
        </span>

        <span className="preparation-step">
          02 CONFIGURE
        </span>

        <span className="preparation-step-active">
          03 VALIDATE
        </span>

        <span className="preparation-step">
          04 EXECUTE
        </span>

        <span className="preparation-step">
          05 RESULT
        </span>
      </section>

      <section className="preparation-file-context">
        <div>
          <div className="preparation-file-label">
            SOURCE FILE
          </div>

          <div className="preparation-file-value">
            {filename || 'NO SOURCE FILE'}
          </div>
        </div>
      </section>

      <section className="preparation-config-list">
        {plan.map((operation, index) => (
          <div
            className="preparation-config-item"
            key={`${operation.operation}-${index}`}
          >
            <div className="preparation-config-header">
              <div>
                <div className="configure-operation-number">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="preparation-config-title">
                  {operation.operation}
                </div>
              </div>
            </div>

            <div className="preparation-config-description">
              PARAMETERS
            </div>

            <pre className="json-block">
              {JSON.stringify(
                operation.parameters,
                null,
                2,
              )}
            </pre>
          </div>
        ))}
      </section>

      {error && (
        <div className="state-panel state-error">
          <span className="state-label">
            VALIDATION ERROR
          </span>

          <span>{error}</span>
        </div>
      )}

      {validation && (
        <section
          className={`validation-summary ${
            validation.valid
              ? 'validation-summary-valid'
              : 'validation-summary-invalid'
          }`}
        >
          <div className="validation-summary-label">
            RESULT
          </div>

          <div className="validation-summary-value">
            {validation.valid
              ? 'VALIDATION PASSED'
              : 'VALIDATION FAILED'}
          </div>

          {Array.isArray(validation.errors) &&
            validation.errors.length > 0 && (
              <div className="validation-list">
                {validation.errors.map(
                  (message, index) => (
                    <div
                      className="validation-item validation-item-error"
                      key={`error-${index}`}
                    >
                      {message}
                    </div>
                  ),
                )}
              </div>
            )}

          {Array.isArray(validation.warnings) &&
            validation.warnings.length > 0 && (
              <div className="validation-list">
                {validation.warnings.map(
                  (message, index) => (
                    <div
                      className="validation-item validation-item-warning"
                      key={`warning-${index}`}
                    >
                      {message}
                    </div>
                  ),
                )}
              </div>
            )}

          <div className="validation-item validation-item-info">
            {validation.valid
              ? 'Backend accepted the preparation plan.'
              : 'Backend rejected the preparation plan.'}
          </div>
        </section>
      )}

      <section className="configure-next-section">
        <div className="configure-next-heading">
          <div className="panel-label">
            NEXT STEP
          </div>

          <div className="configure-next-text">
            {validation?.valid
              ? 'Validation passed. Execution can now proceed through the backend.'
              : 'Run backend validation before execution.'}
          </div>
        </div>

        {validation?.valid ? (
          <button
            type="button"
            className="cli-action configure-primary-action"
            onClick={continueToExecute}
          >
            &gt; EXECUTE PREPARATION
          </button>
        ) : (
          <button
            type="button"
            className="cli-action configure-primary-action"
            disabled={loading}
            onClick={runValidation}
          >
            {loading
              ? 'VALIDATING...'
              : '> RUN VALIDATION'}
          </button>
        )}
      </section>
    </section>
  );
}