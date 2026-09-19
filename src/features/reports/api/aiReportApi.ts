import apiClient from '../../../api/client';

export interface AIContributor {
  factor: string;
  reason: string;
  evidence_ids: string[];
  strength: string;
}

export interface AIConfidence {
  level: string;
  reason: string;
}

export interface AIInvestigationResponse {
  answer: string;
  what_was_checked: string[];
  likely_contributors: AIContributor[];
  confidence: AIConfidence;
  insufficient_evidence: boolean;
  limitations: string[];
  rejected_claims: string[];
}

function asRecord(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asString(
  value: unknown,
  fallback = '',
): string {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : fallback;
}

function asStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeContributor(
  value: unknown,
): AIContributor {
  const item = asRecord(value);

  return {
    factor: asString(
      item.factor,
      'Unspecified factor',
    ),
    reason: asString(
      item.reason,
      'No explanation recorded.',
    ),
    evidence_ids: asStringArray(
      item.evidence_ids,
    ),
    strength: asString(
      item.strength,
      'UNSPECIFIED',
    ),
  };
}

function normalizeResponse(
  value: unknown,
): AIInvestigationResponse {
  const data = asRecord(value);
  const confidence = asRecord(
    data.confidence,
  );

  const answer = asString(data.answer);
  const whatWasChecked =
    asStringArray(
      data.what_was_checked,
    );

  if (
    !answer &&
    !whatWasChecked.length
  ) {
    throw new Error(
      'AI response did not contain a usable investigation result.',
    );
  }

  return {
    answer:
      answer ||
      'No AI interpretation was returned.',

    what_was_checked:
      whatWasChecked,

    likely_contributors:
      Array.isArray(
        data.likely_contributors,
      )
        ? data.likely_contributors.map(
            normalizeContributor,
          )
        : [],

    confidence: {
      level: asString(
        confidence.level,
        'UNKNOWN',
      ),
      reason: asString(
        confidence.reason,
        'No confidence explanation was returned.',
      ),
    },

    insufficient_evidence:
      data.insufficient_evidence ===
      true,

    limitations:
      asStringArray(
        data.limitations,
      ),

    rejected_claims:
      asStringArray(
        data.rejected_claims,
      ),
  };
}

function versionRef(
  versionNumber: number,
): string {
  return `V${String(
    versionNumber,
  ).padStart(2, '0')}`;
}

export async function investigateVersionPair(
  versionA: number,
  versionB: number,
  question: string,
): Promise<AIInvestigationResponse> {
  const trimmedQuestion =
    question.trim();

  if (!trimmedQuestion) {
    throw new Error(
      'Enter a question for the AI investigation.',
    );
  }

  const response =
    await apiClient.post(
      '/ai/investigate',
      {
        version_a:
          versionRef(versionA),

        version_b:
          versionRef(versionB),

        question:
          trimmedQuestion,
      },
    );

  return normalizeResponse(
    response.data,
  );
}