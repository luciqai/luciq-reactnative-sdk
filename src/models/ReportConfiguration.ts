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
  fields: ConfigurationField[];
}

/** A consent added with `BugReporting.addUserConsent`. */
export interface ReportConsent {
  key: string;
  description: string | null;
  mandatory: boolean;
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
  maxAttachments: number;
  /** Per attachment. */
  maxAttachmentBytes: number;
}

/**
 * What your report UI needs for one report type: its categories (narrowed by
 * `BugReporting.setReportCategoriesScope`) and the requirements
 * `BugReporting.submitReport` enforces.
 */
export interface ReportConfiguration {
  reportType: ReportType;
  /** The first level of categories to show, in dashboard order; empty when the report type has none. */
  categories: ConfigurationCategory[];
  /** The category the scope matched when it matched exactly one, else `null`. */
  preselectedCategory: ConfigurationCategory | null;
  requirements: ReportRequirements;
}
