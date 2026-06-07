import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ErrorInfo, ReactNode } from 'react';

import * as BugReporting from '../modules/BugReporting';
import * as CrashReporting from '../modules/CrashReporting';
import type { NonFatalOptions } from '../models/NonFatalOptions';
import { InvocationOption, ReportType } from '../utils/Enums';
import { Logger } from '../utils/logger';

export interface LuciqErrorBoundaryFallbackProps {
  /**
   * The error that was caught during rendering.
   */
  error: Error;
  /**
   * The React component stack trace where the error originated.
   */
  componentStack: string | null;
  /**
   * Resets the error boundary state and re-renders the children.
   */
  resetError: () => void;
}

export interface LuciqErrorBoundaryProps {
  children: ReactNode;
  /**
   * A custom component rendered when a render error is caught. Receives the
   * error, the component stack trace, and a `resetError` callback.
   */
  FallbackComponent?: React.ComponentType<LuciqErrorBoundaryFallbackProps>;
  /**
   * Called after the error is reported to Luciq. Use it for custom side
   * effects such as logging or navigation.
   */
  onError?: (error: Error, componentStack: string | null) => void;
  /**
   * When `true`, the bug reporting UI is shown automatically once a render
   * error is caught. Defaults to `false`.
   */
  showBugReporting?: boolean;
  /**
   * Extra configuration forwarded to `CrashReporting.reportError`.
   */
  nonFatalOptions?: NonFatalOptions;
}

interface LuciqErrorBoundaryState {
  error: Error | null;
  componentStack: string | null;
}

/**
 * A React error boundary that catches rendering errors, reports them to Luciq
 * as non-fatal crashes, and optionally renders a fallback UI.
 */
export class LuciqErrorBoundary extends React.Component<
  LuciqErrorBoundaryProps,
  LuciqErrorBoundaryState
> {
  state: LuciqErrorBoundaryState = {
    error: null,
    componentStack: null,
  };

  static getDerivedStateFromError(error: Error): Partial<LuciqErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentStack = errorInfo.componentStack ?? null;
    this.setState({ componentStack });

    try {
      const { nonFatalOptions, showBugReporting, onError } = this.props;

      // Attach the React component stack as context on the non-fatal report.
      const userAttributes = {
        ...nonFatalOptions?.userAttributes,
        ...(componentStack ? { componentStack } : {}),
      };

      CrashReporting.reportError(error, { ...nonFatalOptions, userAttributes });

      if (showBugReporting) {
        BugReporting.show(ReportType.bug, [InvocationOption.emailFieldOptional]);
      }

      onError?.(error, componentStack);
    } catch (reportingError) {
      Logger.error('[LuciqErrorBoundary] Failed to report render error:', reportingError);
    }
  }

  resetError = () => {
    this.setState({ error: null, componentStack: null });
  };

  render() {
    const { error, componentStack } = this.state;

    if (error) {
      const { FallbackComponent } = this.props;

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            componentStack={componentStack}
            resetError={this.resetError}
          />
        );
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
