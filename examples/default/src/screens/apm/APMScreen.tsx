import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/HomeStack';
import React, { useState } from 'react';
import { ListTile } from '../../components/ListTile';
import { Screen } from '../../components/Screen';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { APM } from '@luciq/react-native';
import { showNotification } from '../../utils/showNotification';
import CustomGap from '../../components/CustomGap';

export const APMScreen: React.FC<NativeStackScreenProps<HomeStackParamList, 'APM'>> = ({
  navigation,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = (value: boolean) => {
    setIsEnabled(value);
    APM.setEnabled(value);
    showNotification('APM status', 'APM enabled set to ' + value);
  };
  const styles = StyleSheet.create({
    switch: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });

  return (
    <Screen>
      <View style={styles.switch}>
        <Text>Enable APM:</Text>
        <Switch onValueChange={toggleSwitch} value={isEnabled} />
      </View>
      {CustomGap.smallV}
      <ListTile title="End App launch" onPress={() => APM.endAppLaunch()} />
      <ListTile title="Network Screen" onPress={() => navigation.navigate('NetworkTraces')} />
      <ListTile
        title="Cold-Start Network Race (INSD-14886)"
        onPress={() => navigation.navigate('ColdStartRace')}
      />
      <ListTile title="Custom UI Traces" onPress={() => navigation.navigate('CustomUITraces')} />
      <ListTile title="Flows" onPress={() => navigation.navigate('AppFlows')} />
      <ListTile title="Custom Spans" onPress={() => navigation.navigate('CustomSpans')} />
      <ListTile title="WebViews" onPress={() => navigation.navigate('WebViews')} />
      <ListTile title="Complex Views" onPress={() => navigation.navigate('ComplexViews')} />
      <ListTile title="Screen Rendering" onPress={() => navigation.navigate('ScreenRender')} />
      <ListTile title="Screen Loading" onPress={() => navigation.navigate('ScreenLoading')} />
    </Screen>
  );
};
