import type { ReportVersionDetail } from '../types/report';

type RecordValue = Record<string, unknown>;

export interface NormalizedDataset {
  path: string;
  absolutePath: string;
  exists: string;
  rowCount: string;
  columnCount: string;
  format: string;
  size: string;
  missingValues: string;
  duplicateRows: string;
  columns: string[];
}

export interface NormalizedDvc {
  hash: string;
  file: string;
  dataPath: string;
  state: string;
  raw: RecordValue;
}

export interface NormalizedGit {
  commit: string;
  author: string;
  committedAt: string;
  message: string;
  branch: string;
  dirty: string;
  changedFiles: Array<{ path: string; status: string }>;
}

export interface NormalizedModel {
  name: string;
  path: string;
  details: Record<string, string>;
}

export interface NormalizedReport {
  status: 'FINALIZED' | 'PARTIAL' | 'RECORDED';
  datasetCount: number;
  modelCount: number;
  preparationCount: number;
  changedFileCount: number;
  mlRunRecorded: boolean;
  dataset: NormalizedDataset;
  dvc: NormalizedDvc;
  git: NormalizedGit;
  preparation: Array<{
    operation: string;
    description: string;
  }>;
  models: NormalizedModel[];
  training: Array<{ label: string; value: string }>;
  performance: Array<{ label: string; value: string }>;
  evaluation: Array<{ label: string; value: string }>;
  lineageRecorded: boolean;
  evidence: Array<{
    label: string;
    value: string;
    tone: 'positive' | 'neutral';
  }>;
}

function record(value: unknown): RecordValue {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value as RecordValue;
  }

  return {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function valueAt(
  root: unknown,
  path: string,
): unknown {
  let current: unknown = root;

  for (const key of path.split('.')) {
    if (
      !current ||
      typeof current !== 'object'
    ) {
      return undefined;
    }

    current = (
      current as RecordValue
    )[key];
  }

  return current;
}

function first(
  root: unknown,
  paths: string[],
): unknown {
  for (const path of paths) {
    const value = valueAt(
      root,
      path,
    );

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return undefined;
}

function firstRecord(
  root: unknown,
  paths: string[],
): RecordValue {
  return record(
    first(root, paths),
  );
}

function text(
  value: unknown,
  fallback = '—',
): string {
  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    return value.trim();
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  return fallback;
}

function numberText(
  value: unknown,
  fallback = '—',
): string {
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? String(value)
      : value
          .toFixed(4)
          .replace(/0+$/, '')
          .replace(/\.$/, '');
  }

  return text(
    value,
    fallback,
  );
}

function normalizePath(
  value: unknown,
): string {
  return text(
    value,
    '—',
  ).replaceAll(
    '\\',
    '/',
  );
}

function toPairs(
  value: unknown,
): Array<[string, string]> {
  return Object.entries(
    record(value),
  )
    .map(
      ([
        key,
        raw,
      ]) =>
        [
          key
            .replaceAll(
              '_',
              ' ',
            )
            .replace(
              /\b\w/g,
              (match) =>
                match.toUpperCase(),
            ),
          text(raw),
        ] as [
          string,
          string,
        ],
    )
    .filter(
      ([, raw]) =>
        raw !== '—',
    );
}

function toLabels(
  value: unknown,
): Array<{
  label: string;
  value: string;
}> {
  return toPairs(value).map(
    ([
      label,
      value,
    ]) => ({
      label,
      value,
    }),
  );
}

function hasAnyKeys(
  value: RecordValue,
  keys: string[],
): boolean {
  return keys.some(
    (key) => {
      const item =
        value[key];

      return (
        item !==
          undefined &&
        item !== null &&
        item !== ''
      );
    },
  );
}

function isNotRecordedStatus(
  value: unknown,
): boolean {
  const normalized = text(
    value,
    '',
  )
    .toLowerCase()
    .replaceAll(
      '_',
      ' ',
    )
    .replace(
      /-/g,
      ' ',
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim();

  return [
    'not recorded',
    'not linked',
    'not available',
    'unavailable',
    'not assessable',
  ].includes(normalized);
}

function normalizeDvcState(
  root: RecordValue,
): {
  state: RecordValue;
  trackedFile: RecordValue;
} {
  const state = {
    ...record(
      first(
        root,
        ['dvc_state'],
      ),
    ),
    ...firstRecord(
      root,
      [
        'dvc',
        'dvc_metadata',
        'report.dvc',
        'report.dvc_metadata',
        'evidence.dvc',
      ],
    ),
  };

  const trackedFiles =
    array(
      first(
        state,
        [
          'tracked_files',
          'files',
          'tracked',
        ],
      ),
    )
      .map(record)
      .filter(
        (item) =>
          Object.keys(item)
            .length > 0,
      );

  const trackedFile =
    trackedFiles.find(
      (item) =>
        hasAnyKeys(
          item,
          [
            'md5',
            'hash',
            'checksum',
            'dvc_file',
            'data_path',
          ],
        ),
    ) ??
    trackedFiles[0] ??
    {};

  return {
    state,
    trackedFile,
  };
}

function modelCandidates(
  value: unknown,
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    return [value];
  }

  const object = record(value);

  if (
    Object.keys(object).length === 0
  ) {
    return [];
  }

  const nestedKeys = [
    'models',
    'items',
    'entries',
    'registry',
    'model_registry',
  ];

  for (const key of nestedKeys) {
    const nested =
      object[key];

    if (
      nested !==
      undefined
    ) {
      const candidates =
        modelCandidates(
          nested,
        );

      if (
        candidates.length >
        0
      ) {
        return candidates;
      }
    }
  }

  if (
    hasAnyKeys(
      object,
      [
        'name',
        'model_name',
        'type',
        'path',
        'artifact',
        'artifact_path',
      ],
    )
  ) {
    return [object];
  }

  const entries =
    Object.entries(
      object,
    );

  if (
    entries.length ===
    1
  ) {
    const [
      key,
      nested,
    ] = entries[0];

    if (
      typeof nested ===
        'object' &&
      nested !== null &&
      !Array.isArray(
        nested,
      )
    ) {
      const nestedRecord =
        {
          ...record(
            nested,
          ),
        };

      if (
        !hasAnyKeys(
          nestedRecord,
          [
            'name',
            'model_name',
          ],
        )
      ) {
        nestedRecord.name =
          key;
      }

      return [
        nestedRecord,
      ];
    }

    if (
      typeof nested ===
      'string'
    ) {
      return [
        {
          name: key,
          path: nested,
        },
      ];
    }
  }

  return [];
}

function getModelCandidates(
  root: RecordValue,
): unknown[] {
  const direct =
    first(
      root,
      [
        'models',
        'model_registry',
        'report.models',
        'report.model_registry',
        'evidence.models',
        'evidence.model_registry',
        'model',
        'report.model',
        'evidence.model',
      ],
    );

  const candidates =
    modelCandidates(
      direct,
    );

  if (
    candidates.length >
    0
  ) {
    return candidates;
  }

  const fallbackModelName =
    first(
      root,
      [
        'model_name',
        'registered_model_name',
        'report.model_name',
        'evidence.model_name',
      ],
    );

  return fallbackModelName
    ? [
        {
          name:
            fallbackModelName,
        },
      ]
    : [];
}

function changedFileEntries(
  root: RecordValue,
): Array<{
  path: string;
  status: string;
}> {
  const raw =
    first(
      root,
      [
        'git.changed_files',
        'changed_files',
        'provenance.changed_files',
        'report.git.changed_files',
        'report.changed_files',
        'evidence.git.changed_files',
      ],
    );

  return array(raw)
    .map((item) => {
      if (
        typeof item ===
        'string'
      ) {
        return {
          path:
            normalizePath(
              item,
            ),
          status:
            'MODIFIED',
        };
      }

      const entry =
        record(item);

      return {
        path:
          normalizePath(
            first(
              entry,
              [
                'path',
                'name',
                'file',
              ],
            ),
          ),
        status:
          text(
            first(
              entry,
              [
                'status',
                'change_type',
              ],
            ),
            'MODIFIED',
          ),
      };
    })
    .filter(
      (item) =>
        item.path !== '—',
    );
}

function normalizeEvidence(
  root: RecordValue,
  input: {
    datasetAvailable: boolean;
    dvcAvailable: boolean;
    gitAvailable: boolean;
    preparationAvailable: boolean;
    modelAvailable: boolean;
    runAvailable: boolean;
    performanceAvailable: boolean;
    evaluationAvailable: boolean;
  },
): Array<{
  label: string;
  value: string;
  tone: 'positive' | 'neutral';
}> {
  const explicit =
    first(
      root,
      [
        'evidence_completeness',
        'evidence',
        'report.evidence_completeness',
      ],
    );

  if (
    explicit &&
    typeof explicit ===
      'object' &&
    !Array.isArray(
      explicit,
    )
  ) {
    return toLabels(
      explicit,
    ).map(
      ({
        label,
        value,
      }) => ({
        label,
        value,
        tone:
          /not|missing|unavailable|assessable/i.test(
            value,
          )
            ? 'neutral'
            : 'positive',
      }),
    );
  }

  const rows: Array<
    [string, string]
  > = [
    [
      'DATASET',
      input.datasetAvailable
        ? 'AVAILABLE'
        : 'NOT RECORDED',
    ],
    [
      'DVC',
      input.dvcAvailable
        ? 'AVAILABLE'
        : 'NOT RECORDED',
    ],
    [
      'GIT',
      input.gitAvailable
        ? 'AVAILABLE'
        : 'NOT RECORDED',
    ],
    [
      'PREPARATION',
      input.preparationAvailable
        ? 'RECORDED'
        : 'NOT RECORDED',
    ],
    [
      'MODEL',
      input.modelAvailable
        ? 'AVAILABLE'
        : 'NOT RECORDED',
    ],
    [
      'TRAINING RUN',
      input.runAvailable
        ? 'RECORDED'
        : 'NOT RECORDED',
    ],
    [
      'PERFORMANCE',
      input.performanceAvailable
        ? 'RECORDED'
        : 'NOT ASSESSABLE',
    ],
    [
      'EVALUATION',
      input.evaluationAvailable
        ? 'RECORDED'
        : 'NOT ASSESSABLE',
    ],
  ];

  return rows.map(
    ([
      label,
      value,
    ]) => ({
      label,
      value,
      tone:
        /not|missing|unavailable|assessable/i.test(
          value,
        )
          ? 'neutral'
          : 'positive',
    }),
  );
}

export function normalizeVersionReport(
  version: ReportVersionDetail,
): NormalizedReport {
  const root =
    record(version);

  const versionPayload =
    firstRecord(
      root,
      [
        'report.version',
        'version',
      ],
    );

  const evidenceRoot =
    firstRecord(
      root,
      [
        'report.evidence',
        'evidence',
      ],
    );

  const dataset = {
    ...firstRecord(
      root,
      [
        'dataset',
        'dataset_profile',
        'report.dataset',
        'report.dataset_profile',
        'evidence.dataset',
        'datasets.0',
      ],
    ),
    ...firstRecord(
      evidenceRoot,
      [
        'dataset',
        'dataset_profile',
      ],
    ),
  };

  const datasetCollection =
    array(
      first(
        root,
        [
          'datasets',
          'dataset_evidence',
          'data',
          'report.datasets',
          'report.dataset_evidence',
          'evidence.datasets',
        ],
      ),
    );

  const datasetCount =
    datasetCollection.length ||
    (
      Object.keys(
        dataset,
      ).length
        ? 1
        : 0
    );

  const {
    state: dvcState,
    trackedFile,
  } =
    normalizeDvcState(
      root,
    );

  const git =
    firstRecord(
      root,
      [
        'git',
        'git_metadata',
        'report.git',
        'report.git_metadata',
        'evidence.git',
      ],
    );

  const gitCommit =
    text(
      first(
        root,
        [
          'git_commit',
          'report.git_commit',
        ],
      ) ??
        first(
          versionPayload,
          [
            'git_commit',
          ],
        ) ??
        first(
          git,
          [
            'commit',
            'sha',
            'commit_hash',
          ],
        ),
    );

  const dvcHash =
    text(
      first(
        trackedFile,
        [
          'md5',
          'hash',
          'checksum',
        ],
      ) ??
        first(
          dvcState,
          [
            'md5',
            'hash',
            'checksum',
          ],
        ),
    );

  const dvcFile =
    normalizePath(
      first(
        trackedFile,
        [
          'dvc_file',
          'file',
        ],
      ) ??
        first(
          dvcState,
          [
            'dvc_file',
            'file',
          ],
        ),
    );

  const dvcDataPath =
    normalizePath(
      first(
        trackedFile,
        [
          'data_path',
        ],
      ) ??
        first(
          dvcState,
          [
            'data_path',
          ],
        ),
    );

  const dvcTrackedPath =
    (() => {
      if (
        dvcDataPath !==
        '—'
      ) {
        const slash =
          dvcFile.lastIndexOf(
            '/',
          );

        if (
          slash >= 0 &&
          !dvcDataPath.includes(
            '/',
          )
        ) {
          return `${dvcFile.slice(
            0,
            slash,
          )}/${dvcDataPath}`;
        }

        return dvcDataPath;
      }

      if (
        dvcFile !==
        '—'
      ) {
        return dvcFile.replace(
          /\.dvc$/i,
          '',
        );
      }

      return normalizePath(
        first(
          dataset,
          [
            'path',
            'file_path',
            'name',
          ],
        ),
      );
    })();

  const absoluteDatasetPath =
    normalizePath(
      first(
        dataset,
        [
          'absolute_path',
          'full_path',
          'path_absolute',
          'resolved_path',
        ],
      ),
    );

  const finalDatasetPath =
    dvcTrackedPath !==
    '—'
      ? dvcTrackedPath
      : normalizePath(
          first(
            dataset,
            [
              'path',
              'file_path',
              'name',
            ],
          ),
        );

  const datasetColumns =
    array(
      first(
        dataset,
        [
          'columns',
          'column_names',
        ],
      ),
    )
      .map(
        (column) => {
          if (
            typeof column ===
            'string'
          ) {
            return column;
          }

          return text(
            first(
              record(column),
              [
                'name',
                'column',
              ],
            ),
          );
        },
      )
      .filter(
        (column) =>
          column !== '—',
      );

  const changedFiles =
    changedFileEntries(
      root,
    );

  const preparation =
    array(
      first(
        root,
        [
          'preparation.operations',
          'preparation_evidence.operations',
          'preparation_operations',
          'report.preparation.operations',
          'report.preparation_evidence.operations',
          'evidence.preparation.operations',
        ],
      ),
    ).map(
      (item) => {
        const operation =
          record(item);

        return {
          operation:
            text(
              first(
                operation,
                [
                  'operation',
                  'name',
                ],
              ),
              'Preparation operation',
            ),
          description:
            text(
              first(
                operation,
                [
                  'description',
                  'reason',
                ],
              ),
              'Operation recorded without additional description.',
            ),
        };
      },
    );

  const models =
    getModelCandidates(
      root,
    ).map(
      (item) => {
        const model =
          typeof item ===
          'string'
            ? {
                name: item,
              }
            : record(item);

        return {
          name:
            text(
              first(
                model,
                [
                  'name',
                  'model_name',
                  'registered_model_name',
                  'type',
                ],
              ),
              'Model',
            ),
          path:
            normalizePath(
              first(
                model,
                [
                  'path',
                  'artifact_path',
                  'artifact',
                ],
              ),
            ),
          details:
            Object.fromEntries(
              toPairs(model),
            ),
        };
      },
    );

  const modelCount =
    models.length;

  const mlRun =
    first(
      root,
      [
        'ml_run',
        'run',
        'report.ml_run',
        'evidence.ml_run',
      ],
    );

  const training =
    first(
      root,
      [
        'training',
        'report.training',
        'evidence.training',
      ],
    );

  const trainingRecord =
    record(training);

  const mlRunRecord =
    record(mlRun);

  const actualRunRecord =
    Object.keys(
      mlRunRecord,
    ).length > 0
      ? mlRunRecord
      : !isNotRecordedStatus(
            first(
              trainingRecord,
              [
                'status',
              ],
            ),
          )
        ? trainingRecord
        : {};

  const metrics =
    first(
      root,
      [
        'performance.metrics',
        'metrics',
        'ml_run.metrics',
        'report.performance.metrics',
        'report.metrics',
        'training.metrics',
      ],
    );

  const evaluation =
    first(
      root,
      [
        'evaluation',
        'ml_run.evaluation',
        'report.evaluation',
        'training.evaluation',
      ],
    );

  const explicitTrainingStatus =
    text(
      first(
        trainingRecord,
        [
          'status',
        ],
      ),
      '',
    );

  const mlRunIdPresent =
    version.ml_run_id !==
      null &&
    version.ml_run_id !==
      undefined;

  const mlRunRecorded =
    mlRunIdPresent &&
    !isNotRecordedStatus(
      explicitTrainingStatus,
    )
      ? true
      : Object.keys(
          mlRunRecord,
        ).length > 0;

  const runAvailable =
    mlRunRecorded ||
    Object.keys(
      actualRunRecord,
    ).length > 0;

  const performanceAvailable =
    Object.keys(
      record(metrics),
    ).length > 0;

  const evaluationAvailable =
    Object.keys(
      record(evaluation),
    ).length > 0;

  const gitAuthor =
    text(
      first(
        git,
        [
          'author',
          'author_name',
        ],
      ),
    );

  const gitCommittedAt =
    text(
      first(
        git,
        [
          'committed_at',
          'commit_time',
          'date',
        ],
      ),
    );

  const gitMessage =
    text(
      first(
        git,
        [
          'message',
          'commit_message',
        ],
      ),
    );

  const evidence =
    normalizeEvidence(
      root,
      {
        datasetAvailable:
          datasetCount > 0,

        dvcAvailable:
          dvcHash !==
          '—',

        gitAvailable:
          gitCommit !==
          '—',

        preparationAvailable:
          preparation.length >
          0,

        modelAvailable:
          modelCount >
          0,

        runAvailable,

        performanceAvailable,

        evaluationAvailable,
      },
    );

  const lineageRecorded =
    Boolean(
      first(
        root,
        [
          'lineage',
          'provenance.lineage',
          'report.lineage',
          'evidence.lineage',
        ],
      ) ||
        datasetCount ||
        dvcHash !==
          '—' ||
        gitCommit !==
          '—',
    );

  return {
    status:
      gitCommit !==
        '—' &&
      dvcHash !==
        '—'
        ? 'FINALIZED'
        : gitCommit !==
              '—' ||
            dvcHash !==
              '—'
          ? 'PARTIAL'
          : 'RECORDED',

    datasetCount,

    modelCount,

    preparationCount:
      preparation.length,

    changedFileCount:
      changedFiles.length,

    mlRunRecorded,

    dataset: {
      path:
        finalDatasetPath,

      absolutePath:
        absoluteDatasetPath,

      exists:
        text(
          first(
            dataset,
            [
              'exists',
              'file_exists',
            ],
          ),
          'NOT RECORDED',
        ),

      rowCount:
        numberText(
          first(
            dataset,
            [
              'row_count',
              'rows',
              'record_count',
            ],
          ),
        ),

      columnCount:
        numberText(
          first(
            dataset,
            [
              'column_count',
              'columns_count',
              'field_count',
            ],
          ),
        ),

      format:
        text(
          first(
            dataset,
            [
              'format',
              'file_format',
            ],
          ),
        ),

      size:
        numberText(
          first(
            dataset,
            [
              'size_bytes',
              'size',
            ],
          ),
        ),

      missingValues:
        numberText(
          first(
            dataset,
            [
              'missing_values',
              'missing_count',
            ],
          ),
        ),

      duplicateRows:
        numberText(
          first(
            dataset,
            [
              'duplicate_rows',
              'duplicates',
            ],
          ),
        ),

      columns:
        datasetColumns,
    },

    dvc: {
      hash:
        dvcHash,

      file:
        dvcFile,

      dataPath:
        finalDatasetPath,

      state:
        dvcHash !==
          '—'
          ? 'TRACKED STATE RECORDED'
          : Object.keys(
                dvcState,
              ).length > 0
            ? 'DVC STATE RECORDED'
            : 'NOT RECORDED',

      raw:
        dvcState,
    },

    git: {
      commit:
        gitCommit,

      author:
        gitAuthor,

      committedAt:
        gitCommittedAt,

      message:
        gitMessage,

      branch:
        text(
          first(
            git,
            ['branch'],
          ),
        ),

      dirty:
        text(
          first(
            git,
            [
              'dirty',
              'working_tree_dirty',
            ],
          ),
        ),

      changedFiles:
        changedFiles,
    },

    preparation,

    models,

    training:
      toLabels(
        actualRunRecord,
      ),

    performance:
      toLabels(
        metrics,
      ),

    evaluation:
      toLabels(
        evaluation,
      ),

    lineageRecorded,

    evidence,
  };
}