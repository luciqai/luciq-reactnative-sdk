import * as BugReporting from '../../src/modules/BugReporting';
import { NativeBugReporting } from '../../src/native/NativeBugReporting';
import { ReportType } from '../../src/utils/Enums';
import { LCQ_INVALID_ARGUMENT, LuciqInvalidArgumentError } from '../../src/utils/LuciqErrors';
import { Logger } from '../../src/utils/logger';
import type { CustomReport } from '../../src/models/CustomReport';

import reportFull from '../fixtures/customReport/report.full.json';
import reportMinimal from '../fixtures/customReport/report.minimal.json';
import resultQueued from '../fixtures/customReport/result.queued.json';
import resultTryLater from '../fixtures/customReport/result.notSent.tryLater.json';
import resultInvalid from '../fixtures/customReport/result.invalid.json';
import configurationFull from '../fixtures/customReport/configuration.full.json';
import configurationScoped from '../fixtures/customReport/configuration.scoped.json';

const mockGetReportConfiguration = NativeBugReporting.getReportConfiguration as jest.Mock;
const mockSubmitReport = NativeBugReporting.submitReport as jest.Mock;

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
    it('should call the native method with the report type and resolve a typed configuration', async () => {
      mockGetReportConfiguration.mockResolvedValueOnce(configurationFull);

      const configuration = await BugReporting.getReportConfiguration(ReportType.bug);

      expect(NativeBugReporting.getReportConfiguration).toBeCalledTimes(1);
      expect(NativeBugReporting.getReportConfiguration).toBeCalledWith(ReportType.bug);
      expect(configuration).toEqual({ ...configurationFull, reportType: ReportType.bug });
    });

    it('should map the native report type name back to the ReportType enum', async () => {
      mockGetReportConfiguration.mockResolvedValueOnce(configurationScoped);

      const configuration = await BugReporting.getReportConfiguration(ReportType.feedback);

      expect(configuration?.reportType).toBe(ReportType.feedback);
      expect(configuration?.preselectedCategory?.identifier).toBe('report-a-problem');
      expect(configuration?.preselectedCategory?.leaf).toBe(false);
      expect(configuration?.requirements.email).toBe('hidden');
      expect(configuration?.requirements.screenshotRequired).toBe(true);
    });

    it('should resolve null when the native module resolves null', async () => {
      mockGetReportConfiguration.mockResolvedValueOnce(null);

      await expect(BugReporting.getReportConfiguration(ReportType.question)).resolves.toBeNull();
    });

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
    const fullReport: CustomReport = {
      reportType: ReportType.bug,
      ...(reportFull as Omit<CustomReport, 'reportType'>),
    };

    it('should call the native method with the report type and the bridge payload', async () => {
      mockSubmitReport.mockResolvedValueOnce(resultQueued);

      await BugReporting.submitReport(fullReport);

      expect(NativeBugReporting.submitReport).toBeCalledTimes(1);
      expect(NativeBugReporting.submitReport).toBeCalledWith(ReportType.bug, reportFull);
    });

    it('should default the screenshot to none and drop undefined keys', async () => {
      mockSubmitReport.mockResolvedValueOnce(resultQueued);

      await BugReporting.submitReport({ reportType: ReportType.feedback, comment: undefined });

      expect(NativeBugReporting.submitReport).toBeCalledWith(ReportType.feedback, reportMinimal);
    });

    it('should resolve a queued result', async () => {
      mockSubmitReport.mockResolvedValueOnce(resultQueued);

      const result = await BugReporting.submitReport(fullReport);

      expect(result).toEqual({ status: 'queued', errors: [] });
      expect(result.notSentReason).toBeUndefined();
    });

    it('should resolve a notSent result with its reason', async () => {
      mockSubmitReport.mockResolvedValueOnce(resultTryLater);

      const result = await BugReporting.submitReport(fullReport);

      expect(result).toEqual({ status: 'notSent', notSentReason: 'tryLater', errors: [] });
    });

    it('should resolve an invalid result with typed errors', async () => {
      mockSubmitReport.mockResolvedValueOnce(resultInvalid);

      const result = await BugReporting.submitReport(fullReport);

      expect(result.status).toBe('invalid');
      expect(result.errors).toEqual(resultInvalid.errors);
      expect(result.errors).toHaveLength(8);
      expect(result.errors[0]).toEqual({ field: 'category', key: null, problem: 'missing' });
      expect(result.errors[7]).toEqual({ field: 'attachment', key: '0', problem: 'tooLong' });
    });

    it('should reject with LCQ_INVALID_ARGUMENT when the report is not an object', async () => {
      const promise = BugReporting.submitReport(null as unknown as CustomReport);

      await expect(promise).rejects.toMatchObject({ code: LCQ_INVALID_ARGUMENT });
      expect(NativeBugReporting.submitReport).not.toBeCalled();
    });

    it('should reject with LCQ_INVALID_ARGUMENT when the report type is unknown', async () => {
      const promise = BugReporting.submitReport({ reportType: 'nope' as unknown as ReportType });

      await expect(promise).rejects.toMatchObject({ code: LCQ_INVALID_ARGUMENT });
      expect(NativeBugReporting.submitReport).not.toBeCalled();
    });

    it('should never log the comment, email, answers or attachment paths', async () => {
      const debugSpy = jest.spyOn(Logger, 'debug').mockImplementation(() => {});
      mockSubmitReport.mockResolvedValueOnce(resultQueued);

      await BugReporting.submitReport(fullReport);

      const logged = JSON.stringify(debugSpy.mock.calls);
      expect(logged).not.toContain(reportFull.comment);
      expect(logged).not.toContain(reportFull.email);
      expect(logged).not.toContain('o_wrong_amount');
      expect(logged).not.toContain('report.log');
      debugSpy.mockRestore();
    });
  });
});
