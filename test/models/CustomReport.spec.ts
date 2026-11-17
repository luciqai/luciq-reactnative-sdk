import { toNativeCustomReport } from '../../src/models/CustomReport';
import type { CustomReport, ReportScreenshot } from '../../src/models/CustomReport';
import { ReportType } from '../../src/utils/Enums';

import reportFull from '../fixtures/customReport/report.full.json';
import reportMinimal from '../fixtures/customReport/report.minimal.json';

describe('toNativeCustomReport', () => {
  it('should keep every field of a full report except reportType', () => {
    const report: CustomReport = {
      reportType: ReportType.bug,
      ...(reportFull as Omit<CustomReport, 'reportType'>),
    };

    expect(toNativeCustomReport(report)).toEqual(reportFull);
  });

  it('should produce the minimal payload for a report with only a type', () => {
    expect(toNativeCustomReport({ reportType: ReportType.question })).toEqual(reportMinimal);
  });

  it('should drop undefined keys but keep explicit nulls', () => {
    const native = toNativeCustomReport({
      reportType: ReportType.bug,
      comment: null,
      email: undefined,
      categoryIdentifier: 'leaf',
    });

    expect(native).toEqual({ screenshot: 'none', comment: null, categoryIdentifier: 'leaf' });
    expect('email' in native).toBe(false);
  });

  it('should coerce an unknown screenshot value to none', () => {
    const native = toNativeCustomReport({
      reportType: ReportType.bug,
      screenshot: 'fromGallery' as ReportScreenshot,
    });

    expect(native.screenshot).toBe('none');
  });
});
