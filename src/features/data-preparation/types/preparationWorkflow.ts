export interface PreparationOperationConfig {
  operation: string;
  parameters: Record<string, unknown>;
}

export interface PreparationConfigurationRequest {
  filename: string;
  operations: PreparationOperationConfig[];
}

export interface PreparationConfigurationResponse {
  filename: string;
  operations: PreparationOperationConfig[];
  operation_count: number;
  status: string;
  message: string;
}

export interface PreparationValidationResponse {
  filename: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  operation_count: number;
}

export const PREPARATION_FILENAME_STORAGE_KEY =
  'datagit_preparation_filename';

export const PREPARATION_PLAN_STORAGE_KEY =
  'datagit_preparation_plan';

export function savePreparationFilename(
  filename: string,
) {
  sessionStorage.setItem(
    PREPARATION_FILENAME_STORAGE_KEY,
    filename,
  );
}

export function getPreparationFilename(): string | null {
  return sessionStorage.getItem(
    PREPARATION_FILENAME_STORAGE_KEY,
  );
}

export function savePreparationPlan(
  plan: PreparationOperationConfig[],
) {
  sessionStorage.setItem(
    PREPARATION_PLAN_STORAGE_KEY,
    JSON.stringify(plan),
  );
}

export function getPreparationPlan(): PreparationOperationConfig[] {
  const raw = sessionStorage.getItem(
    PREPARATION_PLAN_STORAGE_KEY,
  );

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is PreparationOperationConfig =>
        item &&
        typeof item === 'object' &&
        typeof item.operation === 'string' &&
        item.parameters &&
        typeof item.parameters === 'object',
    );
  } catch {
    return [];
  }
}