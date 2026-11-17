import React, { useState } from 'react';

import { BugReporting } from '@luciq/react-native';
import { Button, Input, Text, VStack, useToast } from 'native-base';

import { Screen } from '../../components/Screen';

/**
 * Narrows the report categories the SDK shows (and `getReportConfiguration`
 * returns) to the identifiers typed here, comma separated. Clearing passes
 * `null`, which shows every category again.
 */
export const CategoriesScopeScreen: React.FC = () => {
  const toast = useToast();
  const [text, setText] = useState('');
  const [applied, setApplied] = useState<string[] | null>(null);

  const apply = () => {
    const identifiers = text
      .split(',')
      .map((identifier) => identifier.trim())
      .filter((identifier) => identifier.length > 0);
    BugReporting.setReportCategoriesScope(identifiers);
    setApplied(identifiers);
    toast.show({ description: `Scope set to ${identifiers.length} identifier(s)` });
  };

  const clear = () => {
    BugReporting.setReportCategoriesScope(null);
    setApplied(null);
    setText('');
    toast.show({ description: 'Scope cleared' });
  };

  return (
    <Screen>
      <VStack space={4} p={4}>
        <Text fontSize="xs" color="coolGray.600">
          Category identifiers from the dashboard (Report Categories), comma separated. One match is
          preselected; no match shows all categories.
        </Text>
        <Input
          placeholder="checkout, checkout-refund"
          value={text}
          onChangeText={setText}
          autoCapitalize="none"
          autoCorrect={false}
          testID="id_scope_input"
          accessibilityLabel="id_scope_input"
        />
        <Button onPress={apply} testID="id_scope_apply" accessibilityLabel="id_scope_apply">
          Apply scope
        </Button>
        <Button
          colorScheme="danger"
          onPress={clear}
          testID="id_scope_clear"
          accessibilityLabel="id_scope_clear">
          Clear scope (all categories)
        </Button>
        <Text testID="id_scope_current" accessibilityLabel="id_scope_current">
          Current scope: {applied == null ? 'all categories' : applied.join(', ') || '(empty)'}
        </Text>
      </VStack>
    </Screen>
  );
};
