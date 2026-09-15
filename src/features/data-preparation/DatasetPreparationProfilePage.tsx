import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';

interface ProfileColumnInfo {
  name?: string;
  data_type?: string;
  missing?: number;
  unique?: number;
}

interface PreparationProfileResponse {
  filename?: string;
  file_type?: string;
  rows?: number;
  columns?: number;
  column_names?: string[];
  column_information?: ProfileColumnInfo[];
  missing_values?: Record<string, number>;
  missing_value_count?: number;
  duplicate_rows?: number;
  numeric_columns?: string[];
  categorical_columns?: string[];
  [key: string]: unknown;
}

function formatFileType(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return '—';
  }

  return value.toUpperCase();
}

function formatNumber(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }

  return '—';
}

function formatText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return '—';
}

function getProfileColumns(
  profile: PreparationProfileResponse,
): ProfileColumnInfo[] {
  if (Array.isArray(profile.column_information)) {
    return profile.column_information;
  }

  const names = Array.isArray(profile.column_names)
    ? profile.column_names
    : [];

  return names.map((name) => ({
    name,
  }));
}

function getRequestErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            detail?: string;
          };
        };
      }
    ).response;

    if (response?.data?.detail) {
      return response.data.detail;
    }
  }

  return 'Unable to load the dataset profile.';
}

export function DatasetPreparationProfilePage() {
  const navigate = useNavigate();
  const { filename = '' } = useParams();

  const [profile, setProfile] =
    useState<PreparationProfileResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const decodedFilename = useMemo(() => {
    try {
      return decodeURIComponent(filename);
    } catch {
      return filename;
    }
  }, [filename]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!decodedFilename) {
        setError('No dataset filename was provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response =
          await apiClient.get<PreparationProfileResponse>(
            `/dataset-preparations/profile/${encodeURIComponent(
              decodedFilename,
            )}`,
          );

        if (!active) {
          return;
        }

        setProfile(response.data);
      } catch (requestError: unknown) {
        if (!active) {
          return;
        }

        setError(getRequestErrorMessage(requestError));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [decodedFilename]);

  const columnInformation = useMemo(
    () => (profile ? getProfileColumns(profile) : []),
    [profile],
  );

  const missingValues = useMemo(() => {
    if (
      !profile ||
      typeof profile.missing_values !== 'object' ||
      profile.missing_values === null ||
      Array.isArray(profile.missing_values)
    ) {
      return [];
    }

    return Object.entries(profile.missing_values).filter(
      ([, value]) =>
        typeof value === 'number' && Number.isFinite(value),
    );
  }, [profile]);

  const numericColumns = Array.isArray(profile?.numeric_columns)
    ? profile.numeric_columns
    : [];

  const categoricalColumns = Array.isArray(
    profile?.categorical_columns,
  )
    ? profile.categorical_columns
    : [];

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="page-kicker">
            DATA / DATA PREPARATION / PROFILE
          </div>

          <h1>PROFILE</h1>

          <div className="page-description">
            Backend-generated profile for the uploaded dataset.
          </div>
        </div>

        <button
          type="button"
          className="cli-action"
          onClick={() => navigate('/data-preparation')}
        >
          &lt; DATA PREPARATION
        </button>
      </div>

      {loading && (
        <div className="state-panel">
          <span className="state-label">PROFILE</span>
          <span>
            Loading backend-generated profile...
          </span>
        </div>
      )}

      {!loading && error && (
        <div className="state-panel state-error">
          <span className="state-label">
            PROFILE ERROR
          </span>

          <span>{error}</span>
        </div>
      )}

      {!loading && !error && profile && (
        <>
          <section className="profile-section">
            <div className="profile-section-heading">
              <div className="profile-section-label">
                SOURCE
              </div>
            </div>

            <div className="profile-source-grid">
              <div className="profile-source-cell">
                <span className="profile-source-label">
                  FILE
                </span>

                <span className="profile-source-value">
                  {formatText(
                    profile.filename || decodedFilename,
                  )}
                </span>
              </div>

              <div className="profile-source-cell">
                <span className="profile-source-label">
                  TYPE
                </span>

                <span className="profile-source-value">
                  {formatFileType(profile.file_type)}
                </span>
              </div>

              <div className="profile-source-cell">
                <span className="profile-source-label">
                  ROWS
                </span>

                <span className="profile-source-value">
                  {formatNumber(profile.rows)}
                </span>
              </div>

              <div className="profile-source-cell">
                <span className="profile-source-label">
                  COLUMNS
                </span>

                <span className="profile-source-value">
                  {formatNumber(profile.columns)}
                </span>
              </div>

              <div className="profile-source-cell">
                <span className="profile-source-label">
                  DUPLICATE ROWS
                </span>

                <span className="profile-source-value">
                  {formatNumber(profile.duplicate_rows)}
                </span>
              </div>

              <div className="profile-source-cell">
                <span className="profile-source-label">
                  MISSING VALUES
                </span>

                <span className="profile-source-value">
                  {formatNumber(
                    profile.missing_value_count,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-heading">
              <div className="profile-section-label">
                COLUMNS
              </div>
            </div>

            <div className="profile-table">
              <div className="profile-table-header">
                <span>NAME</span>
                <span>TYPE</span>
                <span>MISSING</span>
                <span>UNIQUE</span>
              </div>

              {columnInformation.length > 0 ? (
                columnInformation.map((column, index) => (
                  <div
                    className="profile-table-row"
                    key={`${column.name || 'column'}-${index}`}
                  >
                    <span className="profile-column-name">
                      {formatText(column.name)}
                    </span>

                    <span>
                      {formatText(column.data_type)}
                    </span>

                    <span>
                      {formatNumber(column.missing)}
                    </span>

                    <span>
                      {formatNumber(column.unique)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="profile-empty-row">
                  No column information was returned by the
                  backend.
                </div>
              )}
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-heading">
              <div className="profile-section-label">
                MISSING VALUES
              </div>
            </div>

            <div className="profile-list">
              {missingValues.length > 0 ? (
                missingValues.map(([column, count]) => (
                  <div
                    className="profile-list-row"
                    key={column}
                  >
                    <span className="profile-list-name">
                      {column}
                    </span>

                    <span className="profile-list-value">
                      {formatNumber(count)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="profile-empty-row">
                  No missing values were reported.
                </div>
              )}
            </div>
          </section>

          <section className="profile-type-grid">
            <div className="profile-section profile-type-panel">
              <div className="profile-section-heading">
                <div className="profile-section-label">
                  NUMERIC COLUMNS
                </div>
              </div>

              <div className="profile-name-list">
                {numericColumns.length > 0 ? (
                  numericColumns.map((column) => (
                    <div
                      className="profile-name-row"
                      key={column}
                    >
                      {column}
                    </div>
                  ))
                ) : (
                  <div className="profile-empty-row">
                    None reported.
                  </div>
                )}
              </div>
            </div>

            <div className="profile-section profile-type-panel">
              <div className="profile-section-heading">
                <div className="profile-section-label">
                  CATEGORICAL COLUMNS
                </div>
              </div>

              <div className="profile-name-list">
                {categoricalColumns.length > 0 ? (
                  categoricalColumns.map((column) => (
                    <div
                      className="profile-name-row"
                      key={column}
                    >
                      {column}
                    </div>
                  ))
                ) : (
                  <div className="profile-empty-row">
                    None reported.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </section>
  );
}