import type { ReportType } from '../utils/Enums';

/**
 * The screenshot attached to a {@link CustomReport}.
 *
 * - `'none'` (default): no screenshot.
 * - `'currentScreen'`: the SDK captures the screen when the report is submitted,
 *   with your private views masked, as the report's main screenshot.
 */
export type ReportScreenshot = 'none' | 'currentScreen';

/**
 * A report collected by your own UI, submitted with `BugReporting.submitReport`.
 *
 * The category identifier and the field and option keys must exist in your
 * dashboard; get them with `BugReporting.getReportConfiguration`. The comment,
 * email, consents, extended fields and attachments are free, within the limits
 * returned in {@link ReportRequirements}. Everything is sent as given: don't put
 * secrets or sensitive personal data in it.
 */
export interface CustomReport {
  /** `ReportType.bug`, `ReportType.feedback` or `ReportType.question`. */
  reportType: ReportType;
  /** The report's description. Trimmed by the SDK; at most 4,000 characters. */
  comment?: string | null;
  /** The reporter's email. Ignored when the email field is hidden; empty uses the identified user's email. */
  email?: string | null;
  /** The identifier of a leaf category of the report type (dashboard › Report Categories). */
  categoryIdentifier?: string | null;
  /**
   * Answers per field key: option keys for checkbox, search and dropdown fields,
   * the user's text (one value, up to 500 characters) for text fields.
   * An empty array clears the answer.
   */
  answers?: Record<string, string[]>;
  /** The user's answer to each consent added with `BugReporting.addUserConsent`, by key. */
  consents?: Record<string, boolean>;
  /** Extended bug report fields: `repro_steps`, `actual_result`, `expected_result` or a configured id. */
  extendedFields?: Record<string, string | null>;
  /** Defaults to `'none'`. */
  screenshot?: ReportScreenshot;
  /**
   * File URIs to attach (at most 3, up to 5 MiB each). iOS accepts `file://`
   * URLs inside the app container; Android accepts `content://` URIs and
   * `file://` URIs inside the app's own storage. Validated natively.
   */
  attachments?: string[];
}

/**
 * @internal
 * The report as it crosses the bridge: the same keys as {@link CustomReport}
 * minus `reportType` (passed separately), with `undefined` values dropped and
 * `screenshot` always set.
 */
export interface NativeCustomReport {
  comment?: string | null;
  email?: string | null;
  categoryIdentifier?: string | null;
  answers?: Record<string, string[]>;
  consents?: Record<string, boolean>;
  extendedFields?: Record<string, string | null>;
  screenshot: ReportScreenshot;
  attachments?: string[];
}

const SCREENSHOTS: ReportScreenshot[] = ['none', 'currentScreen'];

/**
 * @internal
 * Builds the bridge payload for a {@link CustomReport}: drops `undefined`
 * entries, defaults `screenshot` to `'none'` and coerces an unknown screenshot
 * value to `'none'`. No limits are checked here; the native SDK validates the
 * report and reports every problem in the result.
 */
export const toNativeCustomReport = (report: CustomReport): NativeCustomReport => {
  const native: NativeCustomReport = {
    screenshot: SCREENSHOTS.includes(report.screenshot as ReportScreenshot)
      ? (report.screenshot as ReportScreenshot)
      : 'none',
  };

  if (report.comment !== undefined) {
    native.comment = report.comment;
  }
  if (report.email !== undefined) {
    native.email = report.email;
  }
  if (report.categoryIdentifier !== undefined) {
    native.categoryIdentifier = report.categoryIdentifier;
  }
  if (report.answers !== undefined) {
    native.answers = report.answers;
  }
  if (report.consents !== undefined) {
    native.consents = report.consents;
  }
  if (report.extendedFields !== undefined) {
    native.extendedFields = report.extendedFields;
  }
  if (report.attachments !== undefined) {
    native.attachments = report.attachments;
  }

  return native;
};
