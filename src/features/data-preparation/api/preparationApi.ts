import apiClient from '../../../api/client';

export interface PreparationOperation {
  operation?: string;
  name?: string;
  category?: string;
  label?: string;
  status?: string;
  description?: string;
  strategies?: string[];
  parameters?: Record<string, unknown>;
}

export interface PreparationOperationsResponse {
  status?: string;
  operations?: PreparationOperation[];
  categories?: Record<
    string,
    PreparationOperation[]
  >;
}

export async function getPreparationOperations(): Promise<
  PreparationOperation[]
> {
  const response =
    await apiClient.get<PreparationOperationsResponse>(
      '/dataset-preparations/operations',
    );

  const data = response.data;

  if (Array.isArray(data.operations)) {
    return data.operations;
  }

  if (data.categories) {
    return Object.entries(data.categories).flatMap(
      ([category, operationList]) =>
        operationList.map((operation) => ({
          ...operation,
          category:
            operation.category || category,
        })),
    );
  }

  return [];
}