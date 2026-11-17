import { fromNativeReportConfiguration } from '../../src/models/ReportConfiguration';
import type { NativeReportConfiguration } from '../../src/models/ReportConfiguration';
import { ReportType } from '../../src/utils/Enums';

import configurationFull from '../fixtures/customReport/configuration.full.json';
import configurationScoped from '../fixtures/customReport/configuration.scoped.json';

describe('fromNativeReportConfiguration', () => {
  it('should map the full fixture one-to-one and the report type to the enum', () => {
    const configuration = fromNativeReportConfiguration(
      configurationFull as NativeReportConfiguration,
    );

    expect(configuration).toEqual({ ...configurationFull, reportType: ReportType.bug });
  });

  it('should map the scoped fixture with a preselected parent category', () => {
    const configuration = fromNativeReportConfiguration(
      configurationScoped as NativeReportConfiguration,
    );

    expect(configuration).toEqual({ ...configurationScoped, reportType: ReportType.feedback });
  });

  it('should return null for a null or non-object input', () => {
    expect(fromNativeReportConfiguration(null)).toBeNull();
    expect(fromNativeReportConfiguration(undefined)).toBeNull();
  });

  it('should derive leaf from children when a platform omits it and fill defaults', () => {
    const configuration = fromNativeReportConfiguration({
      reportType: 'question',
      categories: [
        {
          identifier: 'parent',
          title: 'Parent',
          children: [{ identifier: 'child', title: 'Child', fields: [{ key: 'f', type: 'text' }] }],
        },
      ],
    });

    expect(configuration).toEqual({
      reportType: ReportType.question,
      categories: [
        {
          identifier: 'parent',
          title: 'Parent',
          description: null,
          leaf: false,
          children: [
            {
              identifier: 'child',
              title: 'Child',
              description: null,
              leaf: true,
              children: [],
              fields: [
                {
                  key: 'f',
                  type: 'text',
                  label: null,
                  placeholder: null,
                  required: false,
                  options: [],
                },
              ],
            },
          ],
          fields: [],
        },
      ],
      preselectedCategory: null,
      requirements: {
        email: 'optional',
        identifiedEmail: null,
        commentMinLength: 0,
        commentMaxLength: 4000,
        consents: [],
        extendedFields: [],
        screenshotRequired: false,
        maxAttachments: 3,
        maxAttachmentBytes: 5242880,
      },
    });
  });
});
