import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OperationRow from './components/OperationRow';

import {
  getPreparationOperations,
  type PreparationOperation,
} from './api/preparationApi';

import {
  getPreparationFilename,
  savePreparationPlan,
  type PreparationOperationConfig,
} from './types/preparationWorkflow';

interface OperationItem {
  operation: PreparationOperation;
  index: number;
}

function getOperationName(
  operation: PreparationOperation,
): string {
  return (
    operation.operation ||
    operation.name ||
    ''
  );
}

function getOperationKey(
  category: string,
  index: number,
): string {
  return `${category}::${index}`;
}

export function DataPreparationPage() {
  const navigate = useNavigate();

  const [filename, setFilename] =
    useState<string | null>(
      getPreparationFilename(),
    );

  const [operations, setOperations] = useState<
    PreparationOperation[]
  >([]);

  const [selectedOperations, setSelectedOperations] =
    useState<Set<string>>(new Set());

  const [loadingOperations, setLoadingOperations] =
    useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOperations() {
      setLoadingOperations(true);
      setError('');

      try {
        const data = await getPreparationOperations();

        if (!active) {
          return;
        }

        setOperations(data);
      } catch (requestError: unknown) {
        if (!active) {
          return;
        }

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

          setError(
            response?.data?.detail ||
              'Unable to load preparation operations.',
          );
        } else {
          setError(
            'Unable to load preparation operations.',
          );
        }
      } finally {
        if (active) {
          setLoadingOperations(false);
        }
      }
    }

    void loadOperations();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleStorageChange() {
      setFilename(getPreparationFilename());
    }

    window.addEventListener(
      'datagit-preparation-file-changed',
      handleStorageChange,
    );

    return () => {
      window.removeEventListener(
        'datagit-preparation-file-changed',
        handleStorageChange,
      );
    };
  }, []);

  const groupedOperations = useMemo(() => {
    const groups: Record<
      string,
      OperationItem[]
    > = {};

    operations.forEach((operation, index) => {
      const category =
        operation.category || 'OTHER';

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push({
        operation,
        index,
      });
    });

    return groups;
  }, [operations]);

  function toggleOperation(
    category: string,
    index: number,
  ) {
    if (!filename) {
      return;
    }

    const key = getOperationKey(category, index);

    setSelectedOperations((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function configureSelectedOperations() {
    if (!filename) {
      navigate('/data-preparation/upload');
      return;
    }

    const selectedPlan: PreparationOperationConfig[] =
      [];

    Object.entries(groupedOperations).forEach(
      ([category, items]) => {
        items.forEach(
          ({ operation, index }) => {
            const key = getOperationKey(
              category,
              index,
            );

            if (!selectedOperations.has(key)) {
              return;
            }

            const operationName =
              getOperationName(operation);

            if (!operationName) {
              return;
            }

            selectedPlan.push({
              operation: operationName,
              parameters: {},
            });
          },
        );
      },
    );

    if (selectedPlan.length === 0) {
      setError(
        'Select at least one preparation operation.',
      );
      return;
    }

    setError('');

    savePreparationPlan(selectedPlan);

    navigate('/data-preparation/configure');
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATA PREPARATION
          </div>

          <h1>PREPARE DATA</h1>

          <div className="page-description">
            Build a preparation plan from backend-supported
            operations.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate('/data-preparation/upload')
          }
        >
          + UPLOAD DATASET
        </button>
      </div>

      <section className="preparation-file-context">
        <div>
          <div className="preparation-file-label">
            SOURCE DATASET
          </div>

          <div className="preparation-file-value">
            {filename || 'NO DATASET SELECTED'}
          </div>
        </div>

        <button
          type="button"
          className="cli-action secondary-action"
          onClick={() =>
            navigate('/data-preparation/upload')
          }
        >
          {filename
            ? 'CHANGE DATASET'
            : 'SELECT DATASET'}
        </button>
      </section>

      {!filename && (
        <div className="state-panel">
          <span className="state-label">
            DATASET REQUIRED
          </span>

          <span>
            Upload a dataset before selecting preparation
            operations.
          </span>
        </div>
      )}

      {filename && (
        <div className="state-panel">
          <span className="state-label">
            PREPARATION SOURCE
          </span>

          <span>
            Operations will be performed on the uploaded
            dataset shown above.
          </span>
        </div>
      )}

      {error && (
        <div className="state-panel state-error">
          <span className="state-label">ERROR</span>
          <span>{error}</span>
        </div>
      )}

      <div className="preparation-section-header">
        <div>
          <div className="page-kicker">
            AVAILABLE OPERATIONS
          </div>

          <h2>SELECT OPERATIONS</h2>
        </div>

        <div className="selection-count">
          SELECTED : {selectedOperations.size}
        </div>
      </div>

      {loadingOperations && (
        <div className="state-panel">
          <span className="state-label">
            OPERATIONS
          </span>

          <span>
            Loading backend-supported operations...
          </span>
        </div>
      )}

      {!loadingOperations &&
        !error &&
        Object.keys(groupedOperations).length ===
          0 && (
          <div className="state-panel">
            <span className="state-label">
              OPERATIONS
            </span>

            <span>
              No preparation operations were returned by
              the backend.
            </span>
          </div>
        )}

      {!loadingOperations &&
        Object.keys(groupedOperations).length > 0 && (
          <div className="operation-groups">
            {Object.entries(groupedOperations).map(
              ([category, items]) => (
                <section
                  className="operation-group"
                  key={category}
                >
                  <div className="operation-group-heading">
                    {category}
                  </div>

                  <div className="operation-list">
                    {items.map(
                      ({ operation, index }) => {
                        const key =
                          getOperationKey(
                            category,
                            index,
                          );

                        return (
                          <OperationRow
                            key={key}
                            operation={operation}
                            selected={selectedOperations.has(
                              key,
                            )}
                            disabled={!filename}
                            onToggle={() =>
                              toggleOperation(
                                category,
                                index,
                              )
                            }
                          />
                        );
                      },
                    )}
                  </div>
                </section>
              ),
            )}
          </div>
        )}

      <div className="preparation-next-action">
        <div>
          <div className="panel-label">
            NEXT STEP
          </div>

          <div className="preparation-next-text">
            Configure parameters for the selected
            operations.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          disabled={!filename}
          onClick={configureSelectedOperations}
        >
          CONFIGURE &gt;
        </button>
      </div>
    </section>
  );
}