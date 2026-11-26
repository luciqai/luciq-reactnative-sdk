import * as BugReporting from '../../src/modules/BugReporting';
import { NativeBugReporting } from '../../src/native/NativeBugReporting';
import { ReportType } from '../../src/utils/Enums';
import { LCQ_INVALID_ARGUMENT, LuciqInvalidArgumentError } from '../../src/utils/LuciqErrors';
import { Logger } from '../../src/utils/logger';
import { ReportScreenshot } from '../../src/models/CustomReport';
import type { CustomReport, NativeCustomReport } from '../../src/models/CustomReport';
import type { CustomReportResult } from '../../src/models/CustomReportResult';
import type { ReportConfiguration } from '../../src/models/ReportConfiguration';

const mockGetReportConfiguration = NativeBugReporting.getReportConfiguration as jest.Mock;
const mockSubmitReport = NativeBugReporting.submitReport as jest.Mock;

const payload: NativeCustomReport = {
  comment: 'Refund was for the wrong amount',
  email: 'reporter@example.com',
  categoryIdentifier: 'checkout-refund',
  answers: { f_reason: ['o_wrong_amount'], f_items: ['o_item_a', 'o_item_b'] },
  consents: { c_share_logs: true, c_contact_me: false },
  extendedFields: { repro_steps: '1. Pay 2. Request a refund' },
  screenshot: 'currentScreen',
};
const report: CustomReport = { reportType: ReportType.bug, ...payload };

const queued: CustomReportResult = { status: 'queued', errors: [] };
const notSent: CustomReportResult = { status: 'notSent', notSentReason: 'tryLater', errors: [] };
const invalid: CustomReportResult = {
  status: 'invalid',
  errors: [
    { field: 'category', key: null, problem: 'missing' },
    { field: 'answer', key: 'f_reason', problem: 'unknown' },
  ],
};

const nativeConfiguration: Omit<ReportConfiguration, 'reportType'> = {
  categories: [
    {
      identifier: 'checkout-refund',
      title: 'Refund',
      description: null,
      leaf: true,
      children: [],
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
  },
};

describe('BugReporting custom report APIs', () => {
  describe('setReportCategoriesScope', () => {
    it('should forward an array of identifiers to the native module', () => {
      const identifiers = ['checkout', 'refund'];

      BugReporting.setReportCategoriesScope(identifiers);

      expect(NativeBugReporting.setReportCategoriesScope).toBeCalledTimes(1);
      expect(NativeBugReporting.setReportCategoriesScope).toBeCalledWith(identifiers);
    });

    it('should forward an empty array as-is', () => {
      BugReporting.setReportCategoriesScope([]);

      expect(NativeBugReporting.setReportCategoriesScope).toBeCalledWith([]);
    });

    it('should forward null to clear the scope', () => {
      BugReporting.setReportCategoriesScope(null);

      expect(NativeBugReporting.setReportCategoriesScope).toBeCalledWith(null);
    });

    it('should not log the identifiers themselves', () => {
      const debugSpy = jest.spyOn(Logger, 'debug').mockImplementation(() => {});

      BugReporting.setReportCategoriesScope(['secret-category']);

      const logged = JSON.stringify(debugSpy.mock.calls);
      expect(logged).not.toContain('secret-category');
      debugSpy.mockRestore();
    });
  });

  describe('getReportConfiguration', () => {
    it.each([ReportType.bug, ReportType.feedback])(
      'should resolve the native configuration with the requested report type (%s)',
      async (type) => {
        mockGetReportConfiguration.mockResolvedValueOnce(nativeConfiguration);

        const configuration = await BugReporting.getReportConfiguration(type);

        expect(NativeBugReporting.getReportConfiguration).toBeCalledTimes(1);
        expect(NativeBugReporting.getReportConfiguration).toBeCalledWith(type);
        expect(configuration).toEqual({ ...nativeConfiguration, reportType: type });
      },
    );

    it.each([null, undefined])(
      'should resolve null when the native module resolves %s',
      async (native) => {
        mockGetReportConfiguration.mockResolvedValueOnce(native);

        await expect(BugReporting.getReportConfiguration(ReportType.question)).resolves.toBeNull();
      },
    );

    it('should reject with LCQ_INVALID_ARGUMENT for an unknown report type without calling native', async () => {
      const promise = BugReporting.getReportConfiguration(
        'not-a-report-type' as unknown as ReportType,
      );

      await expect(promise).rejects.toBeInstanceOf(LuciqInvalidArgumentError);
      await expect(promise).rejects.toMatchObject({ code: LCQ_INVALID_ARGUMENT });
      expect(NativeBugReporting.getReportConfiguration).not.toBeCalled();
    });
  });

  describe('submitReport', () => {
    it('should call the native method with the report type and the bridge payload', async () => {
      mockSubmitReport.mockResolvedValueOnce(queued);

      await BugReporting.submitReport(report);

      expect(NativeBugReporting.submitReport).toBeCalledTimes(1);
      expect(NativeBugReporting.submitReport).toBeCalledWith(ReportType.bug, payload);
    });

    it('should drop null and undefined parts from the bridge payload', async () => {
      mockSubmitReport.mockResolvedValueOnce(queued);

      await BugReporting.submitReport({
        reportType: ReportType.feedback,
        comment: undefined,
        email: null,
      });

      expect(NativeBugReporting.submitReport).toBeCalledWith(ReportType.feedback, {});
    });

    it.each([queued, notSent, invalid])(
      'should resolve the native result as-is (%j)',
      async (native) => {
        mockSubmitReport.mockResolvedValueOnce(native);

        await expect(BugReporting.submitReport(report)).resolves.toBe(native);
      },
    );

    it.each([
      ['the report is not an object', null],
      ['the report type is unknown', { reportType: 'nope' }],
      ['a part of the report has the wrong type', { reportType: ReportType.bug, answers: [] }],
    ])('should reject with LCQ_INVALID_ARGUMENT when %s', async (_, malformed) => {
      const promise = BugReporting.submitReport(malformed as unknown as CustomReport);

      await expect(promise).rejects.toBeInstanceOf(LuciqInvalidArgumentError);
      await expect(promise).rejects.toMatchObject({ code: LCQ_INVALID_ARGUMENT });
      expect(NativeBugReporting.submitReport).not.toBeCalled();
    });

    it('should never log the comment, email, answers, extended fields or image URI', async () => {
      const debugSpy = jest.spyOn(Logger, 'debug').mockImplementation(() => {});
      mockSubmitReport.mockResolvedValueOnce(queued);

      await BugReporting.submitReport({
        ...report,
        screenshot: ReportScreenshot.fromImage('file:///cache/shot.png'),
      });

      const logged = JSON.stringify(debugSpy.mock.calls);
      expect(logged).not.toContain(payload.comment);
      expect(logged).not.toContain(payload.email);
      expect(logged).not.toContain('o_wrong_amount');
      expect(logged).not.toContain('Request a refund');
      expect(logged).not.toContain('shot.png');
      debugSpy.mockRestore();
    });
  });
});
