import type { ReportType } from '../utils/Enums';
import { LuciqInvalidArgumentError } from '../utils/LuciqErrors';

/**
 * The screenshot attached to a {@link CustomReport}.
 *
 * - `'none'` (default): no screenshot.
 * - `'currentScreen'`: the SDK captures the screen when the report is submitted,
 *   with your private views masked, as the report's main screenshot.
 * - `ReportScreenshot.fromImage(uri)`: an image of your own, attached as a
 *   regular image, never as the main screenshot, and scaled down when it is
 *   very large. It is NOT masked: it is sent, and forwarded to your
 *   integrations, as it is.
 */
export type ReportScreenshot = 'none' | 'currentScreen' | { imageUri: string };

export const ReportScreenshot = {
  /**
   * An image of your own as the report's screenshot.
   *
   * @param uri A file path or `file://` URI of an image in the app's storage;
   * on Android also a `content://` URI. An image that can't be read makes the
   * report `invalid` (`screenshot` / `invalid`).
   */
  fromImage: (uri: string): ReportScreenshot => ({ imageUri: uri }),
};

/**
 * A report collected by your own UI, submitted with `BugReporting.submitReport`.
 *
 * The category identifier and the field and option keys must exist in your
 * dashboard; get them with `BugReporting.getReportConfiguration`. The comment,
 * email, consents and extended fields are free, within the limits returned by
 * `BugReporting.getReportConfiguration`. Everything is sent as given: don't put
 * secrets or sensitive personal data in it.
 */
export interface CustomReport {
  /** `ReportType.bug`, `ReportType.feedback` or `ReportType.question`. */
  reportType: ReportType;
  /** The report's description. Trimmed by the SDK; at most 4,000 characters. */
  comment?: string | null;
  /** The reporter's email. Ignored when the email field is hidden; empty uses the identified user's email. */
  email?: string | null;
  /**
   * The identifier of a leaf category of the report type (dashboard › Report Categories).
   * The SDK knows a category only once it has downloaded your categories: on a
   * first launch, a report sent before that is `invalid` with `category` /
   * `unknown`, so check `BugReporting.getReportConfiguration` first.
   */
  categoryIdentifier?: string | null;
  /**
   * Answers per field key: option keys for checkbox, search and dropdown fields,
   * the user's text (one value, up to 500 characters) for text fields.
   * An empty array clears the answer. Answers are ignored until category
   * fields are turned on for your app by the server, and are added to the
   * report's description only when the server turns that on too (both are off
   * by default).
   */
  answers?: Record<string, string[]>;
  /**
   * The user's answer to each consent added with `BugReporting.addUserConsent`, by key.
   * A consent you don't set counts as not accepted, whatever its default.
   */
  consents?: Record<string, boolean>;
  /**
   * Extended bug report fields: `repro_steps`, `actual_result` or
   * `expected_result` (the ids in `ReportRequirements.extendedFields`), up to
   * 4,000 characters each (`tooLong` over that). When extended bug reports are
   * on, any other id is `unknown`; when they're off, the values are ignored.
   */
  extendedFields?: Record<string, string | null>;
  /** Defaults to `'none'`. */
  screenshot?: ReportScreenshot;
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
    (value) =>
      value === 'none' ||
      value === 'currentScreen' ||
      (isRecord(value) && isString(value.imageUri)),
    "'none', 'currentScreen' or ReportScreenshot.fromImage(uri)",
  ],
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
