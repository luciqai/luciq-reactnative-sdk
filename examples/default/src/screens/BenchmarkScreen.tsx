import React, { useState } from 'react';

import { Box, Button, Divider, HStack, ScrollView, Spinner, Text, VStack } from 'native-base';

import { runBridgeBenchmark } from '../utils/benchmark';
import type { BenchmarkResult, LatencyStats } from '../utils/benchmark';
import { BENCHMARK_ITERATIONS } from '../utils/benchmarkConfig';

const StatRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <HStack justifyContent="space-between" py={0.5}>
    <Text color="muted.500">{label}</Text>
    <Text fontFamily="mono">{value}</Text>
  </HStack>
);

const StatsBlock: React.FC<{ title: string; stats: LatencyStats }> = ({ title, stats }) => (
  <VStack space={1} mt={3}>
    <Text bold fontSize="md">
      {title}
    </Text>
    <StatRow label="samples" value={stats.samples} />
    <StatRow label="avg (ms)" value={stats.avgMs} />
    <StatRow label="p50 (ms)" value={stats.p50Ms} />
    <StatRow label="p90 (ms)" value={stats.p90Ms} />
    <StatRow label="p99 (ms)" value={stats.p99Ms} />
    <StatRow label="min (ms)" value={stats.minMs} />
    <StatRow label="max (ms)" value={stats.maxMs} />
  </VStack>
);

export const BenchmarkScreen: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await runBridgeBenchmark(BENCHMARK_ITERATIONS);
      setResult(res);
    } catch (error) {
      console.error('[BENCH] error', error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <ScrollView>
      <Box p={4}>
        <Text fontSize="lg" bold>
          Bridge Benchmark
        </Text>
        <Text color="muted.500" mb={3}>
          Old Arch (NativeModules) vs New Arch (TurboModules / JSI). Runs {BENCHMARK_ITERATIONS}{' '}
          iterations per metric. Results also print as [BENCH] lines to the console.
        </Text>

        <Button onPress={run} isDisabled={running}>
          {running ? 'Running...' : 'Run benchmark'}
        </Button>

        {running && (
          <HStack space={2} mt={4} alignItems="center">
            <Spinner />
            <Text>Measuring bridge latency...</Text>
          </HStack>
        )}

        {result && (
          <Box mt={4}>
            <Divider my={2} />
            <StatRow label="architecture" value={result.arch} />
            <StatRow label="iterations" value={result.iterations} />
            <StatRow label="TTI (ms)" value={result.ttiMs ?? 'n/a'} />
            <StatsBlock title="Void dispatch (JS -> native)" stats={result.voidDispatch} />
            <StatsBlock title="Round trip (JS -> native -> JS)" stats={result.roundTrip} />
          </Box>
        )}
      </Box>
    </ScrollView>
  );
};
