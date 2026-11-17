import type { ReportType } from '../utils/Enums';
import { LuciqInvalidArgumentError } from '../utils/LuciqErrors';

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
 * returned by `BugReporting.getReportConfiguration`. Everything is sent as given: don't put
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
   * Files to attach (at most 3, up to 5 MiB each), as file paths or URIs inside
   * the app's own storage: `file://` on both platforms, `content://` on Android.
   * Validated natively.
   */
  attachments?: string[];
}

/** @internal The report as it crosses the bridge: checked, without `reportType` or null entries. */
export type NativeCustomReport = Omit<CustomReport, 'reportType'>;

type Check = (value: unknown) => boolean;

const isString: Check = (value) => typeof value === 'string';
const isBoolean: Check = (value) => typeof value === 'boolean';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const arrayOf =
  (isValid: Check): Check =>
  (value) =>
    Array.isArray(value) && value.every(isValid);
const recordOf =
  (isValid: Check): Check =>
  (value) =>
    isRecord(value) && Object.values(value).every(isValid);

/** What each part of a report must be, and how to word it when it isn't. */
const SHAPE: Record<keyof NativeCustomReport, [Check, string]> = {
  comment: [isString, 'a string'],
  email: [isString, 'a string'],
  categoryIdentifier: [isString, 'a string'],
  answers: [recordOf(arrayOf(isString)), 'an object of string arrays'],
  consents: [recordOf(isBoolean), 'an object of booleans'],
  extendedFields: [recordOf(isString), 'an object of strings'],
  screenshot: [
    (value) => value === 'none' || value === 'currentScreen',
    "'none' or 'currentScreen'",
  ],
  attachments: [arrayOf(isString), 'an array of strings'],
};

/**
 * @internal
 * Builds the bridge payload for a {@link CustomReport}: drops `reportType`
 * (sent separately) and null entries, and checks the type of every other part,
 * so the native bridges only have to map it. Limits and dashboard keys are
 * checked by the native SDK and reported in the result.
 * @throws {LuciqInvalidArgumentError} when a part of the report has the wrong type.
 */
export const toNativeCustomReport = (report: CustomReport): NativeCustomReport => {
  const native: Record<string, unknown> = {};

  for (const [key, [isValid, expected]] of Object.entries(SHAPE)) {
    let value: unknown = report[key as keyof NativeCustomReport];
    if (isRecord(value)) {
      value = Object.fromEntries(Object.entries(value).filter(([, entry]) => entry != null));
    }
    if (value == null) {
      continue;
    }
    if (!isValid(value)) {
      throw new LuciqInvalidArgumentError(`submitReport: ${key} must be ${expected}.`);
    }
    native[key] = value;
  }

  return native;
};
