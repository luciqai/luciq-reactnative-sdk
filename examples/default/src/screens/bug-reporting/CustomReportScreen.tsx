import React, { useEffect, useState } from 'react';

import {
  BugReporting,
  ReportType,
  type ConfigurationField,
  type CustomReport,
  type CustomReportResult,
  type ReportConfiguration,
  ReportScreenshot,
} from '@luciq/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input, ScrollView, Switch, Text, VStack, HStack, useToast } from 'native-base';

import { Screen } from '../../components/Screen';
import { Section } from '../../components/Section';
import { Select } from '../../components/Select';
import type { HomeStackParamList } from '../../navigation/HomeStack';

export interface CustomReportScreenProp {
  reportType?: ReportType;
  categoryIdentifier?: string;
  /** The leaf category's fields, from `getReportConfiguration`, to prefill the answers hint. */
  fields?: ConfigurationField[];
}

/**
 * Parses one answer per line: `fieldKey: value1, value2`. Values are option
 * keys for option fields and free text for text fields.
 */
export const parseAnswers = (text: string): Record<string, string[]> => {
  const answers: Record<string, string[]> = {};
  text.split('\n').forEach((line) => {
    const separator = line.indexOf(':');
    if (separator < 0) {
      return;
    }
    const key = line.slice(0, separator).trim();
    if (!key) {
      return;
    }
    answers[key] = line
      .slice(separator + 1)
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  });
  return answers;
};

const fieldsHint = (fields: ConfigurationField[]) =>
  fields
    .map((field) => {
      const options = field.options.map((option) => option.key).join(' | ');
      return `${field.key} (${field.type}${field.required ? ', required' : ''})${
        options ? `: ${options}` : ''
      }`;
    })
    .join('\n');

/**
 * A minimal headless report form over `BugReporting.submitReport`. Shows the
 * report type's consents, whether custom reports are available, and the
 * resolved result (queued / notSent / invalid with every error) or the
 * rejection code for malformed input.
 */
export const CustomReportScreen: React.FC<
  NativeStackScreenProps<HomeStackParamList, 'CustomReport'>
> = ({ route }) => {
  const params = route.params ?? {};
  const toast = useToast();
  const [reportType, setReportType] = useState<ReportType>(params.reportType ?? ReportType.bug);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [categoryIdentifier, setCategoryIdentifier] = useState(params.categoryIdentifier ?? '');
  const [answersText, setAnswersText] = useState('');
  const [reproSteps, setReproSteps] = useState('');
  const [captureScreenshot, setCaptureScreenshot] = useState(false);
  const [imageUri, setImageUri] = useState('');
  const [configuration, setConfiguration] = useState<ReportConfiguration | null | undefined>(
    undefined,
  );
  const [consentAnswers, setConsentAnswers] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CustomReportResult | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  // The consents to show, and whether custom reports are available for this report type.
  useEffect(() => {
    let active = true;
    BugReporting.getReportConfiguration(reportType)
      .then((fetched) => {
        if (active) {
          setConfiguration(fetched);
          setConsentAnswers({});
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [reportType]);
  const unavailable = configuration === null;
  const consents = configuration?.requirements.consents ?? [];

  const submit = async () => {
    const currentScreen: ReportScreenshot = captureScreenshot ? 'currentScreen' : 'none';
    const report: CustomReport = {
      reportType,
      comment: comment || null,
      email: email || null,
      categoryIdentifier: categoryIdentifier || null,
      answers: parseAnswers(answersText),
      // The user's answer for every consent: one that isn't sent counts as not accepted.
      consents: Object.fromEntries(
        consents.map((consent) => [consent.key, consentAnswers[consent.key] ?? false]),
      ),
      extendedFields: reproSteps ? { repro_steps: reproSteps } : undefined,
      screenshot: imageUri ? ReportScreenshot.fromImage(imageUri) : currentScreen,
    };

    setSubmitting(true);
    setResult(null);
    setRejection(null);
    try {
      const submitResult = await BugReporting.submitReport(report);
      setResult(submitResult);
      toast.show({
        description:
          submitResult.status === 'queued'
            ? 'Report queued'
            : submitResult.status === 'notSent'
              ? `Not sent: ${submitResult.notSentReason}`
              : `Invalid: ${submitResult.errors.length} problem(s)`,
      });
    } catch (error) {
      const code = (error as { code?: string }).code ?? 'unknown';
      setRejection(`${code}: ${(error as Error).message}`);
      toast.show({ description: `Rejected with ${code}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView flex={1} bg="gray.100">
      <Screen>
        <VStack space={3} p={2}>
          {unavailable && (
            <Text testID="id_custom_report_unavailable" fontSize="xs" color="warning.700">
              Custom reports are unavailable: they aren't turned on for this app by the server, or
              Bug Reporting or this report type is off. Submitting resolves notSent / unavailable.
            </Text>
          )}
          <Select
            label="Report type"
            testID="id_custom_report_type"
            items={[
              { label: 'Bug', value: ReportType.bug, isInitial: reportType === ReportType.bug },
              {
                label: 'Feedback',
                value: ReportType.feedback,
                isInitial: reportType === ReportType.feedback,
              },
              {
                label: 'Question',
                value: ReportType.question,
                isInitial: reportType === ReportType.question,
              },
            ]}
            onValueChange={setReportType}
          />
          <Input
            placeholder="Comment"
            value={comment}
            onChangeText={setComment}
            multiline={true}
            testID="id_custom_report_comment"
            accessibilityLabel="id_custom_report_comment"
          />
          <Input
            placeholder="Email (optional)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="id_custom_report_email"
            accessibilityLabel="id_custom_report_email"
          />
          <Input
            placeholder="Leaf category identifier"
            value={categoryIdentifier}
            onChangeText={setCategoryIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            testID="id_custom_report_category"
            accessibilityLabel="id_custom_report_category"
          />
          {params.fields && params.fields.length > 0 && (
            <Text fontSize="xs" color="coolGray.600">
              Fields of this category:{'\n'}
              {fieldsHint(params.fields)}
            </Text>
          )}
          <Input
            placeholder={'Answers, one per line:\nfieldKey: optionKey, optionKey'}
            value={answersText}
            onChangeText={setAnswersText}
            multiline={true}
            autoCapitalize="none"
            autoCorrect={false}
            testID="id_custom_report_answers"
            accessibilityLabel="id_custom_report_answers"
          />
          <Input
            placeholder="Repro steps (extended field, optional)"
            value={reproSteps}
            onChangeText={setReproSteps}
            multiline={true}
            testID="id_custom_report_repro_steps"
            accessibilityLabel="id_custom_report_repro_steps"
          />
          {consents.map((consent) => (
            <HStack key={consent.key} alignItems="center" justifyContent="space-between">
              <Text flex={1}>
                {consent.description ?? consent.key}
                {consent.mandatory ? ' (mandatory)' : ''}
              </Text>
              <Switch
                isChecked={consentAnswers[consent.key] ?? false}
                onToggle={(accepted: boolean) =>
                  setConsentAnswers((answers) => ({ ...answers, [consent.key]: accepted }))
                }
                testID={`id_custom_report_consent_${consent.key}`}
                accessibilityLabel={`id_custom_report_consent_${consent.key}`}
              />
            </HStack>
          ))}
          <Input
            placeholder="Image screenshot file URI (optional, not masked)"
            value={imageUri}
            onChangeText={setImageUri}
            autoCapitalize="none"
            autoCorrect={false}
            testID="id_custom_report_image_uri"
            accessibilityLabel="id_custom_report_image_uri"
          />
          <HStack alignItems="center" justifyContent="space-between">
            <Text>Capture the current screen</Text>
            <Switch
              isChecked={captureScreenshot}
              onToggle={setCaptureScreenshot}
              testID="id_custom_report_screenshot"
              accessibilityLabel="id_custom_report_screenshot"
            />
          </HStack>
          <Button
            onPress={submit}
            isLoading={submitting}
            testID="id_custom_report_submit"
            accessibilityLabel="id_custom_report_submit">
            Submit report
          </Button>

          {result && (
            <Section title={`Result: ${result.status}`}>
              <Text testID="id_custom_report_result" fontSize="xs">
                {JSON.stringify(result, null, 2)}
              </Text>
            </Section>
          )}
          {rejection && (
            <Section title="Rejected">
              <Text testID="id_custom_report_rejection" fontSize="xs" color="danger.600">
                {rejection}
              </Text>
            </Section>
          )}
        </VStack>
      </Screen>
    </ScrollView>
  );
};
