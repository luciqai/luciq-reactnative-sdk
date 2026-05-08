import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Section } from '../../../components/Section';
import { Screen } from '../../../components/Screen';
import { ClipboardTextInput } from '../../../components/ClipboardTextInput';
import { useQuery } from 'react-query';
import { HStack, VStack } from 'native-base';
import { gql, GraphQLClient } from 'graphql-request';
import { CustomButton } from '../../../components/CustomButton';
import axios from 'axios';
import type { HomeStackParamList } from '../../../navigation/HomeStack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNetInfo } from '@react-native-community/netinfo';
import { ListTile } from '../../../components/ListTile';
import { NetworkLogger } from '@luciq/react-native';
import { NetworkState } from './NetworkStateScreen';
import { useCallbackHandlers } from '../../../contexts/callbackContext';

export const NetworkScreen: React.FC<
  NativeStackScreenProps<HomeStackParamList, 'NetworkTraces'>
> = ({ navigation }) => {
  const [endpointUrl, setEndpointUrl] = useState('');
  const { width, height } = useWindowDimensions();

  const { isConnected } = useNetInfo();
  const defaultRequestBaseUrl = 'https://jsonplaceholder.typicode.com/posts/';
  const shortenLink = 'https://shorturl.at/loDCx';
  const defaultRequestUrl = `${defaultRequestBaseUrl}1`;

  const imageUrls = [
    'https://fastly.picsum.photos/id/57/200/300.jpg?hmac=l908G1qVr4r7dP947-tak2mY8Vvic_vEYzCXUCKKskY',
    'https://fastly.picsum.photos/id/619/200/300.jpg?hmac=WqBGwlGjuY9RCdpzRaG9G-rc9Fi7TGUINX_-klAL2kA',
  ];
  const { addItem } = useCallbackHandlers();

  async function sendRequestToUrl() {
    let urlToSend: string;

    if (endpointUrl.trim() !== '') {
      urlToSend = endpointUrl;
      console.log('Sending request to: ', endpointUrl);
    } else {
      // Use json placeholder URL as a default if endpointUrl is empty
      console.log('sending request to default json placeholder');
      urlToSend = defaultRequestUrl;
    }

    try {
      // Perform the request using the urlToSend
      const response = await fetch(urlToSend);
      const data = await response.json();

      // Format the JSON response for better logging
      const formattedData = JSON.stringify(data, null, 2);

      // Log the formatted response
      console.log('Response:', formattedData);
    } catch (error) {
      // Handle errors appropriately
      console.error('Error:', error);
    }
  }

  async function sendRequestToUrlUsingAxios() {
    let urlToSend: string;

    if (endpointUrl.trim() !== '') {
      urlToSend = endpointUrl;
      console.log('Sending request to: ', endpointUrl);
    } else {
      // Use json placeholder URL as a default if endpointUrl is empty
      console.log('sending request to default json placeholder');
      urlToSend = defaultRequestUrl;
    }

    try {
      // Perform the request using the urlToSend
      const response = await axios.get(urlToSend);
      // Format the JSON response for better logging
      const formattedData = JSON.stringify(response.data, null, 2);

      // Log the formatted response
      console.log('Response:', formattedData);
    } catch (error) {
      // Handle errors appropriately
      console.error('Error:', error);
    }
  }

  async function sendRedirectRequestToUrl() {
    try {
      console.log('Sending request to: ', shortenLink);
      const response = await fetch(shortenLink);
      console.log('Received from: ', response.url);

      // Format the JSON response for better logging
      const data = await response.json();

      // Format the JSON response for better logging
      const formattedData = JSON.stringify(data, null, 2);

      // Log the formatted response
      console.log('Response:', formattedData);
    } catch (error) {
      // Handle errors appropriately
      console.error('Error:', error);
    }
  }

  const fetchGraphQlData = async () => {
    const client = new GraphQLClient('https://countries.trevorblades.com/graphql', {
      headers: {
        'lcq-graphql-header': 'CustomQName', // change Query Name here
      },
    });

    const document = gql`
      query {
        country(code: "EG") {
          emoji
          name
        }
      }
    `;

    return client.request<{ country: { emoji: string; name: string } }>(document);
  };

  const { data, isError, isSuccess, isLoading, refetch } = useQuery('helloQuery', fetchGraphQlData);
  const simulateNetworkRequest = () => {
    axios.get('https://httpbin.org/anything', {
      headers: { traceparent: 'Caught Header Example' },
    });
  };
  const simulateNetworkRequestWithoutHeader = () => {
    axios.get('https://httpbin.org/anything');
  };

  const simulateCancelledRequest = () => {
    const controller = new AbortController();

    axios
      .get('https://httpbin.org/delay/5', {
        signal: controller.signal,
      })
      .then((response) => {
        console.log('Response:', response.data);
      })
      .catch(() => {
        // if (axios.isCancel(error)) {
        //   console.log('Request cancelled:', error.message);
        // } else {
        //   console.error('Error:', error);
        // }
      });

    // Cancel the request after 100ms
    setTimeout(() => {
      controller.abort();
      // console.log('Request aborted');
    }, 100);
  };

  const simulateTimeoutRequest = () => {
    axios
      .get('https://httpbin.org/delay/10', {
        timeout: 1000, // 1 second timeout
      })
      .then((response) => {
        console.log('Response:', response.data);
      })
      .catch((error) => {
        if (error.code === 'ECONNABORTED') {
          console.log('Request timeout:', error.message);
        } else {
          console.error('Error:', error.toString());
        }
      });
  };

  function generateUrls(count: number = 10) {
    const urls = [];
    for (let i = 1; i <= count; i++) {
      urls.push(defaultRequestBaseUrl + i);
    }
    return urls;
  }

  async function makeSequentialApiCalls(urls: string[]): Promise<any[]> {
    const results: any[] = [];

    try {
      for (let i = 0; i < urls.length; i++) {
        await fetch(urls[i]);
        results.push(results[i]);
      }
      return results;
    } catch (error) {
      console.error('Error making parallel API calls:', error);
      throw error;
    }
  }

  async function makeParallelApiCalls(urls: string[]): Promise<any[]> {
    const fetchPromises = urls.map((url) => fetch(url).then((response) => response.json()));

    try {
      return await Promise.all(fetchPromises);
    } catch (error) {
      console.error('Error making parallel API calls:', error);
      throw error;
    }
  }

  /**
   * Fires concurrent requests using fetch with interleaved timing.
   * Before the WeakMap fix, this pattern would cause URL/method data
   * to get mixed between requests due to the shared mutable singleton.
   */
  async function sendInterleavedConcurrentRequests() {
    const urls = [
      { method: 'GET', url: `${defaultRequestBaseUrl}1` },
      { method: 'GET', url: `${defaultRequestBaseUrl}2` },
      { method: 'GET', url: `${defaultRequestBaseUrl}3` },
    ];

    const promises = urls.map(({ url }) => fetch(url).then((r) => r.json()));
    try {
      const results = await Promise.all(promises);
      Alert.alert(
        'Concurrent Requests Done',
        `All ${results.length} requests completed. Check network logs for correct URL isolation.`,
      );
    } catch (error) {
      console.error('Interleaved concurrent error:', error);
    }
  }

  /**
   * Fires concurrent requests with different HTTP methods and custom headers.
   * Verifies that per-request header isolation works (no header mixing).
   */
  async function sendConcurrentWithDifferentHeaders() {
    const requests = [
      fetch(`${defaultRequestBaseUrl}1`, {
        headers: { 'X-Request-ID': 'request-alpha' },
      }),
      fetch(`${defaultRequestBaseUrl}2`, {
        headers: { 'X-Request-ID': 'request-beta' },
      }),
      fetch(`${defaultRequestBaseUrl}3`, {
        headers: { 'X-Request-ID': 'request-gamma' },
      }),
    ];

    try {
      const results = await Promise.all(requests);
      Alert.alert(
        'Header Isolation Test Done',
        `All ${results.length} requests completed. Verify each log has its own X-Request-ID.`,
      );
    } catch (error) {
      console.error('Concurrent headers error:', error);
    }
  }

  /**
   * Fires mixed HTTP methods concurrently (GET + POST + PUT + DELETE).
   * Verifies method isolation under concurrency.
   */
  async function sendConcurrentMixedMethods() {
    const baseUrl = 'https://jsonplaceholder.typicode.com';
    const promises = [
      fetch(`${baseUrl}/posts/1`),
      fetch(`${baseUrl}/posts`, {
        method: 'POST',
        body: JSON.stringify({ title: 'test', body: 'concurrent', userId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`${baseUrl}/posts/1`, {
        method: 'PUT',
        body: JSON.stringify({ id: 1, title: 'updated', body: 'concurrent', userId: 1 }),
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`${baseUrl}/posts/1`, { method: 'DELETE' }),
    ];

    try {
      await Promise.all(promises);
      Alert.alert(
        'Mixed Methods Done',
        'GET + POST + PUT + DELETE all fired concurrently. Verify each log has the correct method.',
      );
    } catch (error) {
      console.error('Mixed methods error:', error);
    }
  }

  /**
   * Fires several concurrent requests and aborts some mid-flight.
   * Tests that aborted requests are properly logged with 'cancelled' status
   * and that non-aborted requests complete normally.
   */
  function sendConcurrentWithAborts() {
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const requests = [
      fetch(`${defaultRequestBaseUrl}1`, { signal: controller1.signal }).catch(() => 'aborted-1'),
      fetch(`${defaultRequestBaseUrl}2`).then((r) => r.json()),
      fetch(`${defaultRequestBaseUrl}3`, { signal: controller2.signal }).catch(() => 'aborted-3'),
      fetch(`${defaultRequestBaseUrl}4`).then((r) => r.json()),
    ];

    setTimeout(() => controller1.abort(), 0);
    setTimeout(() => controller2.abort(), 0);

    Promise.all(requests)
      .then((results) => {
        const abortedCount = results.filter((r) => typeof r === 'string').length;
        const successCount = results.length - abortedCount;
        Alert.alert(
          'Concurrent + Abort Done',
          `${successCount} succeeded, ${abortedCount} aborted. Verify aborted logs show 'cancelled'.`,
        );
      })
      .catch((error) => console.error('Concurrent abort error:', error));
  }

  /**
   * Fires a high volume of concurrent requests to stress-test isolation.
   */
  async function sendBurstRequests() {
    const count = 20;
    const promises = [];
    for (let i = 1; i <= count; i++) {
      const postId = ((i - 1) % 100) + 1;
      promises.push(fetch(`${defaultRequestBaseUrl}${postId}`));
    }

    try {
      const results = await Promise.all(promises);
      Alert.alert(
        'Burst Test Done',
        `All ${results.length}/${count} requests completed. Verify all ${count} logs appear in the dashboard.`,
      );
    } catch (error) {
      console.error('Burst requests error:', error);
    }
  }

  const [isNetworkEnabled, setIsNetworkEnabled] = useState<boolean>(true);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Screen>
        <ListTile
          title="Network Enable State"
          subtitle={isNetworkEnabled ? 'Enabled' : 'Disabled'}
          onPress={() => {
            navigation.navigate('NetworkState', {
              state: isNetworkEnabled ? NetworkState.Enabled : NetworkState.Disabled,
              setState: (newState: NetworkState) => {
                const isEnabled = newState === NetworkState.Enabled;
                setIsNetworkEnabled(isEnabled);
                NetworkLogger.setEnabled(isEnabled);
                navigation.goBack();
              },
            });
          }}
          testID="id_network_state"
        />
        <Section title="Network Requests">
          <VStack space="xs">
            <ClipboardTextInput
              placeholder="Endpoint URL"
              onChangeText={(text) => setEndpointUrl(text)}
              selectTextOnFocus={true}
              value={endpointUrl}
            />
            <CustomButton onPress={sendRequestToUrl} title="Send Request To URL" />
            <CustomButton
              onPress={sendRedirectRequestToUrl}
              title="Send Redirection Request To URL"
            />
            <CustomButton
              onPress={sendRequestToUrlUsingAxios}
              title="Send Request To URL Using Axios"
            />

            <Text style={styles.subheading}>Batch Requests</Text>
            <CustomButton
              onPress={() => makeParallelApiCalls(generateUrls())}
              title="Send Parallel Requests"
            />
            <CustomButton
              onPress={() => makeSequentialApiCalls(generateUrls())}
              title="Send Sequential Requests"
            />

            <Text style={styles.subheading}>GraphQL & Navigation</Text>
            <CustomButton onPress={() => refetch()} title="Reload GraphQL" />
            <CustomButton
              onPress={() => navigation.navigate('HttpScreen')}
              title="Go to HTTP Screen"
            />

            <Text style={styles.subheading}>Simulations</Text>
            <CustomButton
              title="Simulate Network Request With Header"
              onPress={() => simulateNetworkRequest()}
            />
            <CustomButton
              title="Simulate Network Request"
              onPress={() => simulateNetworkRequestWithoutHeader()}
            />
            <CustomButton
              title="Simulate Cancelled Request"
              onPress={() => simulateCancelledRequest()}
            />
            <CustomButton
              title="Simulate Timeout Request"
              onPress={() => simulateTimeoutRequest()}
            />
            <CustomButton onPress={() => refetch()} title="Reload GraphQL" />
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    // eslint-disable-next-line react-native/no-inline-styles
                    { backgroundColor: isConnected ? '#34C759' : '#FF3B30' },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isConnected ? 'Network Connected' : 'Network Disconnected'}
                </Text>
              </View>
              {isLoading && <Text style={styles.statusDetail}>Loading...</Text>}
              {isSuccess && (
                <Text style={styles.statusDetail}>GraphQL Data: {data.country.emoji}</Text>
              )}
              {isError && <Text style={styles.statusError}>Error!</Text>}
            </View>
          </VStack>
        </Section>
        <Section title="Concurrency & Abort Tests">
          <VStack space="xs">
            <CustomButton
              onPress={sendInterleavedConcurrentRequests}
              title="Concurrent Requests (URL Isolation)"
            />
            <CustomButton
              onPress={sendConcurrentWithDifferentHeaders}
              title="Concurrent Requests (Header Isolation)"
            />
            <CustomButton
              onPress={sendConcurrentMixedMethods}
              title="Concurrent Mixed Methods (GET/POST/PUT/DELETE)"
            />
            <CustomButton
              onPress={sendConcurrentWithAborts}
              title="Concurrent + Abort (2 aborted, 2 success)"
            />
            <CustomButton onPress={sendBurstRequests} title="Burst 20 Concurrent Requests" />
          </VStack>
        </Section>

        <Section title="Images">
          <HStack marginTop="3" space="sm" justifyContent="center">
            {imageUrls.map((imageUrl) => (
              <Image
                key={imageUrl}
                source={{ uri: imageUrl }}
                style={[styles.image, { width: width * 0.42, height: height * 0.28 }]}
              />
            ))}
          </HStack>
        </Section>

        <Section title="Handlers">
          <ListTile
            testID="enable_network_obfuscation_handler"
            title="Enable Network Obfuscation Handler"
            onPress={() =>
              NetworkLogger.setNetworkDataObfuscationHandler(async (networkData) => {
                addItem('Network Obfuscated', {
                  id: `event-${Math.random()}`,
                  fields: [
                    { key: 'Date', value: new Date().toLocaleString() },
                    { key: 'Url', value: networkData.url },
                    { key: 'Method', value: networkData.method },
                    { key: 'Request Body', value: networkData.requestBody },
                    { key: 'Response', value: networkData.responseBody?.toString() ?? '' },
                    { key: 'Request Headers', value: networkData.requestHeaders.toString() },
                    { key: 'Response Headers', value: networkData.requestHeaders.toString() },
                  ],
                });
                return networkData;
              })
            }
          />

          <ListTile
            testID="crash_network_obfuscation_handler"
            title="Crash Network Obfuscation Handler"
            onPress={() =>
              NetworkLogger.setNetworkDataObfuscationHandler(async (networkData) => {
                addItem('Network Obfuscated', {
                  id: `event-${Math.random()}`,
                  fields: [
                    { key: 'Date', value: new Date().toLocaleString() },
                    { key: 'Url', value: networkData.url },
                    { key: 'Method', value: networkData.method },
                    { key: 'Request Body', value: networkData.requestBody },
                    { key: 'Response', value: networkData.responseBody?.toString() ?? '' },
                    { key: 'Request Headers', value: networkData.requestHeaders.toString() },
                    { key: 'Response Headers', value: networkData.requestHeaders.toString() },
                  ],
                });
                throw Error(' Error from Network Obfuscated');
              })
            }
          />
        </Section>
      </Screen>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  image: {
    resizeMode: 'contain',
    borderRadius: 12,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 2,
  },
  statusCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 16,
  },
  statusError: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 16,
  },
});
