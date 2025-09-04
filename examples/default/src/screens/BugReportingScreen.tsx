import React from 'react';

import Luciq, {
  BugReporting,
  InvocationOption,
  ReportType,
  ExtendedBugReportMode,
  WelcomeMessageMode,
} from '@luciq/react-native';

import { ListTile } from '../components/ListTile';
import { Screen } from '../components/Screen';
import { useToast } from 'native-base';
import { Section } from '../components/Section';

export const BugReportingScreen: React.FC = () => {
  const toast = useToast();
  return (
    <Screen>
      <ListTile title="Show" onPress={() => Luciq.show()} />
      <ListTile title="Send Bug Report" onPress={() => BugReporting.show(ReportType.bug, [])} />
      <ListTile
        title="Send Feedback"
        onPress={() => BugReporting.show(ReportType.feedback, [InvocationOption.emailFieldHidden])}
      />
      <ListTile title="Ask a Question" onPress={() => BugReporting.show(ReportType.question, [])} />
      <ListTile
        title="Enable extended bug report with required fields"
        onPress={() =>
          BugReporting.setExtendedBugReportMode(ExtendedBugReportMode.enabledWithRequiredFields)
        }
      />
      <ListTile
        title="Enable extended bug report with optional fields"
        onPress={() =>
          BugReporting.setExtendedBugReportMode(ExtendedBugReportMode.enabledWithOptionalFields)
        }
      />
      <ListTile
        title="Disable session profiler"
        onPress={() => Luciq.setSessionProfilerEnabled(true)}
      />
      <ListTile
        title="Welcome message Beta"
        onPress={() => Luciq.showWelcomeMessage(WelcomeMessageMode.beta)}
      />
      <ListTile
        title="Welcome message Live"
        onPress={() => Luciq.showWelcomeMessage(WelcomeMessageMode.live)}
      />

      <Section title="Handlers">
        <ListTile
          title="On invocation add tag"
          onPress={() =>
            BugReporting.onInvokeHandler(function () {
              Luciq.appendTags(['Invocation Handler tag1']);
            })
          }
        />
        <ListTile
          title="On submission show toast message"
          onPress={() =>
            Luciq.onReportSubmitHandler(() => {
              toast.show({
                description: 'Submission succeeded',
              });
            })
          }
        />
        <ListTile
          title="On dismissing turn floating to red"
          onPress={() =>
            BugReporting.onSDKDismissedHandler(function () {
              Luciq.setPrimaryColor('#FF0000');
            })
          }
        />
      </Section>
    </Screen>
  );
};
