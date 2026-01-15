import { CustomSpan } from '../../src';

describe('CustomSpan', () => {
  // Mock callbacks for testing
  const mockUnregister = jest.fn();
  const mockSync = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnregister.mockClear();
    mockSync.mockClear();
  });

  it('should create a span with the given name', () => {
    const span = new CustomSpan('Test Span', mockUnregister, mockSync);

    expect(span.getName()).toBe('Test Span');
    expect(span.isEnded()).toBe(false);
  });

  it('should capture start time on creation', () => {
    const before = Date.now();
    const span = new CustomSpan('Test', mockUnregister, mockSync);
    const after = Date.now();

    // Start time should be between before and after
    expect((span as any).startTime).toBeGreaterThanOrEqual(before);
    expect((span as any).startTime).toBeLessThanOrEqual(after);
  });

  it('should mark span as ended', async () => {
    const span = new CustomSpan('Test Span', mockUnregister, mockSync);
    await span.end();

    expect(span.isEnded()).toBe(true);
  });

  it('should calculate duration', async () => {
    const span = new CustomSpan('Test Span', mockUnregister, mockSync);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await span.end();

    const duration = span.getDuration();
    expect(duration).toBeGreaterThan(90);
    expect(duration).toBeLessThan(200);
  });

  it('should be idempotent (multiple calls are safe)', async () => {
    const span = new CustomSpan('Test Span', mockUnregister, mockSync);
    await span.end();
    await span.end(); // Second call should not throw
    await span.end(); // Third call should not throw

    expect(span.isEnded()).toBe(true);
    // Should only call sync once
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('should call syncCustomSpan with correct arguments', async () => {
    const span = new CustomSpan('Test Span', mockUnregister, mockSync);
    // Add small delay to ensure end time is after start time
    await new Promise((resolve) => setTimeout(resolve, 10));
    await span.end();

    expect(mockUnregister).toHaveBeenCalledWith(span);
    expect(mockSync).toHaveBeenCalledTimes(1);
    const [name, start, end] = mockSync.mock.calls[0];
    expect(name).toBe('Test Span');
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
  });
});
