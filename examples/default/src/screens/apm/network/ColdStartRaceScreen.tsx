import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NetworkLogger } from '@luciq/react-native';
import { Screen } from '../../../components/Screen';
import { Section } from '../../../components/Section';
import { CustomButton } from '../../../components/CustomButton';
import {
  COLD_START_BURST_URLS,
  ColdStartTelemetry,
  fireColdStartBurst,
  type ColdStartEntry,
} from '../../../utils/coldStartTelemetry';
import { VStack } from 'native-base';

/**
 * Reproduces INSD-14886. On Android without the Luciq.ts fix, requests
 * fired immediately after Luciq.init() bypass the JS XHR interceptor and
 * never reach APM. This screen shows the burst fired from App.tsx at
 * cold-start and lets you re-run the same race in-session by toggling the
 * interceptor off, firing requests, and toggling it back on.
 */
export const ColdStartRaceScreen: React.FC = () => {
  const [entries, setEntries] = useState<ColdStartEntry[]>(ColdStartTelemetry.snapshot());

  useEffect(() => {
    return ColdStartTelemetry.subscribe(setEntries);
  }, []);

  const fired = entries.length;
  const captured = entries.filter((e) => e.capturedAt !== null).length;
  const missed = fired - captured;

  const runSimulatedRace = () => {
    // Reproduces the cold-start window in-session: turn the JS XHR
    // interceptor off, fire the burst, then turn it back on. Any request
    // that opens while the interceptor is off is missed — exactly what
    // happens at cold-start on Android before the fix.
    NetworkLogger.setEnabled(false);
    fireColdStartBurst();
    // Re-enable on the next tick so the burst's open()/send() calls have
    // already gone through the un-patched XHR prototype.
    setTimeout(() => NetworkLogger.setEnabled(true), 0);
  };

  const runWithInterceptorOn = () => {
    // Baseline: interceptor is on, burst should be 100% captured.
    NetworkLogger.setEnabled(true);
    fireColdStartBurst();
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Screen>
        <Section title="What this reproduces">
          <Text style={styles.body}>
            INSD-14886 (Discogs). On Android, before the fix in src/modules/Luciq.ts, the JS XHR
            interceptor was only enabled inside the asynchronous{' '}
            <Text style={styles.code}>LCQ_ON_FEATURES_UPDATED_CALLBACK</Text> handler. Requests
            fired between Luciq.init() returning and that callback arriving never hit the
            interceptor — BR/SR still showed them (native auto-instrumented OkHttp), but APM did
            not.
          </Text>
          <Text style={styles.body}>
            On cold-start, App.tsx fires {COLD_START_BURST_URLS.length} REST requests immediately
            after Luciq.init(). Each captured request bumps the counter via the
            NetworkLogger.setNetworkDataObfuscationHandler installed in App.tsx. Missed = JS
            interceptor was not yet patching XMLHttpRequest when the request opened.
          </Text>
        </Section>

        <Section title="Cold-start results (this session)">
          <View style={styles.statRow}>
            <Stat label="Fired" value={fired} tone="neutral" />
            <Stat label="Captured" value={captured} tone="good" />
            <Stat label="Missed" value={missed} tone={missed === 0 ? 'good' : 'bad'} />
          </View>
          <Text style={styles.hint}>
            Expected after the fix: Captured == Fired. Before the fix on Android, Captured is
            typically 0 for the cold-start burst.
          </Text>
        </Section>

        <Section title="Per-URL detail">
          {entries.length === 0 ? (
            <Text style={styles.body}>
              No requests recorded yet. Cold-start auto-fires from App.tsx; you can also use the
              buttons below.
            </Text>
          ) : (
            entries.map((entry, idx) => (
              <View key={`${entry.url}-${entry.firedAt}-${idx}`} style={styles.urlRow}>
                <Text style={[styles.dot, entry.capturedAt ? styles.dotGood : styles.dotBad]}>
                  ●
                </Text>
                <View style={styles.urlBlock}>
                  <Text style={styles.url} numberOfLines={1} ellipsizeMode="middle">
                    {entry.url}
                  </Text>
                  <Text style={styles.urlMeta}>
                    {entry.capturedAt
                      ? `captured +${entry.capturedAt - entry.firedAt}ms`
                      : 'missed by JS interceptor'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Section>

        <Section title="Re-run in-session">
          <VStack space="xs">
            <Text style={styles.body}>
              Simulate the race window without restarting the app. The first button disables the JS
              interceptor, fires the burst, then re-enables it — mirroring the cold-start gap. The
              second button is the baseline (interceptor stays on).
            </Text>
            <CustomButton onPress={runSimulatedRace} title="Simulate cold-start race" />
            <CustomButton
              onPress={runWithInterceptorOn}
              title="Baseline: fire with interceptor on"
            />
            <CustomButton onPress={() => ColdStartTelemetry.reset()} title="Reset telemetry" />
          </VStack>
        </Section>
      </Screen>
    </ScrollView>
  );
};

const Stat: React.FC<{ label: string; value: number; tone: 'good' | 'bad' | 'neutral' }> = ({
  label,
  value,
  tone,
}) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text
      style={[
        styles.statValue,
        tone === 'good' && styles.statGood,
        tone === 'bad' && styles.statBad,
      ]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  body: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 6,
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#111827',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  statGood: {
    color: '#16A34A',
  },
  statBad: {
    color: '#DC2626',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  dot: {
    fontSize: 14,
    marginRight: 8,
  },
  dotGood: {
    color: '#16A34A',
  },
  dotBad: {
    color: '#DC2626',
  },
  urlBlock: {
    flex: 1,
  },
  url: {
    fontSize: 12,
    color: '#111827',
  },
  urlMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
