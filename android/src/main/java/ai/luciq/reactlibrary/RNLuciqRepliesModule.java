package ai.luciq.reactlibrary;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import ai.luciq.chat.Replies;
import ai.luciq.library.Feature;
import ai.luciq.reactlibrary.utils.EventEmitterModule;
import ai.luciq.reactlibrary.utils.LuciqRNDebugTags;
import ai.luciq.reactlibrary.utils.LuciqRNLogger;
import ai.luciq.reactlibrary.utils.MainThreadHandler;

import javax.annotation.Nonnull;
import java.util.HashMap;
import java.util.Map;

public class RNLuciqRepliesModule extends EventEmitterModule {

    private static final String TAG = LuciqRNDebugTags.REPLIES;

    public RNLuciqRepliesModule(ReactApplicationContext reactApplicationContext) {
        super(reactApplicationContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return "LCQReplies";
    }

    @ReactMethod
    public void addListener(String event) {
        super.addListener(event);
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        super.removeListeners(count);
    }

    @ReactMethod
    public void setEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setEnabled] called isEnabled=" + isEnabled);
                try {
                    if (isEnabled) {
                        Replies.setState(Feature.State.ENABLED);
                    } else {
                        Replies.setState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setEnabled] failed", e);
                }
            }
        });
    }

    @ReactMethod
    public void hasChats(final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[hasChats] called");
                boolean hasChats = Replies.hasChats();
                LuciqRNLogger.d(TAG, "[hasChats] success result=" + hasChats);
                promise.resolve(hasChats);
            }
        });
    }

    @ReactMethod
    public void show() {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[show] called");
                Replies.show();
            }
        });
    }

    /**
     * Set whether new in app notification received will play a small sound notification
     * or not (Default is {@code false})
     *
     * @param shouldPlaySound desired state of conversation sounds
     * @since 4.1.0
     */
    @ReactMethod
    public void setInAppNotificationSound(final boolean shouldPlaySound) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setInAppNotificationSound] called shouldPlaySound=" + shouldPlaySound);
                try {
                    Replies.setInAppNotificationSound(shouldPlaySound);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setInAppNotificationSound] failed", e);
                }
            }
        });
    }

    /**
     * Get current unread count of messages for this user
     *
     * @return number of messages that are unread for this user
     */
    @ReactMethod
    public void getUnreadRepliesCount(final Promise promise) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[getUnreadRepliesCount] called");
                int unreadMessages = 0;
                try {
                    unreadMessages = Replies.getUnreadRepliesCount();
                    LuciqRNLogger.d(TAG, "[getUnreadRepliesCount] success result=" + unreadMessages);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[getUnreadRepliesCount] failed", e);
                }

                promise.resolve(unreadMessages);
            }
        });
    }

    /**
     * Enabled/disable push notifications
     *
     * @param isEnabled whether chat push notifications is enabled or not
     */
    @ReactMethod
    public void setPushNotificationsEnabled(final boolean isEnabled) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setPushNotificationsEnabled] called isEnabled=" + isEnabled);
                try {
                    if (isEnabled) {
                        Replies.setPushNotificationState(Feature.State.ENABLED);
                    } else {
                        Replies.setPushNotificationState(Feature.State.DISABLED);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setPushNotificationsEnabled] failed", e);
                }
            }
        });
    }

    /**
     * Enabled/disable chat notification
     *
     * @param isChatNotificationEnable whether chat notification is reburied or not
     */
    @ReactMethod
    public void setInAppNotificationEnabled(final boolean isChatNotificationEnable) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setInAppNotificationEnabled] called isChatNotificationEnable=" + isChatNotificationEnable);
                try {
                    Replies.setInAppNotificationEnabled(isChatNotificationEnable);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setInAppNotificationEnabled] failed", e);
                }
            }
        });
    }

    /**
     * Set the GCM registration token to Luciq
     *
     * @param token the GCM registration token
     */
    @ReactMethod
    public void setPushNotificationRegistrationToken(final String token) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setPushNotificationRegistrationToken] called tokenLen=" + (token == null ? 0 : token.length()) + " present=" + (token != null));
                try {
                    Replies.setPushNotificationRegistrationToken(token);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setPushNotificationRegistrationToken] failed", e);
                }
            }
        });
    }

    /**
     * Show in-app Messaging's notifications
     *
     * @param data the data bundle related to Luciq
     */
    @ReactMethod
    public void showNotification(final ReadableMap data) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[showNotification] called dataPresent=" + (data != null));
                try {
                    Map<String, String> map = new HashMap<>();
                    ReadableMapKeySetIterator iterator = data.keySetIterator();

                    while (iterator.hasNextKey()) {
                        String key = iterator.nextKey();
                        ReadableType type = data.getType(key);

                        switch(type) {
                            case String:
                                String value = data.getString(key);
                                map.put(key, value);
                                break;
                        }
                    }
                    if (Replies.isLuciqNotification(map)) {
                        Replies.showNotification(map);
                    }
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[showNotification] failed", e);
                }
            }
        });
    }

    /**
     * Set the push notification's icon that will be shown with Luciq notifications
     *
     * @param notificationIcon the notification icon resource ID
     */
    @ReactMethod
    public void setNotificationIcon(final int notificationIcon) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setNotificationIcon] called notificationIcon=" + notificationIcon);
                try {
                    Replies.setNotificationIcon(notificationIcon);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setNotificationIcon] failed", e);
                }
            }
        });
    }


    /**
    * Set a notification channel id to a notification channel that notifications
    * can be posted to.
    *
    * @param pushNotificationChannelId an id to a notification channel that notifications
    */
    @ReactMethod
    public void setPushNotificationChannelId(final String pushNotificationChannelId) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setPushNotificationChannelId] called channelIdLen=" + (pushNotificationChannelId == null ? 0 : pushNotificationChannelId.length()) + " present=" + (pushNotificationChannelId != null));
                try {
                    Replies.setPushNotificationChannelId(pushNotificationChannelId);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setPushNotificationChannelId] failed", e);
                }
            }
        });
    }

    /**
     * Set whether new system notification received will play the default sound from
     * RingtoneManager or not (Default is {@code false})
     *
     * @param shouldPlaySound desired state of conversation sounds
     */
    @ReactMethod
    public void setSystemReplyNotificationSoundEnabled(final boolean shouldPlaySound) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setSystemReplyNotificationSoundEnabled] called shouldPlaySound=" + shouldPlaySound);
                try {
                    Replies.setSystemReplyNotificationSoundEnabled(shouldPlaySound);
                } catch (Exception e) {
                    LuciqRNLogger.e(TAG, "[setSystemReplyNotificationSoundEnabled] failed", e);
                }
            }
        });
    }

    @ReactMethod
    public void setOnNewReplyReceivedHandler(final Callback onNewReplyReceivedCallback) {
        MainThreadHandler.runOnMainThread(new Runnable() {
            @Override
            public void run() {
                LuciqRNLogger.d(TAG, "[setOnNewReplyReceivedHandler] called callbackPresent=" + (onNewReplyReceivedCallback != null));
                try {
                    Runnable onNewReplyReceivedRunnable = new Runnable() {
                        @Override
                        public void run() {
                            LuciqRNLogger.d(TAG, "[" + Constants.LCQ_ON_NEW_REPLY_RECEIVED_CALLBACK + "] emitted");
                            sendEvent(Constants.LCQ_ON_NEW_REPLY_RECEIVED_CALLBACK, null);
                        }
                    };
                    Replies.setOnNewReplyReceivedCallback(onNewReplyReceivedRunnable);
                } catch (java.lang.Exception exception) {
                    LuciqRNLogger.e(TAG, "[setOnNewReplyReceivedHandler] failed", exception);
                }
            }
        });
    }
}
