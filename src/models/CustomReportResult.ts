/** The outcome of `BugReporting.submitReport`. */
export type CustomReportStatus = 'queued' | 'notSent' | 'invalid';

/**
 * Why a report was not sent.
 *
 * - `'unavailable'`: the SDK isn't started or is disabled, Bug Reporting is
 *   disabled, the report type isn't enabled, the plan's usage is exceeded, or
 *   this SDK mode doesn't support it. Retrying doesn't help.
 * - `'tryLater'`: the SDK's own report UI is open, the app isn't in the
 *   foreground, or a limit is reached (one report every 60 seconds, 10 per
 *   hour, or the server asked to slow down).
 * - `'duplicate'`: the same report (type, category, answers and comment) was
 *   queued in the last 24 hours.
 */
export type NotSentReason = 'unavailable' | 'tryLater' | 'duplicate';

/** The part of a report a {@link FieldError} is about. */
export type FieldErrorField =
  | 'category'
  | 'answer'
  | 'comment'
  | 'email'
  | 'consent'
  | 'extendedField'
  | 'screenshot'
  | 'attachment';

/**
 * What is wrong with a part of a report.
 *
 * - `'missing'`: required and not set.
 * - `'unknown'`: not on your dashboard or in your configuration.
 * - `'invalid'`: set but not usable (a category that isn't a leaf, the wrong
 *   number of values, a bad email, a bad image or attachment).
 * - `'tooShort'` / `'tooLong'`: the comment's minimum or 4,000 characters, a text answer's 500.
 */
export type FieldErrorProblem = 'missing' | 'unknown' | 'invalid' | 'tooShort' | 'tooLong';

/** One problem of an invalid report. There is no message: localise by `field` and `problem`. */
export interface FieldError {
  field: FieldErrorField;
  /**
   * The field key (`'answer'`), consent key (`'consent'`), extended field id
   * (`'extendedField'`) or the 0-based attachment index as a string
   * (`'attachment'`); `null` for the category, comment, email and screenshot.
   */
  key: string | null;
  problem: FieldErrorProblem;
}

/**
 * The result of `BugReporting.submitReport`.
 *
 * - `queued`: the report is saved on the device and uploads in the background.
 * - `notSent`: nothing was saved; see {@link CustomReportResult.notSentReason}.
 * - `invalid`: nothing was saved; every problem is listed in {@link CustomReportResult.errors}.
 */
export interface CustomReportResult {
  status: CustomReportStatus;
  /** Set only when `status` is `'notSent'`. */
  notSentReason?: NotSentReason;
  /** Every problem found, all at once; empty unless `status` is `'invalid'`. */
  errors: FieldError[];
}

/**
 * @internal
 * The result as the native bridges emit it. Same shape as {@link CustomReportResult};
 * optional members may be absent or `null`.
 */
export interface NativeCustomReportResult {
  status: CustomReportStatus;
  notSentReason?: NotSentReason | null;
  errors?: Array<{ field: FieldErrorField; key?: string | null; problem: FieldErrorProblem }> | null;
}

/**
 * @internal
 * Normalises a native result into a {@link CustomReportResult}: `errors` is
 * always an array, `key` is always present, and `notSentReason` is only
 * present when the report was not sent.
 */
export const fromNativeCustomReportResult = (
  raw: NativeCustomReportResult | null | undefined,
): CustomReportResult => {
  if (raw == null || typeof raw !== 'object') {
    return { status: 'notSent', notSentReason: 'unavailable', errors: [] };
  }

  const result: CustomReportResult = {
    status: raw.status,
    errors: (raw.errors ?? []).map((error) => ({
      field: error.field,
      key: error.key ?? null,
      problem: error.problem,
    })),
  };

  if (raw.status === 'notSent' && raw.notSentReason != null) {
    result.notSentReason = raw.notSentReason;
  }

  return result;
};
