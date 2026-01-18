import React, { useState } from 'react';

import { SessionReplay, CapturingMode, ScreenshotQuality } from '@luciq/react-native';
import { useToast, VStack } from 'native-base';

import { ListTile } from '../components/ListTile';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { Select } from '../components/Select';
import { InputField } from '../components/InputField';
import { CustomButton } from '../components/CustomButton';
import { UserStepsState } from './settings/UserStepsStateScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeStack';

const capturingModeItems = [
  { label: 'Navigation', value: CapturingMode.navigation, isInitial: true },
  { label: 'Interactions', value: CapturingMode.interactions },
  { label: 'Frequency', value: CapturingMode.frequency },
];

const screenshotQualityItems = [
  { label: 'High', value: ScreenshotQuality.high },
  { label: 'Normal', value: ScreenshotQuality.normal, isInitial: true },
  { label: 'Greyscale', value: ScreenshotQuality.greyscale },
];

export const SessionReplayScreen: React.FC<
  NativeStackScreenProps<HomeStackParamList, 'SessionReplay'>
> = ({ navigation }) => {
  const toast = useToast();

  const [isSessionReplayEnabled, setIsSessionReplayEnabled] = useState<boolean>(true);
  const [isSessionNetworkLogsEnabled, setIsSessionNetworkLogsEnabled] = useState<boolean>(true);
  const [isSessionLuciqLogsEnabled, setIsSessionLuciqLogsEnabled] = useState<boolean>(true);
  const [isSessionUserStepsEnabled, setIsSessionUSerStepsEnabled] = useState<boolean>(true);
  const [captureInterval, setCaptureInterval] = useState<string>('1000');

  return (
    <Screen>
      <ListTile
        title="Show Current Session link"
        onPress={async () => {
          const link = await SessionReplay.getSessionReplayLink();
          if (link === null) {
            toast.show({
              description: 'link not found',
            });
          } else {
            toast.show({
              description: link,
            });
          }
        }}
      />

      <ListTile
        title="Session Replay Enable"
        subtitle={isSessionReplayEnabled ? 'Enabled' : 'Disabled'}
        onPress={() => {
          navigation.navigate('UserStepsState', {
            state: isSessionReplayEnabled ? UserStepsState.Enabled : UserStepsState.Disabled,
            setState: (newState: UserStepsState) => {
              const isEnabled = newState === UserStepsState.Enabled;
              setIsSessionReplayEnabled(isEnabled);
              SessionReplay.setEnabled(isEnabled);
              navigation.goBack();
            },
          });
        }}
        testID="id_steps_replay_state"
      />

      <ListTile
        title="Session Replay Network Enable"
        subtitle={isSessionNetworkLogsEnabled ? 'Enabled' : 'Disabled'}
        onPress={() => {
          navigation.navigate('UserStepsState', {
            state: isSessionNetworkLogsEnabled ? UserStepsState.Enabled : UserStepsState.Disabled,
            setState: (newState: UserStepsState) => {
              const isEnabled = newState === UserStepsState.Enabled;
              setIsSessionNetworkLogsEnabled(isEnabled);
              SessionReplay.setNetworkLogsEnabled(isEnabled);
              navigation.goBack();
            },
          });
        }}
        testID="id_steps_replay_network_state"
      />

      <ListTile
        title="Session Replay Luciq Logs Enable"
        subtitle={isSessionLuciqLogsEnabled ? 'Enabled' : 'Disabled'}
        onPress={() => {
          navigation.navigate('UserStepsState', {
            state: isSessionLuciqLogsEnabled ? UserStepsState.Enabled : UserStepsState.Disabled,
            setState: (newState: UserStepsState) => {
              const isEnabled = newState === UserStepsState.Enabled;
              setIsSessionLuciqLogsEnabled(isEnabled);
              SessionReplay.setLuciqLogsEnabled(isEnabled);
              navigation.goBack();
            },
          });
        }}
        testID="id_steps_replay_luciq_lgos_state"
      />

      <ListTile
        title="Session Replay UserSteps Enable"
        subtitle={isSessionUserStepsEnabled ? 'Enabled' : 'Disabled'}
        onPress={() => {
          navigation.navigate('UserStepsState', {
            state: isSessionUserStepsEnabled ? UserStepsState.Enabled : UserStepsState.Disabled,
            setState: (newState: UserStepsState) => {
              const isEnabled = newState === UserStepsState.Enabled;
              setIsSessionUSerStepsEnabled(isEnabled);
              SessionReplay.setUserStepsEnabled(isEnabled);
              navigation.goBack();
            },
          });
        }}
        testID="id_steps_replay_usersteps_state"
      />

      <Section title="Video-like Session Replay">
        <VStack space={3}>
          <Select
            label="Capturing Mode"
            items={capturingModeItems}
            onValueChange={(mode) => {
              SessionReplay.setCapturingMode(mode);
              toast.show({
                description: 'Capturing mode set',
              });
            }}
            testID="id_capturing_mode"
          />

          <Select
            label="Screenshot Quality"
            items={screenshotQualityItems}
            onValueChange={(quality) => {
              SessionReplay.setScreenshotQuality(quality);
              toast.show({
                description: 'Screenshot quality set',
              });
            }}
            testID="id_screenshot_quality"
          />

          <InputField
            placeholder="Capture Interval (ms) - min 500"
            value={captureInterval}
            keyboardType="numeric"
            onChangeText={(text) => {
              setCaptureInterval(text);
            }}
            testID="id_capture_interval"
          />

          <CustomButton
            title="Set Capture Interval"
            onPress={() => {
              const interval = parseInt(captureInterval, 10);
              if (!isNaN(interval) && interval >= 500) {
                SessionReplay.setScreenshotCaptureInterval(interval);
                toast.show({
                  description: 'Capture interval set to ' + interval + 'ms',
                });
              } else {
                toast.show({
                  description: 'Invalid interval. Minimum is 500ms',
                });
              }
            }}
          />
        </VStack>
      </Section>
    </Screen>
  );
};
