import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AlarmItem } from '../db/types';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daypilot-alarms', {
          name: 'DayPilot Alarms',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#00F2FE',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('daypilot-routines', {
          name: 'DayPilot Routines & Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          lightColor: '#8B5CF6',
          sound: 'default',
        });
      }

      return true;
    } catch (err) {
      console.warn('Failed to configure notifications:', err);
      return false;
    }
  },

  async scheduleAlarmNotification(alarm: AlarmItem): Promise<string | null> {
    if (Platform.OS === 'web') {
      return 'web_mock_' + alarm.id;
    }

    try {
      const [hourStr, minuteStr] = alarm.time.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      // Cancel previous if any
      if (alarm.notificationId) {
        await this.cancelNotification(alarm.notificationId);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${alarm.title}`,
          body: `DayPilot Alarm: Time to start your scheduled flow!`,
          sound: true,
          data: { alarmId: alarm.id, alarmType: alarm.alarmType },
          categoryIdentifier: 'alarm_actions',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'daypilot-alarms',
        },
      });

      return identifier;
    } catch (err) {
      console.warn('Error scheduling alarm notification:', err);
      return null;
    }
  },

  async scheduleRoutineReminder(title: string, scheduledTime: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      const [hourStr, minuteStr] = scheduledTime.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🌟 Routine: ${title}`,
          body: `It's time for your scheduled routine! Keep your streak strong.`,
          sound: true,
          data: { type: 'routine' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'daypilot-routines',
        },
      });

      return identifier;
    } catch (err) {
      console.warn('Error scheduling routine notification:', err);
      return null;
    }
  },

  async triggerImmediateTestNotification(title: string, body: string): Promise<void> {
    if (Platform.OS === 'web') {
      console.log(`[Notification Triggered] ${title} - ${body}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
    } catch (err) {
      console.warn('Could not schedule test notification:', err);
    }
  },

  async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.warn('Error canceling notification:', err);
    }
  },
};
