import { Platform } from 'react-native';

import { NativeEvents, NativeReplies, emitter } from '../native/NativeReplies';
import { Logger } from '../utils/logger';
import { LuciqDebugTags } from '../constants/DebugTags';

const TAG = LuciqDebugTags.REPLIES;

/**
 * Enables and disables everything related to receiving replies.
 * @param isEnabled
 */
export const setEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setEnabled', { isEnabled });
  NativeReplies.setEnabled(isEnabled);
};

/**
 * Tells whether the user has chats already or not.
 */
export const hasChats = async (): Promise<boolean> => {
  Logger.debug(TAG, 'hasChats invoked');
  const result = await NativeReplies.hasChats();
  Logger.debug(TAG, 'hasChats resolved', { hasChats: result });

  return result;
};

/**
 * Manual invocation for replies.
 */
export const show = () => {
  Logger.debug(TAG, 'show called');
  NativeReplies.show();
};

/**
 * Sets a block of code that gets executed when a new message is received.
 * @param handler A callback that gets executed when a new message is received.
 */
export const setOnNewReplyReceivedHandler = (handler: () => void) => {
  Logger.debug(TAG, 'setOnNewReplyReceivedHandler registered');
  const wrappedHandler = () => {
    Logger.debug(TAG, 'native event: ON_REPLY_RECEIVED_HANDLER fired');
    handler();
  };
  emitter.addListener(NativeEvents.ON_REPLY_RECEIVED_HANDLER, wrappedHandler);
  NativeReplies.setOnNewReplyReceivedHandler(handler);
};

/**
 * Returns the number of unread messages the user currently has.
 * Use this method to get the number of unread messages the user
 * has, then possibly notify them about it with your own UI.
 * Notifications count, or -1 in case the SDK has not been initialized.
 */
export const getUnreadRepliesCount = async (): Promise<number> => {
  Logger.debug(TAG, 'getUnreadRepliesCount invoked');
  const count = await NativeReplies.getUnreadRepliesCount();
  Logger.debug(TAG, 'getUnreadRepliesCount resolved', { count });

  return count;
};

/**
 * Enables/disables showing in-app notifications when the user receives a
 * new message.
 * @param isEnabled A boolean to set whether
 * notifications are enabled or disabled.
 */
export const setInAppNotificationsEnabled = (isEnabled: boolean) => {
  Logger.debug(TAG, 'setInAppNotificationsEnabled', { isEnabled });
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
  Logger.debug(TAG, 'setInAppNotificationSound', { isEnabled, platform: Platform.OS });
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
  Logger.debug(TAG, 'setPushNotificationsEnabled', { isEnabled });
  NativeReplies.setPushNotificationsEnabled(isEnabled);
};

/**
 * Set the GCM registration token to Luciq
 *
 * @param token the GCM registration token
 */
export const setPushNotificationRegistrationTokenAndroid = (token: string) => {
  // Push tokens are sensitive credentials - log only presence and length, never the value.
  Logger.debug(TAG, 'setPushNotificationRegistrationTokenAndroid', {
    tokenPresent: !!token,
    tokenLength: token?.length ?? 0,
    platform: Platform.OS,
  });
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
  // Notification data bundle can carry message content / user IDs - log only the keys.
  Logger.debug(TAG, 'showNotificationAndroid', {
    dataKeys: data ? Object.keys(data) : [],
    platform: Platform.OS,
  });
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
  Logger.debug(TAG, 'setNotificationIconAndroid', { resourceId, platform: Platform.OS });
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
  Logger.debug(TAG, 'setPushNotificationChannelIdAndroid', { id, platform: Platform.OS });
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
  Logger.debug(TAG, 'setSystemReplyNotificationSoundEnabledAndroid', {
    isEnabled,
    platform: Platform.OS,
  });
  if (Platform.OS === 'android') {
    NativeReplies.setSystemReplyNotificationSoundEnabled(isEnabled);
  }
};
