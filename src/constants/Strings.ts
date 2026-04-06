export class LuciqStrings {
  static readonly customSpanAPMDisabledMessage: string =
    'APM is disabled, custom span not created. Please enable APM by following the instructions at this link:\n' +
    'https://docs.luciq.ai/product-guides-and-integrations/product-guides/application-performance-monitoring';

  static readonly customSpanDisabled: string =
    'Custom span is disabled, custom span not created. Please enable Custom Span by following the instructions at this link:\n' +
    'https://docs.luciq.ai/product-guides-and-integrations/product-guides/application-performance-monitoring';

  static readonly customSpanSDKNotInitializedMessage: string =
    'Luciq API was called before the SDK is built. To build it, first by following the instructions at this link:\n' +
    'https://docs.luciq.ai/product-guides-and-integrations/product-guides/application-performance-monitoring';

  static readonly customSpanNameEmpty: string =
    'Custom span name cannot be empty. Please provide a valid name for the custom span.';

  static readonly customSpanEndTimeBeforeStartTime: string =
    'Custom span end time must be after start time. Please provide a valid start and end time for the custom span.';

  static readonly customSpanNameTruncated: string = 'Custom span name truncated to 150 characters';

  static readonly customSpanLimitReached: string =
    'Maximum number of concurrent custom spans (100) reached. Please end some spans before starting new ones.';
}
