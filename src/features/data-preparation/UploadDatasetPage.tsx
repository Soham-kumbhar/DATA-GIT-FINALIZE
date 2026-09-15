import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { uploadDataset } from './api/uploadApi';

import { UploadDatasetForm } from './components/UploadDatasetForm';

import {
  savePreparationFilename,
} from './types/preparationWorkflow';

export function UploadDatasetPage() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadedFilename, setUploadedFilename] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleUpload(file: File) {
    try {
      setLoading(true);
      setError(null);

      await uploadDataset(file);

      setSelectedFile(file);
      setUploadedFilename(file.name);

      savePreparationFilename(file.name);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to upload dataset.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATA PREPARATION / UPLOAD
          </div>

          <h1>UPLOAD DATASET</h1>

          <div className="page-description">
            Upload the source CSV used by the preparation
            backend.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() =>
            navigate('/data-preparation')
          }
        >
          &lt; PREPARATION
        </button>
      </div>

      {error && (
        <div className="state-panel state-error">
          <span className="state-label">
            ERROR
          </span>

          <span>{error}</span>
        </div>
      )}

      <UploadDatasetForm
        onUpload={handleUpload}
        loading={loading}
      />

      {selectedFile && uploadedFilename && (
        <div className="upload-success-panel">
          <div className="upload-success-label">
            UPLOAD COMPLETE
          </div>

          <div className="upload-success-file">
            {uploadedFilename}
          </div>

          <div className="preparation-next-action">
            <div>
              <div className="page-kicker">
                NEXT STEP
              </div>

              <div className="preparation-next-text">
                Continue to backend dataset profiling.
              </div>
            </div>

            <button
              type="button"
              className="cli-action"
              onClick={() =>
                navigate(
                  `/data-preparation/profile/${encodeURIComponent(
                    uploadedFilename,
                  )}`,
                )
              }
            >
              &gt; PROFILE DATASET
            </button>
          </div>
        </div>
      )}
    </section>
  );
}