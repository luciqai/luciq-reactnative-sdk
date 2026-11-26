import type { ReportType } from '../utils/Enums';

/** The kind of input a category field takes. */
export type FieldType = 'checkbox' | 'search' | 'dropdown' | 'text';

/**
 * How the email is collected.
 *
 * - `'hidden'`: not asked; the identified user's email is sent.
 * - `'optional'`: when given, it must be valid.
 * - `'required'`.
 */
export type EmailRequirement = 'hidden' | 'optional' | 'required';

/** An option of a checkbox, search or dropdown field. */
export interface FieldOption {
  /** The key to pass in `CustomReport.answers`. */
  key: string;
  label: string;
}

/**
 * A field of a leaf category. Answer it in `CustomReport.answers` by
 * `type`: checkbox, one or more option keys; search and dropdown, exactly one;
 * text, exactly one value up to 500 characters.
 */
export interface ConfigurationField {
  key: string;
  type: FieldType;
  label: string | null;
  placeholder: string | null;
  required: boolean;
  /** In dashboard order; empty for a text field. */
  options: FieldOption[];
}

/** A report category. Only a leaf (`leaf === true`) can be submitted, and only a leaf has fields. */
export interface ConfigurationCategory {
  /** What to pass as `CustomReport.categoryIdentifier`. */
  identifier: string;
  title: string;
  description: string | null;
  /** `true` when the category has no children. */
  leaf: boolean;
  children: ConfigurationCategory[];
  /** Empty until category fields are turned on for your app by the server (off by default). */
  fields: ConfigurationField[];
}

/** A consent added with `BugReporting.addUserConsent`. Answer it in `CustomReport.consents`. */
export interface ReportConsent {
  key: string;
  description: string | null;
  mandatory: boolean;
  /** Whether Luciq's own form shows the consent checked at first; a custom report doesn't use it. */
  checkedByDefault: boolean;
}

/** An extended bug report field (`BugReporting.setExtendedBugReportMode`). */
export interface ReportExtendedField {
  /** `repro_steps`, `actual_result` or `expected_result`. */
  id: string;
  label: string;
  required: boolean;
}

/** What `BugReporting.submitReport` enforces for a report type. */
export interface ReportRequirements {
  email: EmailRequirement;
  /** The email of the identified user, used when the email is hidden or empty. */
  identifiedEmail: string | null;
  /** 0 when a comment is optional. */
  commentMinLength: number;
  commentMaxLength: number;
  consents: ReportConsent[];
  extendedFields: ReportExtendedField[];
  /** Always `false` on iOS. */
  screenshotRequired: boolean;
}

/**
 * What your report UI needs for one report type: its categories (narrowed by
 * `BugReporting.setReportCategoriesScope`) and the requirements
 * `BugReporting.submitReport` enforces.
 */
export interface ReportConfiguration {
  reportType: ReportType;
  /**
   * The categories to show, each with its children, in dashboard order: all of
   * the report type's categories, or only the ones the scope matches. Empty
   * when the report type has none, or when the categories aren't downloaded
   * yet (first launch); an empty list doesn't tell the two apart.
   */
  categories: ConfigurationCategory[];
  /**
   * The category the scope matched when it matched exactly one, else `null`.
   * It is also the only entry of `categories`, so don't list both.
   */
  preselectedCategory: ConfigurationCategory | null;
  requirements: ReportRequirements;
}
