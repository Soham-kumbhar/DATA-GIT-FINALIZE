import { useMemo, useRef, useState } from 'react';
import type { ReportVersionDetail } from '../types/report';
import './AIInterpretationPanel.css';

interface Props {
  projectId: number;
  version: ReportVersionDetail;
}

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function text(value: unknown, fallback = '—'): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => text(item, ''))
    .filter(Boolean);
}

function findText(payload: RecordValue, keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

const SUGGESTED_QUESTIONS = [
  'Explain this version in simple words using only the recorded evidence.',
  'What is the most important thing that changed in this version?',
  'What model evidence, metrics, and evaluation evidence are recorded?',
  'What evidence is missing and how does that limit the conclusion?',
  'Can this version be reproduced from the recorded evidence?',
];

export default function AIInterpretationPanel({
  projectId,
  version,
}: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<RecordValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const evidence = version.result_evidence ?? null;

  const hasModel = Boolean(
    evidence?.model &&
      Object.keys(record(evidence.model)).length,
  );

  const hasMetrics = Boolean(
    evidence?.metrics &&
      Object.keys(record(evidence.metrics)).length,
  );

  const hasEvaluation = Boolean(
    evidence?.evaluation &&
      Object.keys(record(evidence.evaluation)).length,
  );

  const context = useMemo(() => {
    return [
      `Answer about DATAGIT version ${version.version_number}.`,
      'Use only the recorded deterministic evidence for this exact version.',
      'Do not use evidence from other versions.',
      'Do not invent model training steps.',
      'Do not invent performance results.',
      'Do not infer causality.',
      'Clearly identify evidence that is not recorded.',
    ].join(' ');
  }, [version.version_number]);

  async function askAI(nextQuestion = question) {
    const trimmedQuestion = nextQuestion.trim();

    if (!trimmedQuestion) {
      return;
    }

    setLoading(true);
    setError('');
    setAnswer(null);

    try {
      const base =
        import.meta.env.VITE_API_BASE_URL ||
        'http://127.0.0.1:8000';

      const response = await fetch(
        `${base}/projects/${projectId}/versions/ask-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: `${context}\n\nUser question:\n${trimmedQuestion}`,
          }),
        },
      );

      const payload = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          text(
            record(payload).detail,
            `AI request failed (${response.status}).`,
          ),
        );
      }

      setAnswer(record(payload));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach DATAGIT AI.',
      );
    } finally {
      setLoading(false);
    }
  }

  function selectSuggestion(value: string) {
    setQuestion(value);
    setError('');

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        value.length,
        value.length,
      );
    });
  }

  const answerText = answer
    ? findText(answer, [
        'answer',
        'summary',
        'response',
        'text',
        'message',
      ])
    : '';

  const facts = answer
    ? asStringArray(
        answer.facts ??
          answer.evidence ??
          answer.observations,
      )
    : [];

  const limitations = answer
    ? asStringArray(
        answer.limitations ??
          answer.insufficient_evidence,
      )
    : [];

  const recommendations = answer
    ? asStringArray(answer.recommendations)
    : [];

  const confidence = answer
    ? findText(answer, ['confidence'])
    : '';

  return (
    <div className="datagit-ai">
      <section className="datagit-ai-shell">
        <header className="datagit-ai-head">
          <div className="datagit-ai-title">
            <span className="datagit-ai-eyebrow">
              AI ASSIST
            </span>

            <h4>
              Ask about version {version.version_number}
            </h4>

            <p>
              Evidence-grounded answers from the recorded
              deterministic evidence for this exact version.
            </p>
          </div>

          <span className="datagit-ai-source-lock">
            <span className="datagit-ai-source-dot" />
            SOURCE LOCKED
          </span>
        </header>

        <div className="datagit-ai-evidence-row">
          <span>
            <b>DATASET</b>
            RECORDED
          </span>

          <span>
            <b>MODEL</b>
            {hasModel ? 'RECORDED' : 'NOT RECORDED'}
          </span>

          <span>
            <b>METRICS</b>
            {hasMetrics ? 'RECORDED' : 'NOT RECORDED'}
          </span>

          <span>
            <b>EVALUATION</b>
            {hasEvaluation
              ? 'RECORDED'
              : 'NOT RECORDED'}
          </span>
        </div>

        <div className="datagit-ai-body">
          <section className="datagit-ai-suggestions">
            <div className="datagit-ai-section-label">
              SUGGESTED QUESTIONS
            </div>

            <div className="datagit-ai-suggestions-list">
              {SUGGESTED_QUESTIONS.map((item, index) => {
                const active = question === item;

                return (
                  <button
                    type="button"
                    key={item}
                    className={
                      active
                        ? 'datagit-ai-suggestion is-active'
                        : 'datagit-ai-suggestion'
                    }
                    onClick={() =>
                      selectSuggestion(item)
                    }
                  >
                    <span className="datagit-ai-suggestion-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="datagit-ai-suggestion-text">
                      {item}
                    </span>

                    <span className="datagit-ai-suggestion-arrow">
                      ↗
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="datagit-ai-compose">
            <div className="datagit-ai-section-label">
              YOUR QUESTION
            </div>

            <textarea
              ref={textareaRef}
              id="datagit-ai-question"
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              rows={5}
              placeholder="Ask something about this version..."
            />

            <div className="datagit-ai-compose-footer">
              <div className="datagit-ai-compose-note">
                <span className="datagit-ai-lock-symbol">
                  ⌁
                </span>

                <span>
                  Source locked to version{' '}
                  {version.version_number} deterministic
                  evidence.
                </span>
              </div>

              <button
                type="button"
                className="datagit-ai-ask-button"
                onClick={() => void askAI()}
                disabled={
                  loading || !question.trim()
                }
              >
                {loading ? 'THINKING…' : 'ASK AI'}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </section>

          {error ? (
            <section className="datagit-ai-feedback datagit-ai-error">
              <span className="datagit-ai-feedback-label">
                AI UNAVAILABLE
              </span>

              <p>{error}</p>
            </section>
          ) : null}

          {answer ? (
            <section className="datagit-ai-answer">
              <header className="datagit-ai-answer-head">
                <div>
                  <span className="datagit-ai-eyebrow">
                    DATAGIT AI
                  </span>

                  <strong>
                    Evidence-grounded interpretation
                  </strong>
                </div>

                {confidence ? (
                  <span className="datagit-ai-confidence">
                    CONFIDENCE · {confidence}
                  </span>
                ) : null}
              </header>

              {answerText ? (
                <div className="datagit-ai-answer-main">
                  {answerText}
                </div>
              ) : null}

              {facts.length ? (
                <div className="datagit-ai-answer-block">
                  <span>FACTS / EVIDENCE</span>

                  {facts.map((item, index) => (
                    <p key={`${item}-${index}`}>
                      {item}
                    </p>
                  ))}
                </div>
              ) : null}

              {limitations.length ? (
                <div className="datagit-ai-answer-block is-muted">
                  <span>LIMITATIONS</span>

                  {limitations.map(
                    (item, index) => (
                      <p key={`${item}-${index}`}>
                        {item}
                      </p>
                    ),
                  )}
                </div>
              ) : null}

              {recommendations.length ? (
                <div className="datagit-ai-answer-block">
                  <span>NEXT STEPS</span>

                  {recommendations.map(
                    (item, index) => (
                      <p key={`${item}-${index}`}>
                        {item}
                      </p>
                    ),
                  )}
                </div>
              ) : null}
            </section>
          ) : (
            <section className="datagit-ai-empty">
              <span className="datagit-ai-empty-mark">
                ✦
              </span>

              <div>
                <strong>
                  Ask DATAGIT AI about this version
                </strong>

                <p>
                  Start with a suggested question or write
                  your own question below. Answers remain
                  constrained to the recorded evidence.
                </p>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}