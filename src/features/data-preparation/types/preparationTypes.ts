export interface SelectedPreparationOperation {
  operation: string;
  category: string;
  label: string;
}

export interface PreparationStep {
  operation: string;
  category: string;
  label: string;
  config: Record<string, unknown>;
}