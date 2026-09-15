import { useState } from 'react';

interface UploadDatasetFormProps {
  onUpload: (file: File) => Promise<void> | void;
  loading?: boolean;
}

export function UploadDatasetForm({
  onUpload,
  loading = false,
}: UploadDatasetFormProps) {
  const [file, setFile] =
    useState<File | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!file || loading) {
      return;
    }

    await onUpload(file);
  }

  return (
    <form
      className="upload-dataset-form"
      onSubmit={handleSubmit}
    >
      <div className="form-field">
        <label htmlFor="dataset-file">
          DATASET FILE
        </label>

        <input
          id="dataset-file"
          type="file"
          accept=".csv,text/csv"
          disabled={loading}
          onChange={(event) => {
            const selectedFile =
              event.target.files?.[0] ?? null;

            setFile(selectedFile);
          }}
        />

        <div className="form-help">
          CSV files are currently supported by the backend
          preparation workflow.
        </div>

        {file && (
          <div className="upload-file-name">
            SELECTED : {file.name}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="cli-action"
          disabled={!file || loading}
        >
          {loading
            ? 'UPLOADING...'
            : '> UPLOAD DATASET'}
        </button>
      </div>
    </form>
  );
}