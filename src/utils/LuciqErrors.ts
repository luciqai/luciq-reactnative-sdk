/**
 * Error code attached to a rejected Promise when a Luciq API is called with
 * malformed input (for example an unknown `ReportType` or a non-object report).
 *
 * Every outcome the native SDK reports (a report that was not sent, an invalid
 * report, an unavailable configuration) is delivered as a *resolved* Promise;
 * only a programming error on the caller's side rejects, with this code.
 */
export const LCQ_INVALID_ARGUMENT = 'LCQ_INVALID_ARGUMENT';

/**
 * The error a Luciq API rejects with when its input is malformed.
 * Check `error.code === LCQ_INVALID_ARGUMENT` to tell it apart from other errors.
 */
export class LuciqInvalidArgumentError extends Error {
  readonly code = LCQ_INVALID_ARGUMENT;

  constructor(message: string) {
    super(message);
    this.name = 'LuciqInvalidArgumentError';
  }
}
