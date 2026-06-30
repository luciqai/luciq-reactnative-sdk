import React from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { store, type AppDispatch, type RootState } from '../../store';
import { addByAmount, decrement, increment, submitCheckout } from '../../store/counterSlice';

const ReduxDemo: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const value = useSelector((state: RootState) => state.counter.value);
  const lastNote = useSelector((state: RootState) => state.counter.lastNote);
  const loading = useSelector((state: RootState) => state.counter.loading);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Redux State Tracking</Text>
      <Text style={styles.hint}>
        Each dispatch below is recorded by the Luciq Redux middleware as an APM span (timing) and a
        breadcrumb (action type + payload size).
      </Text>

      <View style={styles.section}>
        <Text style={styles.value}>Count: {value}</Text>
        <Text style={styles.note}>Last checkout note: {lastNote || '-'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync actions</Text>
        <Button title="Increment" onPress={() => dispatch(increment())} />
        <Button title="Decrement" onPress={() => dispatch(decrement())} />
        <Button title="Add 5" onPress={() => dispatch(addByAmount(5))} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Async thunk (large payload)</Text>
        <Button
          title={loading ? 'Submitting...' : 'Submit Checkout'}
          disabled={loading}
          onPress={() => dispatch(submitCheckout('order-42'))}
        />
      </View>
    </ScrollView>
  );
};

export const ReduxScreen: React.FC = () => {
  return (
    <Provider store={store}>
      <ReduxDemo />
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
});
