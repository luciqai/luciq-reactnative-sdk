import React, { useState } from 'react';
import { Platform, ScrollView } from 'react-native';

import { CrashReporting } from '@luciq/react-native';

import { ListTile } from '../components/ListTile';
import { Screen } from '../components/Screen';
import { Divider } from 'native-base';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/HomeStack';

export const CrashReportingScreen: React.FC<
  NativeStackScreenProps<HomeStackParamList, 'CrashReporting'>
> = ({ navigation }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isNDKEnabled, setIsNDKEnabled] = useState(true);

  return (
    <ScrollView>
      <Screen>
        <ListTile
          title="Crash Reporting State"
          subtitle={isEnabled ? 'Enabled' : 'Disabled'}
          onPress={() => {
            navigation.navigate('CrashReportingState', {
              isEnabled,
              setIsEnabled: (enabled: boolean) => {
                setIsEnabled(enabled);
                CrashReporting.setEnabled(enabled);
                navigation.goBack();
              },
            });
          }}
          testID="id_cr_state"
        />

        {Platform.OS === 'android' && (
          <ListTile
            title="NDK Crashes State"
            subtitle={isNDKEnabled ? 'Enabled' : 'Disabled'}
            onPress={() => {
              navigation.navigate('NDKCrashesState', {
                isEnabled: isNDKEnabled,
                setIsEnabled: (enabled: boolean) => {
                  setIsNDKEnabled(enabled);
                  CrashReporting.setNDKCrashesEnabled(enabled);
                  navigation.goBack();
                },
              });
            }}
            testID="id_ndk_cr_state"
          />
        )}

        <Divider my={5} />

        <ListTile
          title="Non-Fatal Crashes"
          onPress={() => navigation.navigate('NonFatalCrashes')}
          testID="id_non_fatal_crashes"
        />

        <ListTile
          title="Fatal Crashes"
          onPress={() => navigation.navigate('FatalCrashes')}
          testID="id_fatal_crashes"
        />

        <Divider my={5} />

        <ListTile
          title="Enable JS Hang Detection"
          subtitle="Release builds only"
          onPress={() => CrashReporting.setJSHangEnabled(true)}
          testID="id_js_hang_enable"
        />

        <ListTile
          title="Block JS Thread (6s)"
          subtitle="Recovered hang: reported after recovery"
          onPress={() => blockJSThread(6000)}
          testID="id_js_hang_block_6s"
        />

        <ListTile
          title="Block JS Thread (2s)"
          subtitle="Below the default threshold: no report expected"
          onPress={() => blockJSThread(2000)}
          testID="id_js_hang_block_2s"
        />

        <ListTile
          title="Block JS Thread via Call Chain (6s)"
          subtitle="Deep stack: handleIncomingMessage -> ... -> spinCore"
          onPress={() => handleIncomingMessage(6000)}
          testID="id_js_hang_block_chain_6s"
        />

        <ListTile
          title="Throw Non-Fatal via Call Chain"
          subtitle="Same chain shape, thrown error instead of a hang"
          onPress={() => handleIncomingMessageThrow('button')}
          testID="id_js_nonfatal_chain"
        />

        <ListTile
          title="Block JS Thread (20s)"
          subtitle="Kill the app mid-hang to test fatal reporting"
          onPress={() => blockJSThread(20000)}
          testID="id_js_hang_block_20s"
        />
      </Screen>
    </ScrollView>
  );
};

// Named functions so the Hermes sampling profiler trace shows a readable
// culprit stack (blockJSThread -> spinOnJSThread) when validating JS hangs.
function spinOnJSThread(end: number) {
  while (Date.now() < end) {}
}

function blockJSThread(durationMs: number) {
  spinOnJSThread(Date.now() + durationMs);
}

// Deep-chain hang: validates that the sampled stack carries the full call
// chain, not just the innermost spin frame. Each function does distinct work
// with the return value so hermesc cannot inline the frames away.
function spinCore(end: number): number {
  let ticks = 0;
  while (Date.now() < end) {
    ticks++;
  }
  return ticks;
}

function processHeavyBatch(end: number): number {
  const ticks = spinCore(end);
  return ticks + 1;
}

function transformPayload(end: number): number {
  const result = processHeavyBatch(end);
  return result * 2;
}

export function handleIncomingMessage(durationMs: number): number {
  return transformPayload(Date.now() + durationMs);
}

// Throwing twin of the hang chain: identical call shape, but the core throws
// instead of spinning, and the error is reported as a handled non-fatal.
// Lets the hang stack and the handled-crash stack be compared 1:1.
function throwCore(marker: string): number {
  throw new Error(`JS chain non-fatal check (${marker}): thrown from throwCore`);
}

function processHeavyBatchThrow(marker: string): number {
  const value = throwCore(marker);
  return value + 1;
}

function transformPayloadThrow(marker: string): number {
  const result = processHeavyBatchThrow(marker);
  return result * 2;
}

export function handleIncomingMessageThrow(marker: string): void {
  try {
    transformPayloadThrow(marker);
  } catch (err) {
    CrashReporting.reportError(err as Error);
  }
}
