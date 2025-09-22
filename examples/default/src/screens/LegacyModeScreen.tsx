import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import Luciq from '@luciq/react-native';
import { ListTile } from '../components/ListTile';
import { Screen } from '../components/Screen';
import { showNotification } from '../utils/showNotification';

export const LegacyModeScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const addMultipleLuciqLogs = async (numberOfLogs: number) => {
    setLoading(true);
    try {
      for (let i = 0; i < numberOfLogs; i++) {
        Luciq.logDebug(`log ${i}`);
      }
      showNotification('Success', 'Succeeded');
    } catch (error) {
      showNotification('Error', 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const addMultipleUserEvents = async (numberOfLogs: number) => {
    setLoading(true);
    try {
      for (let i = 0; i < numberOfLogs; i++) {
        Luciq.logUserEvent(`test user event ${i}`);
      }
      showNotification('Success', 'Succeeded');
    } catch (error) {
      showNotification('Error', 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const addMultipleTags = async (numberOfLogs: number) => {
    setLoading(true);
    try {
      for (let i = 0; i < numberOfLogs; i++) {
        Luciq.appendTags([`test tag ${i}`]);
      }
      showNotification('Success', 'Succeeded');
    } catch (error) {
      showNotification('Error', 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const addMultipleUserAttributes = async (numberOfLogs: number) => {
    setLoading(true);
    try {
      for (let i = 0; i < numberOfLogs; i++) {
        Luciq.setUserAttribute(`user${i}`, `user${i} value`);
      }
      showNotification('Success', 'Succeeded');
    } catch (error) {
      showNotification('Error', 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      <ListTile
        title="Attach 10 LuciqLogs at a time"
        onPress={() => addMultipleLuciqLogs(10)}
      />
      <ListTile title="Attach 10 events at a time" onPress={() => addMultipleUserEvents(10)} />
      <ListTile title="Attach 10 tags at a time" onPress={() => addMultipleTags(10)} />
      <ListTile
        title="Attach 10 user attributes at a time"
        onPress={() => addMultipleUserAttributes(10)}
      />
    </Screen>
  );
};
