import { useEffect, useState } from 'react';

import {
  getReportProjects,
  getReportVersions,
  getReportVersionDetail,
} from './api/reportsApi';

import {
  extractAIInsights,
  extractAIRecommendations,
  generateAIReport,
} from './api/aiReportApi';

import type {
  ReportProject,
  ReportVersion,
  ReportVersionDetail,
} from './types/report';

import { ReportDocument } from './components/ReportDocument';

import './Reports.css';

const PREPARATION_RESULT_KEY = 'datagit_preparation_result';
const PREPARATION_FILENAME_KEY = 'datagit_preparation_filename';
const PREPARATION_PLAN_KEY = 'datagit_preparation_plan';

interface PreparationResult {
  input_file?: string;
  output_file?: string;
  output_path?: string;
  status?: string;
}

interface AIInsights {
  status?: string;
  summary?: string;
  quality_assessment?: string;
  changes_explained?: unknown;
  recommendations?: unknown;
  [key: string]: unknown;
}

function readSessionObject<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readSessionValue(key: string): string | null {
  return sessionStorage.getItem(key);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return null;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [value];
}

function textValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  return '';
}

function getAIInsightsRecord(value: unknown): AIInsights {
  const record = asRecord(value);

  if (!record) {
    return {};
  }

  return record as AIInsights;
}

function renderAIList(value: unknown) {
  const items = asArray(value);

  if (items.length === 0) {
    return (
      <p className="reports-empty-text">
        No items available.
      </p>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 10,
      }}
    >
      {items.map((item, index) => {
        const record = asRecord(item);

        if (!record) {
          return (
            <div
              key={index}
              style={{
                borderLeft:
                  '2px solid var(--accent-green, #19c37d)',
                paddingLeft: 12,
                lineHeight: 1.6,
              }}
            >
              {textValue(item)}
            </div>
          );
        }

        const title =
          textValue(record.title) ||
          textValue(record.name) ||
          textValue(record.action) ||
          textValue(record.operation) ||
          `ITEM ${index + 1}`;

        const explanation =
          textValue(record.explanation) ||
          textValue(record.description) ||
          textValue(record.reason) ||
          textValue(record.details) ||
          textValue(record.message);

        return (
          <div
            key={index}
            style={{
              borderLeft:
                '2px solid var(--accent-green, #19c37d)',
              padding: '2px 0 2px 12px',
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: '#f2f2f2',
                marginBottom: explanation ? 4 : 0,
              }}
            >
              {title}
            </div>

            {explanation ? (
              <div
                style={{
                  color: '#b8b8b8',
                }}
              >
                {explanation}
              </div>
            ) : (
              Object.entries(record)
                .filter(
                  ([key]) =>
                    ![
                      'title',
                      'name',
                      'action',
                      'operation',
                    ].includes(key),
                )
                .map(([key, val]) => {
                  const valueText = textValue(val);

                  if (!valueText) {
                    return null;
                  }

                  return (
                    <div
                      key={key}
                      style={{
                        color: '#b8b8b8',
                        marginTop: 3,
                      }}
                    >
                      <span
                        style={{
                          color: '#777777',
                        }}
                      >
                        {key.replaceAll('_', ' ')}:
                      </span>{' '}
                      {valueText}
                    </div>
                  );
                })
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<ReportProject[]>([]);
  const [versions, setVersions] = useState<ReportVersion[]>([]);

  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);

  const [selectedVersionId, setSelectedVersionId] =
    useState<number | null>(null);

  const [versionDetail, setVersionDetail] =
    useState<ReportVersionDetail | null>(null);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingVersions, setLoadingVersions] =
    useState(false);

  const [loadingDetail, setLoadingDetail] =
    useState(false);

  const [error, setError] = useState('');

  const [aiLoading, setAiLoading] = useState(false);

  const [aiError, setAiError] = useState('');

  const [aiInsights, setAiInsights] =
    useState<unknown>(null);

  const [aiRecommendations, setAiRecommendations] =
    useState<unknown>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoadingProjects(true);
        setError('');

        const result = await getReportProjects();

        if (!active) {
          return;
        }

        setProjects(result);

        if (result.length > 0) {
          setSelectedProjectId(result[0].id);
        } else {
          setSelectedProjectId(null);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load projects.',
        );
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedProjectId === null) {
      setVersions([]);
      setSelectedVersionId(null);
      setVersionDetail(null);
      return;
    }

    const projectId = selectedProjectId;
    let active = true;

    async function loadVersions() {
      try {
        setLoadingVersions(true);
        setError('');
        setVersionDetail(null);
        setSelectedVersionId(null);

        const result =
          await getReportVersions(projectId);

        if (!active) {
          return;
        }

        setVersions(result);

        if (result.length > 0) {
          const newest = [...result].sort(
            (a, b) =>
              b.version_number - a.version_number,
          )[0];

          setSelectedVersionId(newest.id);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setVersions([]);
        setSelectedVersionId(null);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load versions.',
        );
      } finally {
        if (active) {
          setLoadingVersions(false);
        }
      }
    }

    void loadVersions();

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  useEffect(() => {
    if (
      selectedProjectId === null ||
      selectedVersionId === null
    ) {
      return;
    }

    const projectId = selectedProjectId;
    const versionId = selectedVersionId;

    let active = true;

    async function loadVersionDetail() {
      try {
        setLoadingDetail(true);
        setError('');

        const result =
          await getReportVersionDetail(
            projectId,
            versionId,
          );

        if (!active) {
          return;
        }

        setVersionDetail(result);
      } catch (err) {
        if (!active) {
          return;
        }

        setVersionDetail(null);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load version report.',
        );
      } finally {
        if (active) {
          setLoadingDetail(false);
        }
      }
    }

    void loadVersionDetail();

    return () => {
      active = false;
    };
  }, [selectedProjectId, selectedVersionId]);

  const selectedProject =
    projects.find(
      (project) =>
        project.id === selectedProjectId,
    ) ?? null;

  async function handleGenerateAIReport() {
    setAiError('');
    setAiInsights(null);
    setAiRecommendations(null);

    const result =
      readSessionObject<PreparationResult>(
        PREPARATION_RESULT_KEY,
      );

    const storedFilename =
      readSessionValue(
        PREPARATION_FILENAME_KEY,
      );

    const operations =
      readSessionObject<unknown[]>(
        PREPARATION_PLAN_KEY,
      ) ?? [];

    const filename =
      storedFilename ??
      result?.input_file ??
      '';

    const outputFile =
      result?.output_file ??
      '';

    if (!filename) {
      setAiError(
        'No preparation dataset is available. Execute a preparation plan first.',
      );
      return;
    }

    if (!outputFile) {
      setAiError(
        'No prepared output file is available. Execute the preparation plan first.',
      );
      return;
    }

    try {
      setAiLoading(true);

      const response =
        await generateAIReport({
          filename,
          output_file: outputFile,
          operations,
        });

      const payload =
        response as Record<string, unknown>;

      setAiInsights(
        extractAIInsights(payload),
      );

      setAiRecommendations(
        extractAIRecommendations(payload),
      );
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Unable to generate AI report.',
      );
    } finally {
      setAiLoading(false);
    }
  }

  const insightRecord =
    getAIInsightsRecord(aiInsights);

  const summary =
    textValue(insightRecord.summary);

  const qualityAssessment =
    textValue(
      insightRecord.quality_assessment,
    );

  const status =
    textValue(insightRecord.status);

  const changesExplained =
    insightRecord.changes_explained;

  const recommendations =
    aiRecommendations ??
    insightRecord.recommendations;

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div className="reports-header-row">
          <div>
            <p className="reports-kicker">
              DATAGIT / AI &amp; INSIGHTS / REPORTS
            </p>

            <h1 className="reports-title">
              Version Reports
            </h1>

            <p className="reports-subtitle">
              Backend evidence, preparation results,
              provenance, and generated insights.
            </p>
          </div>
        </div>
      </header>

      <section className="reports-selector-bar">
        <div className="reports-selector">
          <label
            className="reports-selector-label"
            htmlFor="report-project"
          >
            PROJECT
          </label>

          <select
            id="report-project"
            value={selectedProjectId ?? ''}
            disabled={
              loadingProjects ||
              projects.length === 0
            }
            onChange={(event) => {
              const value = Number(
                event.target.value,
              );

              setSelectedProjectId(
                Number.isFinite(value)
                  ? value
                  : null,
              );
            }}
          >
            {projects.length === 0 ? (
              <option value="">
                No projects
              </option>
            ) : (
              projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="reports-selector">
          <label
            className="reports-selector-label"
            htmlFor="report-version"
          >
            VERSION
          </label>

          <select
            id="report-version"
            value={selectedVersionId ?? ''}
            disabled={
              loadingVersions ||
              versions.length === 0 ||
              selectedProjectId === null
            }
            onChange={(event) => {
              const value = Number(
                event.target.value,
              );

              setSelectedVersionId(
                Number.isFinite(value)
                  ? value
                  : null,
              );
            }}
          >
            {versions.length === 0 ? (
              <option value="">
                No versions
              </option>
            ) : (
              versions
                .slice()
                .sort(
                  (a, b) =>
                    b.version_number -
                    a.version_number,
                )
                .map((version) => (
                  <option
                    key={version.id}
                    value={version.id}
                  >
                    V{version.version_number}
                  </option>
                ))
            )}
          </select>
        </div>
      </section>

      {error ? (
        <section className="reports-state reports-error">
          <h2 className="reports-state-title">
            REPORT ERROR
          </h2>

          <p className="reports-state-text">
            {error}
          </p>
        </section>
      ) : null}

      {loadingProjects ? (
        <section className="reports-state reports-loading">
          <h2 className="reports-state-title">
            LOADING PROJECTS
          </h2>

          <p className="reports-state-text">
            Reading projects from the backend.
          </p>
        </section>
      ) : null}

      {loadingVersions ? (
        <section className="reports-state reports-loading">
          <h2 className="reports-state-title">
            LOADING VERSIONS
          </h2>

          <p className="reports-state-text">
            Reading project versions.
          </p>
        </section>
      ) : null}

      {loadingDetail ? (
        <section className="reports-state reports-loading">
          <h2 className="reports-state-title">
            LOADING REPORT
          </h2>

          <p className="reports-state-text">
            Loading selected version evidence.
          </p>
        </section>
      ) : null}

      {!loadingDetail &&
      versionDetail &&
      selectedProject ? (
        <ReportDocument
          project={selectedProject}
          version={versionDetail}
        />
      ) : null}

      <section className="reports-section">
        <div className="reports-section-heading">
          <span className="reports-section-number">
            AI
          </span>

          <h2 className="reports-section-title">
            AI INSIGHTS
          </h2>
        </div>

        <div className="reports-ai">
          <div className="reports-ai-label">
            DATAGIT AI ANALYSIS
          </div>

          <p className="reports-ai-answer">
            Generate an AI interpretation from the
            most recent successful Data Preparation
            result.
          </p>

          <div
            className="reports-actions"
            style={{
              marginTop: 14,
            }}
          >
            <button
              type="button"
              className="reports-back-button"
              onClick={handleGenerateAIReport}
              disabled={aiLoading}
            >
              {aiLoading
                ? 'GENERATING...'
                : 'GENERATE AI REPORT >'}
            </button>
          </div>

          {aiError ? (
            <div
              className="reports-state reports-error"
              style={{
                marginTop: 14,
              }}
            >
              <p className="reports-state-text">
                {aiError}
              </p>
            </div>
          ) : null}

          {aiInsights ||
          aiRecommendations ? (
            <div
              style={{
                marginTop: 22,
                display: 'grid',
                gap: 18,
              }}
            >
              {status ? (
                <div>
                  <div className="reports-ai-label">
                    STATUS
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color:
                        status.toLowerCase() ===
                        'success'
                          ? '#19c37d'
                          : '#f2f2f2',
                      fontWeight: 600,
                    }}
                  >
                    {status.toUpperCase()}
                  </div>
                </div>
              ) : null}

              {summary ? (
                <div>
                  <div className="reports-ai-label">
                    SUMMARY
                  </div>

                  <div
                    className="reports-ai-answer"
                    style={{
                      marginTop: 8,
                      lineHeight: 1.7,
                    }}
                  >
                    {summary}
                  </div>
                </div>
              ) : null}

              {qualityAssessment ? (
                <div>
                  <div className="reports-ai-label">
                    QUALITY ASSESSMENT
                  </div>

                  <div
                    className="reports-ai-answer"
                    style={{
                      marginTop: 8,
                      lineHeight: 1.7,
                    }}
                  >
                    {qualityAssessment}
                  </div>
                </div>
              ) : null}

              {changesExplained !==
                undefined &&
              changesExplained !== null ? (
                <div>
                  <div className="reports-ai-label">
                    CHANGES EXPLAINED
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                    }}
                  >
                    {renderAIList(
                      changesExplained,
                    )}
                  </div>
                </div>
              ) : null}

              {recommendations !==
                undefined &&
              recommendations !== null ? (
                <div>
                  <div className="reports-ai-label">
                    RECOMMENDATIONS
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                    }}
                  >
                    {renderAIList(
                      recommendations,
                    )}
                  </div>
                </div>
              ) : null}

              {!summary &&
              !qualityAssessment &&
              changesExplained ===
                undefined &&
              !recommendations ? (
                <div>
                  <div className="reports-ai-label">
                    AI RESPONSE
                  </div>

                  <div
                    className="reports-ai-answer"
                    style={{
                      marginTop: 8,
                      lineHeight: 1.7,
                    }}
                  >
                    The AI report was generated
                    successfully, but it did not
                    contain the expected structured
                    insight fields.
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {!aiInsights &&
          !aiRecommendations &&
          !aiError &&
          !aiLoading ? (
            <p className="reports-empty-text">
              No AI report generated yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}