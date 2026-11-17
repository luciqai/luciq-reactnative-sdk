import { toNativeCustomReport } from '../../src/models/CustomReport';
import type { CustomReport, NativeCustomReport } from '../../src/models/CustomReport';
import { ReportType } from '../../src/utils/Enums';
import { LuciqInvalidArgumentError } from '../../src/utils/LuciqErrors';

describe('toNativeCustomReport', () => {
  it('should keep every part of a full report except reportType', () => {
    const payload: NativeCustomReport = {
      comment: 'Refund was for the wrong amount',
      email: 'reporter@example.com',
      categoryIdentifier: 'checkout-refund',
      answers: { f_reason: ['o_wrong_amount'], f_items: ['o_item_a', 'o_item_b'] },
      consents: { c_share_logs: true, c_contact_me: false },
      extendedFields: { repro_steps: '1. Pay 2. Request a refund' },
      screenshot: 'currentScreen',
      attachments: ['file:///data/user/0/com.example/files/report.log'],
    };

    expect(toNativeCustomReport({ reportType: ReportType.bug, ...payload })).toEqual(payload);
  });

  it('should produce an empty payload for a report with only a type', () => {
    expect(toNativeCustomReport({ reportType: ReportType.question })).toEqual({});
  });

  it('should drop null and undefined entries, also inside answers and extended fields', () => {
    const report = {
      reportType: ReportType.bug,
      comment: null,
      email: undefined,
      categoryIdentifier: 'leaf',
      answers: { f_reason: ['o_wrong_amount'], f_items: null },
      extendedFields: { repro_steps: null, actual_result: 'Refund of 0.00' },
    } as unknown as CustomReport;

    expect(toNativeCustomReport(report)).toEqual({
      categoryIdentifier: 'leaf',
      answers: { f_reason: ['o_wrong_amount'] },
      extendedFields: { actual_result: 'Refund of 0.00' },
    });
  });

  it.each([
    ['comment', { comment: 42 }],
    ['email', { email: {} }],
    ['categoryIdentifier', { categoryIdentifier: ['leaf'] }],
    ['answers', { answers: 'o_wrong_amount' }],
    ['answers', { answers: { f_reason: 'o_wrong_amount' } }],
    ['answers', { answers: { f_reason: [1] } }],
    ['consents', { consents: { c_share_logs: 'yes' } }],
    ['extendedFields', { extendedFields: { repro_steps: true } }],
    ['screenshot', { screenshot: 'fromGallery' }],
    ['attachments', { attachments: [1] }],
    ['attachments', { attachments: 'file:///report.log' }],
  ])('should reject a malformed %s', (part, malformed) => {
    const report = { reportType: ReportType.bug, ...malformed } as unknown as CustomReport;

    expect(() => toNativeCustomReport(report)).toThrow(LuciqInvalidArgumentError);
    expect(() => toNativeCustomReport(report)).toThrow(`submitReport: ${part} must be`);
  });
});
