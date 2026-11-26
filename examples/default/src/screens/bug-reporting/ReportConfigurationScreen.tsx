import React, { useState } from 'react';

import {
  BugReporting,
  ReportType,
  type ConfigurationCategory,
  type ReportConfiguration,
} from '@luciq/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ScrollView, Text, VStack, useToast } from 'native-base';

import { ListTile } from '../../components/ListTile';
import { Screen } from '../../components/Screen';
import { Section } from '../../components/Section';
import { Select } from '../../components/Select';
import type { HomeStackParamList } from '../../navigation/HomeStack';

const reportTypeLabel = (type: ReportType) => {
  switch (type) {
    case ReportType.bug:
      return 'bug';
    case ReportType.feedback:
      return 'feedback';
    case ReportType.question:
      return 'question';
    default:
      return String(type);
  }
};

/**
 * Fetches `BugReporting.getReportConfiguration` for a report type and renders
 * the category tree and requirements. Tapping a leaf opens the custom report
 * form with that category and its fields.
 */
export const ReportConfigurationScreen: React.FC<
  NativeStackScreenProps<HomeStackParamList, 'ReportConfiguration'>
> = ({ navigation }) => {
  const toast = useToast();
  const [reportType, setReportType] = useState<ReportType>(ReportType.bug);
  const [configuration, setConfiguration] = useState<ReportConfiguration | null | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
      const result = await BugReporting.getReportConfiguration(reportType);
      setConfiguration(result);
      toast.show({
        description: result ? `${result.categories.length} top-level categories` : 'Unavailable',
      });
    } catch (error) {
      toast.show({ description: `Rejected: ${(error as Error).message}` });
    } finally {
      setLoading(false);
    }
  };

  const openForm = (category: ConfigurationCategory) => {
    navigation.navigate('CustomReport', {
      reportType,
      categoryIdentifier: category.identifier,
      fields: category.fields,
    });
  };

  const renderCategory = (category: ConfigurationCategory, depth: number) => (
    <VStack key={category.identifier} pl={depth * 4}>
      <ListTile
        title={`${category.leaf ? '• ' : '▸ '}${category.title}`}
        subtitle={`${category.identifier}${category.leaf ? ` · ${category.fields.length} field(s)` : ''}`}
        onPress={category.leaf ? () => openForm(category) : undefined}
        testID={`id_category_${category.identifier}`}
      />
      {category.children.map((child) => renderCategory(child, depth + 1))}
    </VStack>
  );

  return (
    <ScrollView flex={1} bg="gray.100">
      <Screen>
        <VStack space={4} p={2}>
          <Select
            label="Report type"
            testID="id_config_report_type"
            items={[
              { label: 'Bug', value: ReportType.bug, isInitial: true },
              { label: 'Feedback', value: ReportType.feedback },
              { label: 'Question', value: ReportType.question },
            ]}
            onValueChange={setReportType}
          />
          <Button
            onPress={fetchConfiguration}
            isLoading={loading}
            testID="id_config_fetch"
            accessibilityLabel="id_config_fetch">
            {`Get report configuration (${reportTypeLabel(reportType)})`}
          </Button>

          {configuration === null && (
            <Text testID="id_config_unavailable">
              Unavailable: custom reports aren't turned on for this app by the server, or Bug
              Reporting or this report type is not available.
            </Text>
          )}

          {configuration && (
            <>
              <Section title="Requirements">
                <Text testID="id_config_requirements" fontSize="xs">
                  {JSON.stringify(configuration.requirements, null, 2)}
                </Text>
              </Section>

              {configuration.preselectedCategory && (
                <Section title="Preselected category">
                  <Text fontSize="xs">
                    {configuration.preselectedCategory.title} (
                    {configuration.preselectedCategory.identifier})
                  </Text>
                </Section>
              )}

              <Section title="Categories (tap a leaf to submit a report)">
                {configuration.categories.length === 0 ? (
                  <Text fontSize="xs">
                    No categories: this report type has none, or they aren't downloaded yet.
                  </Text>
                ) : (
                  configuration.categories.map((category) => renderCategory(category, 0))
                )}
              </Section>

              <Button
                variant="outline"
                onPress={() => navigation.navigate('CustomReport', { reportType })}
                testID="id_config_submit_without_category">
                Submit a report without a category
              </Button>
            </>
          )}
        </VStack>
      </Screen>
    </ScrollView>
  );
};
