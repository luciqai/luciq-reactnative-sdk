import { fromNativeCustomReportResult } from '../../src/models/CustomReportResult';
import type { NativeCustomReportResult } from '../../src/models/CustomReportResult';

import resultQueued from '../fixtures/customReport/result.queued.json';
import resultTryLater from '../fixtures/customReport/result.notSent.tryLater.json';
import resultInvalid from '../fixtures/customReport/result.invalid.json';

describe('fromNativeCustomReportResult', () => {
  it('should pass a queued result through', () => {
    expect(fromNativeCustomReportResult(resultQueued as NativeCustomReportResult)).toEqual(
      resultQueued,
    );
  });

  it('should pass a notSent result through with its reason', () => {
    expect(fromNativeCustomReportResult(resultTryLater as NativeCustomReportResult)).toEqual(
      resultTryLater,
    );
  });

  it('should pass an invalid result through with all errors in order', () => {
    expect(fromNativeCustomReportResult(resultInvalid as NativeCustomReportResult)).toEqual(
      resultInvalid,
    );
  });

  it('should default missing errors to an empty array and missing keys to null', () => {
    const result = fromNativeCustomReportResult({
      status: 'invalid',
      errors: [{ field: 'comment', problem: 'tooLong' }],
    });

    expect(result).toEqual({
      status: 'invalid',
      errors: [{ field: 'comment', key: null, problem: 'tooLong' }],
    });
  });

  it('should omit notSentReason unless the status is notSent', () => {
    const result = fromNativeCustomReportResult({
      status: 'queued',
      notSentReason: null,
      errors: null,
    });

    expect(result).toEqual({ status: 'queued', errors: [] });
    expect('notSentReason' in result).toBe(false);
  });

  it('should treat a missing result as notSent/unavailable', () => {
    expect(fromNativeCustomReportResult(null)).toEqual({
      status: 'notSent',
      notSentReason: 'unavailable',
      errors: [],
    });
  });
});
