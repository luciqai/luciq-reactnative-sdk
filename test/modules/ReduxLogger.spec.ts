import { NativeAPM } from '../../src/native/NativeAPM';
import { NativeLuciq } from '../../src/native/NativeLuciq';
import { createReduxMiddleware } from '../../src/modules/ReduxLogger';

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const setupDispatch = (
  middleware: ReturnType<typeof createReduxMiddleware>,
  next: (action: unknown) => unknown = (action) => action,
) => {
  const nextSpy = jest.fn(next);
  const dispatch = middleware({ getState: jest.fn(() => ({})), dispatch: jest.fn() })(nextSpy);
  return { dispatch, nextSpy };
};

describe('ReduxLogger Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the action to next and returns its result', () => {
    const { dispatch, nextSpy } = setupDispatch(createReduxMiddleware(), () => 'result');
    const action = { type: 'TEST_ACTION', payload: 1 };

    const result = dispatch(action);

    expect(nextSpy).toBeCalledTimes(1);
    expect(nextSpy).toBeCalledWith(action);
    expect(result).toBe('result');
  });

  it('logs a breadcrumb with the action type and payload size', () => {
    const { dispatch } = setupDispatch(createReduxMiddleware());

    dispatch({ type: 'TEST_ACTION', payload: 'data' });

    expect(NativeLuciq.logUserEvent).toBeCalledTimes(1);
    expect(NativeLuciq.logUserEvent).toBeCalledWith(expect.stringContaining('Redux: TEST_ACTION'));
    expect(NativeLuciq.logUserEvent).toBeCalledWith(expect.stringMatching(/\(\d+B\)$/));
  });

  it('records an APM span named after the action type', async () => {
    const { dispatch } = setupDispatch(createReduxMiddleware());

    dispatch({ type: 'TEST_ACTION' });
    await flushPromises();

    expect(NativeAPM.syncCustomSpan).toBeCalledTimes(1);
    const [name, startMicros, endMicros] = (NativeAPM.syncCustomSpan as jest.Mock).mock.calls[0];
    expect(name).toBe('Redux: TEST_ACTION');
    expect(endMicros).toBeGreaterThan(startMicros);
  });

  it('ignores thunk (function) actions', async () => {
    const { dispatch, nextSpy } = setupDispatch(createReduxMiddleware());

    dispatch(() => {});
    await flushPromises();

    expect(nextSpy).toBeCalledTimes(1);
    expect(NativeLuciq.logUserEvent).not.toBeCalled();
    expect(NativeAPM.syncCustomSpan).not.toBeCalled();
  });

  it('ignores actions without a string type', async () => {
    const { dispatch, nextSpy } = setupDispatch(createReduxMiddleware());

    dispatch({ type: 123 });
    await flushPromises();

    expect(nextSpy).toBeCalledTimes(1);
    expect(NativeLuciq.logUserEvent).not.toBeCalled();
    expect(NativeAPM.syncCustomSpan).not.toBeCalled();
  });

  it('skips actions rejected by actionFilter', async () => {
    const actionFilter = jest.fn((action: { type: unknown }) => action.type !== 'IGNORED');
    const { dispatch } = setupDispatch(createReduxMiddleware({ actionFilter }));

    dispatch({ type: 'IGNORED' });
    await flushPromises();

    expect(actionFilter).toBeCalledTimes(1);
    expect(NativeLuciq.logUserEvent).not.toBeCalled();
    expect(NativeAPM.syncCustomSpan).not.toBeCalled();
  });

  it('respects the spans and breadcrumbs flags', async () => {
    const { dispatch } = setupDispatch(createReduxMiddleware({ spans: false, breadcrumbs: true }));

    dispatch({ type: 'TEST_ACTION' });
    await flushPromises();

    expect(NativeLuciq.logUserEvent).toBeCalledTimes(1);
    expect(NativeAPM.syncCustomSpan).not.toBeCalled();
  });

  it('uses a custom name prefix', async () => {
    const { dispatch } = setupDispatch(createReduxMiddleware({ namePrefix: 'MyStore' }));

    dispatch({ type: 'TEST_ACTION' });
    await flushPromises();

    expect(NativeLuciq.logUserEvent).toBeCalledWith(
      expect.stringContaining('MyStore: TEST_ACTION'),
    );
    expect(NativeAPM.syncCustomSpan).toBeCalledWith(
      'MyStore: TEST_ACTION',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('measures async thunk duration after the promise settles', async () => {
    let resolveThunk: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      resolveThunk = resolve;
    });
    const { dispatch } = setupDispatch(createReduxMiddleware(), () => pending);

    dispatch({ type: 'ASYNC_ACTION' });
    await flushPromises();
    expect(NativeAPM.syncCustomSpan).not.toBeCalled();

    resolveThunk();
    await flushPromises();
    expect(NativeAPM.syncCustomSpan).toBeCalledWith(
      'Redux: ASYNC_ACTION',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('records the span and rethrows when next throws', async () => {
    const error = new Error('reducer failed');
    const { dispatch } = setupDispatch(createReduxMiddleware(), () => {
      throw error;
    });

    expect(() => dispatch({ type: 'TEST_ACTION' })).toThrow(error);
    await flushPromises();

    expect(NativeAPM.syncCustomSpan).toBeCalledWith(
      'Redux: TEST_ACTION',
      expect.any(Number),
      expect.any(Number),
    );
  });
});
