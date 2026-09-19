import {
  useMemo,
  useState,
} from 'react';

import type {
  KeyboardEvent,
} from 'react';

import {
  askDatagitAI,
  type AIQuestionResponse,
} from './compareApi';


interface AIExplanationPanelProps {
  projectId: number | null;

  versionAId: number | null;
  versionBId: number | null;

  versionANumber: number | null;
  versionBNumber: number | null;
}


const SUGGESTED_QUESTIONS = [
  'What changed between these versions?',

  'Why does the recorded evidence say the comparison is incomplete?',

  'What do the dataset changes mean?',

  'What model and metrics are recorded for this project?',

  'Should I retrain the model based on the recorded evidence?',

  'What evidence is missing before I can trust the result?',

  'Explain this project comparison in simple words.',

  'What should I investigate next?',
];


export default function AIExplanationPanel({
  projectId,
  versionAId,
  versionBId,
  versionANumber,
  versionBNumber,
}: AIExplanationPanelProps) {

  const [question, setQuestion] =
    useState('');

  const [response, setResponse] =
    useState<AIQuestionResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');


  const comparisonReady =
    projectId !== null
    &&
    versionAId !== null
    &&
    versionBId !== null
    &&
    versionANumber !== null
    &&
    versionBNumber !== null;


  const comparisonLabel =
    useMemo(
      () => {

        if (
          versionANumber === null
          ||
          versionBNumber === null
        ) {
          return 'SELECT TWO VERSIONS';
        }

        return (
          `V${versionANumber} → V${versionBNumber}`
        );
      },

      [
        versionANumber,
        versionBNumber,
      ],
    );


  async function ask(
    questionToAsk?: string,
  ) {

    const finalQuestion = (
      questionToAsk
      ??
      question
    ).trim();


    if (!finalQuestion) {
      return;
    }


    if (!comparisonReady) {

      setError(
        'Select two versions before asking DATAGIT AI about a comparison.',
      );

      return;
    }


    if (loading) {
      return;
    }


    setQuestion(
      finalQuestion,
    );

    setLoading(true);

    setError('');

    setResponse(null);


    try {

      const result =
        await askDatagitAI(
          projectId,
          versionAId,
          versionBId,
          finalQuestion,
        );


      setResponse(
        result,
      );

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


  function handleKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) {

    if (
      event.key === 'Enter'
      &&
      (
        event.ctrlKey
        ||
        event.metaKey
      )
    ) {

      event.preventDefault();

      void ask();
    }
  }


  return (
    <section
      style={{
        marginTop: 32,

        padding: 22,

        border:
          '1px solid rgba(255,255,255,0.14)',

        background: '#18191a',
      }}
    >

      <div
        style={{
          color: '#22c55e',

          fontSize: 12,

          letterSpacing: '0.14em',

          fontWeight: 700,
        }}
      >
        EVIDENCE-GROUNDED AI
      </div>


      <div
        style={{
          marginTop: 14,

          color: '#8d949b',

          fontSize: 11,

          letterSpacing: '0.12em',
        }}
      >
        CURRENT COMPARISON
      </div>


      <div
        style={{
          marginTop: 8,

          color: '#f2f2f2',

          fontSize: 18,
        }}
      >
        {comparisonLabel}
      </div>


      <div
        style={{
          marginTop: 22,

          color: '#8d949b',

          fontSize: 11,

          letterSpacing: '0.12em',
        }}
      >
        SUGGESTED QUESTIONS
      </div>


      <div
        style={{
          display: 'grid',

          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',

          gap: 10,

          marginTop: 10,
        }}
      >

        {SUGGESTED_QUESTIONS.map(
          (item) => (

            <button
              key={item}

              type="button"

              onClick={() =>
                void ask(item)
              }

              disabled={
                loading
                ||
                !comparisonReady
              }

              style={{
                padding:
                  '13px 14px',

                textAlign:
                  'left',

                color:
                  '#dfe3e7',

                background:
                  '#202122',

                border:
                  '1px solid rgba(255,255,255,0.12)',

                cursor:
                  loading
                  ||
                  !comparisonReady
                    ? 'not-allowed'
                    : 'pointer',

                fontSize: 12,

                lineHeight: 1.45,

                opacity:
                  loading
                  ||
                  !comparisonReady
                    ? 0.6
                    : 1,
              }}
            >
              {item}
            </button>
          ),
        )}

      </div>


      <div
        style={{
          marginTop: 22,

          color: '#8d949b',

          fontSize: 11,

          letterSpacing: '0.12em',
        }}
      >
        ASK ANY PROJECT QUESTION
      </div>


      <textarea
        value={question}

        onChange={(
          event,
        ) => {

          setQuestion(
            event.target.value,
          );

          if (error) {
            setError('');
          }
        }}

        onKeyDown={
          handleKeyDown
        }

        disabled={
          loading
          ||
          !comparisonReady
        }

        placeholder={
          comparisonReady
            ? 'Ask anything about this project, its datasets, versions, models, metrics, preparation, Git, DVC, or the comparison...'
            : 'Select two versions to start asking DATAGIT AI...'
        }

        rows={5}

        style={{
          width: '100%',

          marginTop: 10,

          padding: 14,

          boxSizing:
            'border-box',

          resize:
            'vertical',

          color:
            '#f1f1f1',

          background:
            '#151617',

          border:
            '1px solid rgba(255,255,255,0.15)',

          outline: 'none',

          fontFamily:
            'inherit',

          fontSize: 13,

          lineHeight: 1.55,

          opacity:
            comparisonReady
              ? 1
              : 0.7,
        }}
      />


      <div
        style={{
          marginTop: 8,

          display: 'flex',

          justifyContent:
            'space-between',

          alignItems:
            'center',

          gap: 16,
        }}
      >

        <span
          style={{
            color: '#666d73',

            fontSize: 11,
          }}
        >
          Ctrl+Enter to ask.
          Custom questions are
          fully supported.
        </span>


        <button
          type="button"

          onClick={() =>
            void ask()
          }

          disabled={
            !question.trim()
            ||
            loading
            ||
            !comparisonReady
          }

          style={{
            padding:
              '11px 18px',

            border: 'none',

            background:
              '#16c784',

            color:
              '#07110c',

            fontWeight: 800,

            letterSpacing:
              '0.1em',

            cursor:
              !question.trim()
              ||
              loading
              ||
              !comparisonReady
                ? 'not-allowed'
                : 'pointer',

            opacity:
              !question.trim()
              ||
              loading
              ||
              !comparisonReady
                ? 0.55
                : 1,
          }}
        >
          {
            loading
              ? 'THINKING...'
              : 'ASK DATAGIT AI'
          }
        </button>

      </div>


      {error ? (

        <div
          style={{
            marginTop: 16,

            padding: 14,

            border:
              '1px solid rgba(239,68,68,0.35)',

            color:
              '#fca5a5',

            background:
              'rgba(127,29,29,0.15)',

            fontSize: 12,

            lineHeight: 1.5,
          }}
        >
          {error}
        </div>

      ) : null}


      {response ? (

        <div
          style={{
            marginTop: 22,

            borderTop:
              '1px solid rgba(255,255,255,0.10)',

            paddingTop: 20,
          }}
        >

          <div
            style={{
              color: '#8d949b',

              fontSize: 11,

              letterSpacing:
                '0.12em',
            }}
          >
            ANSWER
          </div>


          <div
            style={{
              marginTop: 10,

              color: '#f3f4f6',

              fontSize: 14,

              lineHeight: 1.7,

              whiteSpace:
                'pre-wrap',
            }}
          >
            {response.answer}
          </div>


          <div
            style={{
              marginTop: 18,

              color: '#8d949b',

              fontSize: 11,

              letterSpacing:
                '0.12em',
            }}
          >
            CONFIDENCE
          </div>


          <div
            style={{
              marginTop: 7,

              color: '#22c55e',

              fontSize: 12,

              textTransform:
                'uppercase',

              fontWeight: 700,
            }}
          >
            {response.confidence}
          </div>


          {response.evidence.length > 0 ? (

            <div
              style={{
                marginTop: 18,
              }}
            >

              <div
                style={{
                  color: '#8d949b',

                  fontSize: 11,

                  letterSpacing:
                    '0.12em',
                }}
              >
                EVIDENCE
              </div>


              <div
                style={{
                  marginTop: 8,
                }}
              >

                {response.evidence.map(
                  (
                    item,
                    index,
                  ) => (

                    <div
                      key={`${item}-${index}`}

                      style={{
                        marginTop: 7,

                        color:
                          '#d5d9dc',

                        fontSize: 12,

                        lineHeight: 1.5,
                      }}
                    >
                      + {item}
                    </div>

                  ),
                )}

              </div>

            </div>

          ) : null}


          {response.limitations.length > 0 ? (

            <div
              style={{
                marginTop: 18,
              }}
            >

              <div
                style={{
                  color: '#8d949b',

                  fontSize: 11,

                  letterSpacing:
                    '0.12em',
                }}
              >
                LIMITATIONS
              </div>


              <div
                style={{
                  marginTop: 8,
                }}
              >

                {response.limitations.map(
                  (
                    item,
                    index,
                  ) => (

                    <div
                      key={`${item}-${index}`}

                      style={{
                        marginTop: 7,

                        color:
                          '#c8cdd1',

                        fontSize: 12,

                        lineHeight: 1.5,
                      }}
                    >
                      ! {item}
                    </div>

                  ),
                )}

              </div>

            </div>

          ) : null}

        </div>

      ) : null}

    </section>
  );
}