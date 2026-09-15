import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getPreparationProfile,
  type DatasetProfile,
} from './api/profileApi';

export function PreparationProfilePage() {
  const navigate = useNavigate();
  const { filename } = useParams();

  const [profile, setProfile] =
    useState<DatasetProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!filename) {
        setError('Filename is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data =
          await getPreparationProfile(filename);

        if (active) {
          setProfile(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dataset profile.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [filename]);

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
          onClick={() =>
            navigate('/data-preparation')
          }
        >
          &lt; DATA PREPARATION
        </button>
      </div>

      <div className="profile-context">
        FILE : {filename}
      </div>

      {loading && (
        <div className="state-panel">
          <span className="state-label">
            STATUS
          </span>

          <span>
            Profiling dataset...
          </span>
        </div>
      )}

      {error && (
        <div className="state-panel state-error">
          <span className="state-label">
            ERROR
          </span>

          <span>{error}</span>
        </div>
      )}

      {!loading &&
        !error &&
        profile &&
        (
          <div className="preparation-profile">
            {Object.entries(profile).map(
              ([key, value]) => (
                <div
                  className="preparation-profile-row"
                  key={key}
                >
                  <span className="preparation-profile-key">
                    {key}
                  </span>

                  <span className="preparation-profile-value">
                    {typeof value === 'object'
                      ? JSON.stringify(
                          value,
                          null,
                          2,
                        )
                      : String(value)}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
    </section>
  );
}