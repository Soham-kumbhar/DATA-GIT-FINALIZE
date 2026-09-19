import {
  useState,
  type KeyboardEvent,
} from 'react';

import apiClient from '../../../api/client';

import {
  getVersionComparison,
  type ComparePayload,
} from '../../compare/compareApi';

import type {
  ReportVersion,
  ReportVersionDetail,
} from '../types/report';

import './AIReportPanel.css';

interface Props {
  projectId: number;
  currentVersion: ReportVersionDetail;
  versions: ReportVersion[];
}

interface AIProjectQuestionResponse {
  status?: string;
  question?: string;
  answer?: string;
  evidence?: string[];
  limitations?: string[];
  confidence?: string;
  [key: string]: unknown;
}

const SUGGESTED_QUESTIONS = [
  'What is recorded about this version?',
  'What changed from the reference version?',
  'What dataset is recorded for this version?',
  'What model and metrics such as accuracy are recorded?',
  'What evidence is missing for this version?',
  'Can this version be reproduced from the recorded evidence?',
  'Explain this version in simple words.',
];

function versionLabel(
  version: ReportVersion,
): string {
  return `V${version.version_number}`;
}

export default function AIReportPanel({
  projectId,
  currentVersion,
  versions,
}: Props) {
  const comparableVersions = versions
    .filter(
      (version) =>
        version.id !== currentVersion.id &&
        version.version_number <
          currentVersion.version_number,
    )
    .sort(
      (a, b) =>
        b.version_number -
        a.version_number,
    );

  const projectVersions = [...versions].sort(
    (a, b) =>
      a.version_number -
      b.version_number,
  );

  const [compareVersionId, setCompareVersionId] =
    useState<number | null>(
      comparableVersions[0]?.id ?? null,
    );

  const [result, setResult] =
    useState<ComparePayload | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [question, setQuestion] =
    useState('');

  const [questionResult, setQuestionResult] =
    useState<AIProjectQuestionResponse | null>(
      null,
    );

  const [questionLoading, setQuestionLoading] =
    useState(false);

  const [questionError, setQuestionError] =
    useState('');

  const selectedCompareVersion =
    versions.find(
      (version) =>
        version.id === compareVersionId,
    ) ?? null;

  async function handleAnalyze() {
    if (!compareVersionId) {
      setError(
        'Select a version to compare against.',
      );
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const comparison =
        await getVersionComparison(
          projectId,
          compareVersionId,
          currentVersion.id,
          true,
        );

      setResult(comparison);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate AI analysis.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAskQuestion() {
    const trimmedQuestion =
      question.trim();

    if (!trimmedQuestion) {
      setQuestionError(
        'Enter a question first.',
      );
      return;
    }

    if (
      trimmedQuestion.length > 2000
    ) {
      setQuestionError(
        'Keep the question under 2000 characters.',
      );
      return;
    }

    try {
      setQuestionLoading(true);
      setQuestionError('');
      setQuestionResult(null);

      const response =
        await apiClient.post(
          `/projects/${projectId}/versions/ask-ai`,
          {
            version_1:
              compareVersionId ??
              currentVersion.id,

            version_2:
              currentVersion.id,

            question:
              trimmedQuestion,
          },
        );

      const payload =
        response.data as AIProjectQuestionResponse;

      setQuestionResult(
        payload,
      );
    } catch (err) {
      setQuestionError(
        err instanceof Error
          ? err.message
          : 'Unable to ask DATAGIT AI.',
      );
    } finally {
      setQuestionLoading(false);
    }
  }

  function handleQuestionKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === 'Enter' &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();

      void handleAskQuestion();
    }
  }

  function handleSuggestedQuestion(
    value: string,
  ) {
    setQuestion(value);
    setQuestionError('');
  }

  const ai =
    result?.ai_insights ?? null;

  const rootCause =
    ai?.root_cause ?? null;

  const contributors =
    rootCause?.contributors ?? [];

  const limitations =
    rootCause?.limitations ?? [];

  const recommendations =
    ai?.recommendations ?? [];

  return (
    <section className="ai-report-panel">
      <div className="ai-report-header">
        <div>
          <div className="ai-report-kicker">
            DATAGIT / EVIDENCE-GROUNDED AI
          </div>

          <h2 className="ai-report-title">
            AI Interpretation
          </h2>

          <p className="ai-report-subtitle">
            Ask about the selected version,
            compare it with another version,
            or investigate the recorded project
            evidence.
          </p>
        </div>
      </div>

      {/* ================================================== */}
      {/* VERSION CONTEXT                                   */}
      {/* ================================================== */}

      <div className="ai-report-context">
        <div className="ai-report-context-item">
          <span>CURRENT VERSION</span>

          <strong>
            V{currentVersion.version_number}
          </strong>
        </div>

        <div className="ai-report-context-arrow">
          →
        </div>

        <div className="ai-report-context-item">
          <span>REFERENCE VERSION</span>

          <select
            value={
              compareVersionId ?? ''
            }
            onChange={(event) => {
              const value =
                Number(event.target.value);

              setCompareVersionId(
                Number.isFinite(value)
                  ? value
                  : null,
              );

              setResult(null);
            }}
            disabled={
              projectVersions.length <= 1 ||
              loading ||
              questionLoading
            }
          >
            <option value="">
              No reference version
            </option>

            {projectVersions
              .filter(
                (version) =>
                  version.id !==
                  currentVersion.id,
              )
              .map((version) => (
                <option
                  key={version.id}
                  value={version.id}
                >
                  V{version.version_number}
                </option>
              ))}
          </select>
        </div>

        <div className="ai-report-context-item">
          <span>PROJECT VERSIONS</span>

          <strong>
            {projectVersions.length}
          </strong>
        </div>
      </div>

      {/* ================================================== */}
      {/* COMPARISON AI                                     */}
      {/* ================================================== */}

      <div className="ai-report-block">
        <div className="ai-report-block-heading">
          <div>
            <span>
              CURRENT COMPARISON
            </span>

            <strong>
              {selectedCompareVersion
                ? `${versionLabel(
                    selectedCompareVersion,
                  )} → V${currentVersion.version_number}`
                : `V${currentVersion.version_number}`}
            </strong>
          </div>

          <button
            type="button"
            className="ai-report-button"
            onClick={handleAnalyze}
            disabled={
              loading ||
              questionLoading ||
              compareVersionId === null
            }
          >
            {loading
              ? 'ANALYZING...'
              : 'RUN AI ANALYSIS'}
          </button>
        </div>

        {error ? (
          <div className="ai-report-error">
            <strong>AI ERROR</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {result && ai ? (
          <div className="ai-report-result">
            <div className="ai-report-status">
              <span>
                {ai.status ===
                'success'
                  ? '✓'
                  : '!'}
              </span>

              <strong>
                {ai.status ===
                'success'
                  ? 'AI ANALYSIS COMPLETE'
                  : 'AI ANALYSIS UNAVAILABLE'}
              </strong>

              <span>
                Confidence:{' '}
                {rootCause?.overall_confidence ??
                  'low'}
              </span>
            </div>

            <section className="ai-report-section">
              <h3>INTERPRETATION</h3>

              <p>
                {rootCause?.summary ||
                  'No AI interpretation was returned.'}
              </p>
            </section>

            <section className="ai-report-section">
              <h3>LIKELY CONTRIBUTORS</h3>

              {contributors.length ===
              0 ? (
                <p className="ai-report-muted">
                  No contributors were
                  identified from the
                  recorded evidence.
                </p>
              ) : (
                <div className="ai-report-list">
                  {contributors.map(
                    (
                      contributor,
                      index,
                    ) => (
                      <div
                        key={`${contributor.factor}-${index}`}
                        className="ai-report-card"
                      >
                        <strong>
                          {
                            contributor.factor
                          }
                        </strong>

                        <p>
                          {
                            contributor.reasoning
                          }
                        </p>

                        <div className="ai-report-meta">
                          Confidence:{' '}
                          {
                            contributor.confidence
                          }
                        </div>

                        {contributor
                          .evidence
                          ?.length >
                        0 ? (
                          <div className="ai-report-evidence">
                            Evidence:{' '}
                            {contributor.evidence.join(
                              ', ',
                            )}
                          </div>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>

            <section className="ai-report-section">
              <h3>LIMITATIONS</h3>

              {limitations.length ===
              0 ? (
                <p className="ai-report-muted">
                  No additional limitations
                  were returned.
                </p>
              ) : (
                <ul>
                  {limitations.map(
                    (
                      item,
                      index,
                    ) => (
                      <li key={index}>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              )}
            </section>

            <section className="ai-report-section">
              <h3>RECOMMENDATIONS</h3>

              {recommendations.length ===
              0 ? (
                <p className="ai-report-muted">
                  No recommendations were
                  returned.
                </p>
              ) : (
                <div className="ai-report-list">
                  {recommendations.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item.recommendation}-${index}`}
                        className="ai-report-card"
                      >
                        <strong>
                          {
                            item.recommendation
                          }
                        </strong>

                        <p>
                          {item.reason}
                        </p>

                        <div className="ai-report-meta">
                          Priority:{' '}
                          {item.priority}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>

      {/* ================================================== */}
      {/* CUSTOM PROJECT QUESTION                            */}
      {/* ================================================== */}

      <div className="ai-report-block ai-report-question-block">
        <div className="ai-report-question-heading">
          <div>
            <span>
              ASK ANY PROJECT QUESTION
            </span>

            <strong>
              V{currentVersion.version_number}
              {selectedCompareVersion
                ? ` with ${versionLabel(
                    selectedCompareVersion,
                  )} as reference`
                : ''}
            </strong>
          </div>
        </div>

        <div className="ai-report-question-help">
          Ask about this version, its dataset,
          model, metrics such as accuracy,
          precision, recall or F1-score, Git,
          DVC, provenance, evidence gaps, or
          its relationship to another project
          version.
        </div>

        <div className="ai-report-suggestions">
          {SUGGESTED_QUESTIONS.map(
            (item) => (
              <button
                type="button"
                key={item}
                className="ai-report-suggestion"
                onClick={() =>
                  handleSuggestedQuestion(
                    item,
                  )
                }
                disabled={
                  questionLoading
                }
              >
                {item}
              </button>
            ),
          )}
        </div>

        <textarea
          className="ai-report-question-input"
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value,
            )
          }
          onKeyDown={
            handleQuestionKeyDown
          }
          placeholder="Ask anything about this version, its datasets, models, metrics such as accuracy, precision, recall, F1-score, preparation, Git, DVC, provenance, or comparison..."
          disabled={
            questionLoading
          }
          rows={6}
        />

        <div className="ai-report-question-footer">
          <span>
            Ctrl+Enter to ask. Questions are
            grounded in the recorded project
            context.
          </span>

          <button
            type="button"
            className="ai-report-button"
            onClick={
              handleAskQuestion
            }
            disabled={
              questionLoading ||
              !question.trim()
            }
          >
            {questionLoading
              ? 'ASKING...'
              : 'ASK DATAGIT AI'}
          </button>
        </div>

        {questionError ? (
          <div className="ai-report-error">
            <strong>AI ERROR</strong>
            <span>
              {questionError}
            </span>
          </div>
        ) : null}

        {questionResult ? (
          <div className="ai-report-question-result">
            <div className="ai-report-status">
              <span>
                {questionResult.status ===
                'success'
                  ? '✓'
                  : '!'}
              </span>

              <strong>
                AI ANSWER
              </strong>

              <span>
                Confidence:{' '}
                {questionResult
                  .confidence ??
                  'low'}
              </span>
            </div>

            <section className="ai-report-section">
              <h3>ANSWER</h3>

              <p>
                {questionResult.answer ||
                  'DATAGIT AI did not return an answer.'}
              </p>
            </section>

            {Array.isArray(
              questionResult.evidence,
            ) &&
            questionResult.evidence.length >
              0 ? (
              <section className="ai-report-section">
                <h3>EVIDENCE</h3>

                <ul>
                  {questionResult.evidence.map(
                    (
                      item,
                      index,
                    ) => (
                      <li key={index}>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </section>
            ) : null}

            {Array.isArray(
              questionResult.limitations,
            ) &&
            questionResult.limitations.length >
              0 ? (
              <section className="ai-report-section">
                <h3>LIMITATIONS</h3>

                <ul>
                  {questionResult.limitations.map(
                    (
                      item,
                      index,
                    ) => (
                      <li key={index}>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}