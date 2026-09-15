import type { PreparationOperationConfig } from '../types/preparationWorkflow';

interface OperationConfigPanelProps {
  operation: string;
  parameters: Record<string, unknown>;
  onChange: (parameters: Record<string, unknown>) => void;
}

function getStringParameter(
  parameters: Record<string, unknown>,
  key: string,
): string {
  const value = parameters[key];

  return typeof value === 'string' ? value : '';
}

function getNumberParameter(
  parameters: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = parameters[key];

  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function getStringArrayParameter(
  parameters: Record<string, unknown>,
  key: string,
): string[] {
  const value = parameters[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === 'string',
  );
}

function parseColumns(value: string): string[] {
  return value
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
}

function columnsToText(columns: string[]): string {
  return columns.join(', ');
}

function updateParameter(
  parameters: Record<string, unknown>,
  key: string,
  value: unknown,
): Record<string, unknown> {
  return {
    ...parameters,
    [key]: value,
  };
}

function updateColumns(
  parameters: Record<string, unknown>,
  value: string,
): Record<string, unknown> {
  return updateParameter(
    parameters,
    'columns',
    parseColumns(value),
  );
}

function updateJsonParameter(
  parameters: Record<string, unknown>,
  key: string,
  value: string,
): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);

    return {
      ...parameters,
      [key]: parsed,
    };
  } catch {
    return {
      ...parameters,
      [key]: value,
    };
  }
}

function renderColumnsField(
  parameters: Record<string, unknown>,
  onChange: (parameters: Record<string, unknown>) => void,
  helpText: string,
) {
  const columns = getStringArrayParameter(
    parameters,
    'columns',
  );

  return (
    <div className="preparation-config-field">
      <label htmlFor="preparation-columns">
        COLUMNS
      </label>

      <input
        id="preparation-columns"
        type="text"
        value={columnsToText(columns)}
        placeholder="age, income, score"
        onChange={(event) =>
          onChange(
            updateColumns(
              parameters,
              event.target.value,
            ),
          )
        }
      />

      <div className="preparation-config-help">
        {helpText}
      </div>
    </div>
  );
}

function renderJsonField(
  label: string,
  id: string,
  parameters: Record<string, unknown>,
  parameterKey: string,
  onChange: (parameters: Record<string, unknown>) => void,
  helpText: string,
) {
  const value = parameters[parameterKey];

  let text = '';

  if (value !== undefined) {
    try {
      text = JSON.stringify(value, null, 2);
    } catch {
      text = '';
    }
  }

  return (
    <div className="preparation-config-field">
      <label htmlFor={id}>
        {label}
      </label>

      <textarea
        id={id}
        value={text}
        placeholder="{}"
        onChange={(event) =>
          onChange(
            updateJsonParameter(
              parameters,
              parameterKey,
              event.target.value,
            ),
          )
        }
      />

      <div className="preparation-config-help">
        {helpText}
      </div>
    </div>
  );
}

export function OperationConfigPanel({
  operation,
  parameters,
  onChange,
}: OperationConfigPanelProps) {
  switch (operation) {
    /*
     * ======================================================
     * MISSING VALUES
     * ======================================================
     */

    case 'mice_imputation':
      return (
        <div>
          <div className="preparation-config-description">
            Multiple Imputation by Chained Equations
            requires one or more columns to process.
          </div>

          {renderColumnsField(
            parameters,
            onChange,
            'Required. Enter one or more columns separated by commas.',
          )}
        </div>
      );

    case 'knn_imputation':
      return (
        <div>
          <div className="preparation-config-description">
            K-Nearest Neighbors imputation requires one
            or more numeric columns to process.
          </div>

          {renderColumnsField(
            parameters,
            onChange,
            'Required. Enter numeric columns separated by commas.',
          )}

          <div className="preparation-config-field">
            <label htmlFor="knn-neighbors">
              N NEIGHBORS
            </label>

            <input
              id="knn-neighbors"
              type="number"
              min="1"
              step="1"
              value={getNumberParameter(
                parameters,
                'n_neighbors',
                5,
              )}
              onChange={(event) =>
                onChange(
                  updateParameter(
                    parameters,
                    'n_neighbors',
                    Number(event.target.value),
                  ),
                )
              }
            />

            <div className="preparation-config-help">
              Number of neighboring rows used for
              imputation.
            </div>
          </div>
        </div>
      );

    case 'handle_missing':
      return (
        <div>
          {renderJsonField(
            'COLUMNS / STRATEGIES',
            'missing-columns',
            parameters,
            'columns',
            onChange,
            'Example: {"age":"mean","income":"median"}',
          )}

          {renderJsonField(
            'CONSTANT VALUES',
            'missing-constants',
            parameters,
            'constant_values',
            onChange,
            'Required when a column uses the constant strategy.',
          )}
        </div>
      );

    /*
     * ======================================================
     * DUPLICATES / COLUMNS
     * ======================================================
     */

    case 'remove_duplicates':
      return (
        <div>
          <div className="preparation-config-field">
            <label htmlFor="duplicate-strategy">
              STRATEGY
            </label>

            <select
              id="duplicate-strategy"
              value={getStringParameter(
                parameters,
                'strategy',
              ) || 'keep_first'}
              onChange={(event) =>
                onChange(
                  updateParameter(
                    parameters,
                    'strategy',
                    event.target.value,
                  ),
                )
              }
            >
              <option value="keep_first">
                KEEP FIRST
              </option>

              <option value="keep_last">
                KEEP LAST
              </option>
            </select>
          </div>

          {renderColumnsField(
            parameters,
            onChange,
            'Optional. Leave empty to check duplicates across the full dataset.',
          )}
        </div>
      );

    case 'drop_columns':
      return renderColumnsField(
        parameters,
        onChange,
        'Required. Enter columns that should be removed.',
      );

    /*
     * ======================================================
     * OUTLIERS / TRANSFORMATIONS
     * ======================================================
     */

    case 'trim_outliers':
    case 'winsorize_outliers':
      return (
        <div>
          {renderColumnsField(
            parameters,
            onChange,
            'Required. Select numeric columns to process.',
          )}

          <div className="preparation-config-field">
            <label htmlFor="iqr-multiplier">
              IQR MULTIPLIER
            </label>

            <input
              id="iqr-multiplier"
              type="number"
              min="0.01"
              step="0.1"
              value={getNumberParameter(
                parameters,
                'iqr_multiplier',
                1.5,
              )}
              onChange={(event) =>
                onChange(
                  updateParameter(
                    parameters,
                    'iqr_multiplier',
                    Number(event.target.value),
                  ),
                )
              }
            />

            <div className="preparation-config-help">
              Multiplier used for IQR-based outlier
              detection.
            </div>
          </div>
        </div>
      );

    case 'log_transform':
      return renderColumnsField(
        parameters,
        onChange,
        'Required. Select numeric columns for logarithmic transformation.',
      );

    /*
     * ======================================================
     * STANDARDIZATION
     * ======================================================
     */

    case 'type_conversion':
      return (
        <div>
          {renderJsonField(
            'COLUMN TYPE MAPPINGS',
            'type-mappings',
            parameters,
            'columns',
            onChange,
            'Example: {"age":"int64","income":"float64"}',
          )}
        </div>
      );

    case 'string_standardization':
      return (
        <div>
          {renderColumnsField(
            parameters,
            onChange,
            'Select string columns that should be standardized.',
          )}
        </div>
      );

    case 'categorical_uniformity':
      return renderJsonField(
        'COLUMN MAPPINGS',
        'categorical-mappings',
        parameters,
        'mappings',
        onChange,
        'Provide explicit category mappings as JSON.',
      );

    case 'schema_alignment':
      return renderJsonField(
        'TARGET SCHEMA',
        'target-schema',
        parameters,
        'schema',
        onChange,
        'Provide the target schema as JSON.',
      );

    /*
     * ======================================================
     * ERRONEOUS DATA
     * ======================================================
     */

    case 'logical_rule_validation':
      return renderJsonField(
        'RULES',
        'logical-rules',
        parameters,
        'rules',
        onChange,
        'Provide backend-supported validation rules as JSON.',
      );

    case 'syntax_correction':
      return renderColumnsField(
        parameters,
        onChange,
        'Select columns where syntax or formatting should be corrected.',
      );

    case 'dummy_value_replacement':
      return (
        <div>
          {renderColumnsField(
            parameters,
            onChange,
            'Select columns containing configured dummy values.',
          )}

          {renderJsonField(
            'DUMMY VALUES',
            'dummy-values',
            parameters,
            'dummy_values',
            onChange,
            'Provide replacement mappings as JSON.',
          )}
        </div>
      );

    /*
     * ======================================================
     * SCALING / TRANSFORMATION
     * ======================================================
     */

    case 'min_max_scaling':
      return (
        <div>
          {renderColumnsField(
            parameters,
            onChange,
            'Required. Select numeric columns to scale.',
          )}

          <div className="preparation-config-field">
            <label htmlFor="min-range">
              MIN RANGE
            </label>

            <input
              id="min-range"
              type="number"
              step="any"
              value={getNumberParameter(
                parameters,
                'min',
                0,
              )}
              onChange={(event) =>
                onChange(
                  updateParameter(
                    parameters,
                    'min',
                    Number(event.target.value),
                  ),
                )
              }
            />
          </div>

          <div className="preparation-config-field">
            <label htmlFor="max-range">
              MAX RANGE
            </label>

            <input
              id="max-range"
              type="number"
              step="any"
              value={getNumberParameter(
                parameters,
                'max',
                1,
              )}
              onChange={(event) =>
                onChange(
                  updateParameter(
                    parameters,
                    'max',
                    Number(event.target.value),
                  ),
                )
              }
            />
          </div>
        </div>
      );

    case 'z_score_scaling':
      return renderColumnsField(
        parameters,
        onChange,
        'Required. Select numeric columns for Z-score standardization.',
      );

    case 'binning':
      return (
        <div>
          {renderColumnsField(
            parameters,
            onChange,
            'Select numeric columns to divide into bins.',
          )}

          <div className="preparation-config-field">
            <label htmlFor="bin-count">
              BIN COUNT
            </label>

            <input
              id="bin-count"
              type="number"
              min="2"
              step="1"
              value={getNumberParameter(
                parameters,
                'bins',
                5,
              )}
              onChange={(event) =>
                onChange(
                  updateParameter(
                    parameters,
                    'bins',
                    Number(event.target.value),
                  ),
                )
              }
            />
          </div>
        </div>
      );

    /*
     * ======================================================
     * IMBALANCED DATA
     * ======================================================
     */

    case 'oversampling':
    case 'smote':
    case 'undersampling':
      return (
        <div>
          {renderColumnsField(
            parameters,
            onChange,
            'Select the target/class column used for balancing.',
          )}

          <div className="preparation-config-field">
            <label htmlFor="target-column">
              TARGET COLUMN
            </label>

            <input
              id="target-column"
              type="text"
              value={getStringParameter(
                parameters,
                'target_column',
              )}
              placeholder="target"
              onChange={(event) =>
                onChange(
                  updateParameter(
                    parameters,
                    'target_column',
                    event.target.value,
                  ),
                )
              }
            />
          </div>
        </div>
      );

    /*
     * ======================================================
     * UNKNOWN OPERATION
     * ======================================================
     */

    default:
      return (
        <div>
          <div className="preparation-config-description">
            No dedicated parameter editor is available for
            this operation.
          </div>

          <div className="preparation-config-help">
            The operation will be sent to the backend with
            the parameters currently stored in the plan.
          </div>
        </div>
      );
  }
}