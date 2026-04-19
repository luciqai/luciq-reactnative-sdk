import type { TurboModule } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setEnabled(isEnabled: boolean): void;
  show(): void;
  hasChats(): Promise<boolean>;
  getUnreadRepliesCount(): Promise<number>;

  setOnNewReplyReceivedHandler(): void;

  setPushNotificationsEnabled(isEnabled: boolean): void;
  setInAppNotificationEnabled(isEnabled: boolean): void;

  setInAppNotificationSound(isEnabled: boolean): void;
  setPushNotificationRegistrationToken(token: string): void;
  showNotification(data: UnsafeObject): void;
  setNotificationIcon(resourceId: number): void;
  setPushNotificationChannelId(id: string): void;
  setSystemReplyNotificationSoundEnabled(isEnabled: boolean): void;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('LCQReplies');
