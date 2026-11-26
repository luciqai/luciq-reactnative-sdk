/** The outcome of `BugReporting.submitReport`. */
export type CustomReportStatus = 'queued' | 'notSent' | 'invalid';

/**
 * Why a report was not sent.
 *
 * - `'unavailable'`: the SDK isn't started or is disabled, Bug Reporting is
 *   disabled, custom reports aren't turned on for your app by the server, the
 *   report type isn't enabled, the plan's usage is exceeded, or this SDK mode
 *   doesn't support it. Retrying doesn't help.
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
  | 'screenshot';

/**
 * What is wrong with a part of a report.
 *
 * - `'missing'`: required and not set.
 * - `'unknown'`: not on your dashboard or in your configuration (a category,
 *   field, option or consent key, or an extended field id while extended bug
 *   reports are on).
 * - `'invalid'`: set but not usable (a category that isn't a leaf, the wrong
 *   number of values, a bad email, an image that can't be read).
 * - `'tooShort'` / `'tooLong'`: the comment's minimum or 4,000 characters, a
 *   text answer's 500, an extended field's 4,000.
 */
export type FieldErrorProblem = 'missing' | 'unknown' | 'invalid' | 'tooShort' | 'tooLong';

/** One problem of an invalid report. There is no message: localise by `field` and `problem`. */
export interface FieldError {
  field: FieldErrorField;
  /**
   * The field key (`'answer'`), consent key (`'consent'`) or extended field id
   * (`'extendedField'`); `null` for the category, comment, email and screenshot.
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
