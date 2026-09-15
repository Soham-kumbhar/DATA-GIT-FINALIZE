import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OperationConfigPanel } from './components/OperationConfigPanel';
import { configurePreparation } from './api/configurationApi';
import {
  getPreparationFilename,
  getPreparationPlan,
  savePreparationPlan,
  type PreparationConfigurationResponse,
  type PreparationOperationConfig,
} from './types/preparationWorkflow';

function getOperationLabel(operation: string): string {
  return operation
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function sanitizeParameters(
  operation: PreparationOperationConfig,
): PreparationOperationConfig {
  if (
    operation.operation === 'mice_imputation' ||
    operation.operation === 'knn_imputation'
  ) {
    const rawColumns = operation.parameters?.columns;

    if (Array.isArray(rawColumns)) {
      const cleanColumns = rawColumns.filter(
        (column): column is string =>
          typeof column === 'string' &&
          !column.includes('"operation"') &&
          !column.includes('"parameters"'),
      );

      return {
        ...operation,
        parameters: {
          ...operation.parameters,
          columns: cleanColumns,
        },
      };
    }
  }

  return operation;
}

export function ConfigurePreparationPage() {
  const navigate = useNavigate();

  const [filename, setFilename] =
    useState<string | null>(null);

  const [plan, setPlan] = useState<
    PreparationOperationConfig[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [configured, setConfigured] =
    useState<PreparationConfigurationResponse | null>(null);

  useEffect(() => {
    setFilename(getPreparationFilename());

    const storedPlan = getPreparationPlan().map(
      sanitizeParameters,
    );

    setPlan(storedPlan);

    savePreparationPlan(storedPlan);
  }, []);

  const canValidate = useMemo(
    () => Boolean(filename && plan.length > 0),
    [filename, plan],
  );

  function updateOperationParameters(
    index: number,
    parameters: Record<string, unknown>,
  ) {
    setPlan((current) =>
      current.map((operation, operationIndex) =>
        operationIndex === index
          ? sanitizeParameters({
              ...operation,
              parameters,
            })
          : operation,
      ),
    );
  }

  async function handleValidatePlan() {
    if (!filename) {
      setError('No source dataset is selected.');
      return;
    }

    if (plan.length === 0) {
      setError(
        'No preparation operations are selected.',
      );
      return;
    }

    const cleanPlan = plan.map(sanitizeParameters);

    setPlan(cleanPlan);
    savePreparationPlan(cleanPlan);

    setLoading(true);
    setError('');

    try {
      const response = await configurePreparation({
        filename,
        operations: cleanPlan,
      });

      setConfigured(response);
      savePreparationPlan(cleanPlan);
    } catch (requestError: unknown) {
      let message =
        'Unable to configure the preparation plan.';

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

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATA PREPARATION / CONFIGURE
          </div>

          <h1>CONFIGURE OPERATIONS</h1>

          <div className="page-description">
            Set the parameters for the selected operations
            before backend validation.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate('/data-preparation')
          }
        >
          &lt; OPERATIONS
        </button>
      </div>

      <section className="preparation-step-bar">
        <span className="preparation-step">
          01 SELECT
        </span>

        <span className="preparation-step-active">
          02 CONFIGURE
        </span>

        <span className="preparation-step">
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

      {error && (
        <div className="state-panel state-error">
          <span className="state-label">ERROR</span>
          <span>{error}</span>
        </div>
      )}

      <section className="configure-plan-section">
        <div className="configure-section-heading">
          <div>
            <div className="page-kicker">
              SELECTED OPERATIONS
            </div>

            <div className="configure-section-title">
              {plan.length} operation
              {plan.length === 1 ? '' : 's'} selected
            </div>
          </div>
        </div>

        <div className="preparation-config-list">
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
                    {getOperationLabel(
                      operation.operation,
                    )}
                  </div>
                </div>

                <div className="preparation-config-status">
                  SELECTED
                </div>
              </div>

              <div className="preparation-config-description">
                Configure this operation before backend
                validation.
              </div>

              <div className="preparation-config-controls">
                <OperationConfigPanel
                  operation={operation.operation}
                  parameters={operation.parameters}
                  onChange={(parameters) =>
                    updateOperationParameters(
                      index,
                      parameters,
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="configure-next-section">
        <div className="configure-next-heading">
          <div className="panel-label">
            WHAT HAPPENS NEXT
          </div>

          <div className="configure-next-text">
            {configured
              ? 'The preparation plan is configured. Continue to backend validation.'
              : 'Your configuration will be sent to the backend for validation. No data is changed on this screen.'}
          </div>
        </div>

        {!configured ? (
          <button
            type="button"
            className="cli-action configure-primary-action"
            disabled={!canValidate || loading}
            onClick={handleValidatePlan}
          >
            {loading
              ? 'CONFIGURING...'
              : '> VALIDATE PLAN'}
          </button>
        ) : (
          <button
            type="button"
            className="cli-action configure-primary-action"
            onClick={() =>
              navigate('/data-preparation/validate')
            }
          >
            &gt; CONTINUE TO VALIDATION
          </button>
        )}
      </section>
    </section>
  );
}