import { Platform } from 'react-native';

import { NativeEvents, NativeReplies, emitter } from '../native/NativeReplies';

/**
 * Enables and disables everything related to receiving replies.
 * @param isEnabled
 */
export const setEnabled = (isEnabled: boolean) => {
  console.log('[LCQ-RN] Replies.setEnabled called', { isEnabled });
  NativeReplies.setEnabled(isEnabled);
};

/**
 * Tells whether the user has chats already or not.
 */
export const hasChats = async (): Promise<boolean> => {
  console.log('[LCQ-RN] Replies.hasChats called');
  const result = await NativeReplies.hasChats();

  return result;
};

/**
 * Manual invocation for replies.
 */
export const show = () => {
  console.log('[LCQ-RN] Replies.show called');
  NativeReplies.show();
};

/**
 * Sets a block of code that gets executed when a new message is received.
 * @param handler A callback that gets executed when a new message is received.
 */
export const setOnNewReplyReceivedHandler = (handler: () => void) => {
  console.log('[LCQ-RN] Replies.setOnNewReplyReceivedHandler called');
  emitter.addListener(NativeEvents.ON_REPLY_RECEIVED_HANDLER, handler);
  NativeReplies.setOnNewReplyReceivedHandler(handler);
};

/**
 * Returns the number of unread messages the user currently has.
 * Use this method to get the number of unread messages the user
 * has, then possibly notify them about it with your own UI.
 * Notifications count, or -1 in case the SDK has not been initialized.
 */
export const getUnreadRepliesCount = async (): Promise<number> => {
  console.log('[LCQ-RN] Replies.getUnreadRepliesCount called');
  const count = await NativeReplies.getUnreadRepliesCount();

  return count;
};

/**
 * Enables/disables showing in-app notifications when the user receives a
 * new message.
 * @param isEnabled A boolean to set whether
 * notifications are enabled or disabled.
 */
export const setInAppNotificationsEnabled = (isEnabled: boolean) => {
  console.log('[LCQ-RN] Replies.setInAppNotificationsEnabled called', { isEnabled });
  NativeReplies.setInAppNotificationEnabled(isEnabled);
};

/**
 * Set whether new in app notification received will play a small sound notification
 * or not (Default is {@code false})
 * @android
 *
 * @param isEnabled desired state of conversation sounds
 */
export const setInAppNotificationSound = (isEnabled: boolean) => {
  console.log('[LCQ-RN] Replies.setInAppNotificationSound called', { isEnabled });
  if (Platform.OS === 'android') {
    NativeReplies.setInAppNotificationSound(isEnabled);
  }
};

/**
 * Enables/disables the use of push notifications in the SDK.
 * Defaults to YES.
 * @param isEnabled A boolean to indicate whether push notifications are enabled or disabled.
 */
export const setPushNotificationsEnabled = (isEnabled: boolean) => {
  console.log('[LCQ-RN] Replies.setPushNotificationsEnabled called', { isEnabled });
  NativeReplies.setPushNotificationsEnabled(isEnabled);
};

/**
 * Set the GCM registration token to Luciq
 *
 * @param token the GCM registration token
 */
export const setPushNotificationRegistrationTokenAndroid = (token: string) => {
  console.log('[LCQ-RN] Replies.setPushNotificationRegistrationTokenAndroid called', { token });
  if (Platform.OS === 'android') {
    NativeReplies.setPushNotificationRegistrationToken(token);
  }
};

/**
 * Show in-app Messaging's notifications
 *
 * @param data the data bundle related to Luciq
 */
export const showNotificationAndroid = (data: Record<string, string>) => {
  console.log('[LCQ-RN] Replies.showNotificationAndroid called', { data });
  if (Platform.OS === 'android') {
    NativeReplies.showNotification(data);
  }
};

/**
 * Set the push notification's icon that will be shown with Luciq notifications
 *
 * @param resourceId the notification icon resource ID
 */
export const setNotificationIconAndroid = (resourceId: number) => {
  console.log('[LCQ-RN] Replies.setNotificationIconAndroid called', { resourceId });
  if (Platform.OS === 'android') {
    NativeReplies.setNotificationIcon(resourceId);
  }
};

/**
 * Set a notification channel id to a notification channel that notifications
 * can be posted to.
 *
 * @param id an id to a notification channel that notifications
 */
export const setPushNotificationChannelIdAndroid = (id: string) => {
  console.log('[LCQ-RN] Replies.setPushNotificationChannelIdAndroid called', { id });
  if (Platform.OS === 'android') {
    NativeReplies.setPushNotificationChannelId(id);
  }
};

/**
 * Set whether new system notification received will play the default sound from
 * RingtoneManager or not (Default is {@code false})
 *
 * @param isEnabled desired state of conversation sounds
 */
export const setSystemReplyNotificationSoundEnabledAndroid = (isEnabled: boolean) => {
  console.log('[LCQ-RN] Replies.setSystemReplyNotificationSoundEnabledAndroid called', {
    isEnabled,
  });
  if (Platform.OS === 'android') {
    NativeReplies.setSystemReplyNotificationSoundEnabled(isEnabled);
  }
};
