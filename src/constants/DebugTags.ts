/**
 * Debug log tags used to identify SDK functional areas in console output.
 *
 * Each tag is included as the first positional argument to `Logger.*` calls so
 * that log streams can be grep-filtered by area (e.g. `LCQ-RN-APM-SPAN:`) and
 * passed to an AI agent for root-cause analysis.
 *
 * Conventions:
 * - All tags are prefixed `LCQ-RN-` and suffixed `:` to match the existing
 *   network/XHR tag style used elsewhere in the SDK.
 * - One tag per public functional area. Sub-areas (e.g. `APM_SCREEN_LOADING`)
 *   get their own tag rather than sharing a parent so filtering is precise.
 */
export const LuciqDebugTags = {
  CORE: 'LCQ-RN-CORE:',
  SCREEN_TRACKING: 'LCQ-RN-SCREEN:',
  APM: 'LCQ-RN-APM:',
  APM_SCREEN_LOADING: 'LCQ-RN-APM-SL:',
  APM_SCREEN_RENDERING: 'LCQ-RN-APM-SR:',
  APM_UI_TRACE: 'LCQ-RN-APM-UI:',
  APM_APP_LAUNCH: 'LCQ-RN-APM-LAUNCH:',
  APM_CUSTOM_SPAN: 'LCQ-RN-APM-SPAN:',
  APM_FLOW: 'LCQ-RN-APM-FLOW:',
  APM_NETWORK: 'LCQ-RN-APM-NET:',
  BUG_REPORTING: 'LCQ-RN-BR:',
  CRASH_REPORTING: 'LCQ-RN-CRASH:',
  SESSION_REPLAY: 'LCQ-RN-SR:',
  PRIVATE_VIEW: 'LCQ-RN-PRIV:',
  FEATURE_FLAGS: 'LCQ-RN-FF:',
  NETWORK: 'LCQ-RN-NET:',
  XHR: 'LCQ-RN-XHR:',
  SURVEYS: 'LCQ-RN-SUR:',
  REPLIES: 'LCQ-RN-REP:',
  FEATURE_REQUESTS: 'LCQ-RN-FR:',
  APP_STATE: 'LCQ-RN-STATE:',
} as const;
