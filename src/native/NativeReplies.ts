import { NativeEventEmitter, NativeModule, NativeModules as ReactNativeModules } from 'react-native';

import RepliesTurboSpec from '../specs/NativeReplies';

export interface RepliesNativeModule extends NativeModule {
  // Essential APIs //
  setEnabled(isEnabled: boolean): void;
  show(): void;
  hasChats(): Promise<boolean>;
  getUnreadRepliesCount(): Promise<number>;

  // Callbacks //
  setOnNewReplyReceivedHandler(handler: () => void): void;

  // Notifications APIs //
  setPushNotificationsEnabled(isEnabled: boolean): void;
  setInAppNotificationEnabled(isEnabled: boolean): void;

  // Android Notifications APIs //
  setInAppNotificationSound(isEnabled: boolean): void;
  setPushNotificationRegistrationToken(token: string): void;
  showNotification(data: Record<string, string>): void;
  setNotificationIcon(resourceId: number): void;
  setPushNotificationChannelId(id: string): void;
  setSystemReplyNotificationSoundEnabled(isEnabled: boolean): void;
}

export const NativeReplies = (RepliesTurboSpec ??
  ReactNativeModules.LCQReplies) as unknown as RepliesNativeModule;

export enum NativeEvents {
  ON_REPLY_RECEIVED_HANDLER = 'LCQOnNewReplyReceivedCallback',
}

export const emitter = new NativeEventEmitter(NativeReplies);
