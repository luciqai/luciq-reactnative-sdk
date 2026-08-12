import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

import * as BugReporting from '../../src/modules/BugReporting';
import * as CrashReporting from '../../src/modules/CrashReporting';
import { LuciqErrorBoundary } from '../../src/components/LuciqErrorBoundary';
import { InvocationOption, ReportType } from '../../src/utils/Enums';
import type { LuciqErrorBoundaryFallbackProps } from '../../src/components/LuciqErrorBoundary';

jest.mock('../../src/modules/CrashReporting');
jest.mock('../../src/modules/BugReporting');
jest.mock('../../src/utils/logger', () => ({
  Logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockReportError = CrashReporting.reportError as jest.Mock;
const mockShow = BugReporting.show as jest.Mock;

const Boom = ({ message = 'render failure' }: { message?: string }) => {
  throw new Error(message);
};

const Safe = () => <Text>safe</Text>;

describe('LuciqErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    // React logs caught errors to console.error; silence to keep test output clean.
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when there is no error', () => {
    render(
      <LuciqErrorBoundary>
        <Safe />
      </LuciqErrorBoundary>,
    );

    expect(screen.getByText('safe')).toBeTruthy();
    expect(mockReportError).not.toBeCalled();
  });

  it('reports caught render errors to CrashReporting with the component stack', () => {
    render(
      <LuciqErrorBoundary>
        <Boom message="kaboom" />
      </LuciqErrorBoundary>,
    );

    expect(mockReportError).toBeCalledTimes(1);
    const [error, options] = mockReportError.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('kaboom');
    expect(typeof options.userAttributes.componentStack).toBe('string');
  });

  it('renders the default fallback UI on error', () => {
    render(
      <LuciqErrorBoundary>
        <Boom />
      </LuciqErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong.')).toBeTruthy();
  });

  it('renders a custom FallbackComponent with error and resetError', () => {
    const Fallback = ({ error, resetError }: LuciqErrorBoundaryFallbackProps) => (
      <>
        <Text>custom: {error.message}</Text>
        <Text onPress={resetError}>reset</Text>
      </>
    );

    render(
      <LuciqErrorBoundary FallbackComponent={Fallback}>
        <Boom message="custom-error" />
      </LuciqErrorBoundary>,
    );

    expect(screen.getByText('custom: custom-error')).toBeTruthy();
  });

  it('shows the bug reporting UI when showBugReporting is true', () => {
    render(
      <LuciqErrorBoundary showBugReporting>
        <Boom />
      </LuciqErrorBoundary>,
    );

    expect(mockShow).toBeCalledTimes(1);
    expect(mockShow).toBeCalledWith(ReportType.bug, [InvocationOption.emailFieldOptional]);
  });

  it('does not show the bug reporting UI by default', () => {
    render(
      <LuciqErrorBoundary>
        <Boom />
      </LuciqErrorBoundary>,
    );

    expect(mockShow).not.toBeCalled();
  });

  it('invokes the onError callback with the error and component stack', () => {
    const onError = jest.fn();

    render(
      <LuciqErrorBoundary onError={onError}>
        <Boom message="cb" />
      </LuciqErrorBoundary>,
    );

    expect(onError).toBeCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe('cb');
    expect(typeof onError.mock.calls[0][1]).toBe('string');
  });

  it('merges nonFatalOptions while attaching the component stack', () => {
    render(
      <LuciqErrorBoundary nonFatalOptions={{ fingerprint: 'fp', userAttributes: { foo: 'bar' } }}>
        <Boom />
      </LuciqErrorBoundary>,
    );

    const [, options] = mockReportError.mock.calls[0];
    expect(options.fingerprint).toBe('fp');
    expect(options.userAttributes.foo).toBe('bar');
    expect(typeof options.userAttributes.componentStack).toBe('string');
  });

  it('recovers and renders children after resetError is called', () => {
    let shouldThrow = true;
    const Conditional = () => {
      if (shouldThrow) {
        throw new Error('once');
      }
      return <Text>recovered</Text>;
    };

    const Fallback = ({ resetError }: LuciqErrorBoundaryFallbackProps) => (
      <Text onPress={resetError}>reset</Text>
    );

    render(
      <LuciqErrorBoundary FallbackComponent={Fallback}>
        <Conditional />
      </LuciqErrorBoundary>,
    );

    expect(screen.getByText('reset')).toBeTruthy();

    shouldThrow = false;
    fireEvent.press(screen.getByText('reset'));

    expect(screen.getByText('recovered')).toBeTruthy();
  });
});
