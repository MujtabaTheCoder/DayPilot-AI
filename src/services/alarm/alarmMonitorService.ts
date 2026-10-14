import { AlarmRepo } from '../db/alarmRepo';
import { RoutineRepo } from '../db/routineRepo';
import { ProfileRepo } from '../db/profileRepo';
import { AlarmType, AlarmSoundMode } from '../db/types';
import { NotificationService } from '../notifications/notificationService';
import {
  getCurrentHHmm,
  getCurrentDateStr,
  generateAccurateAlarmAnnouncement,
} from '@/utils/timeUtils';

export interface AlarmTriggerPayload {
  id: string;
  title: string;
  time: string; // HH:mm format, e.g. "04:00" or "22:00"
  voiceText: string;
  alarmType: AlarmType;
  soundMode: AlarmSoundMode;
  soundName: string;
  isSnoozed?: boolean;
}

export type AlarmTriggerListener = (payload: AlarmTriggerPayload) => void;

class AlarmMonitorServiceImpl {
  private timer: any = null;
  private isRunning = false;
  private listeners = new Set<AlarmTriggerListener>();
  private triggeredMinutes = new Set<string>();
  private snoozedQueue: {
    payload: AlarmTriggerPayload;
    triggerTimestamp: number;
  }[] = [];
  private currentActiveAlert: AlarmTriggerPayload | null = null;

  /**
   * Start live background time monitoring
   */
  public startMonitoring(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Check time immediately and then every 2.5 seconds
    this.checkTime();
    this.timer = setInterval(() => {
      this.checkTime();
    }, 2500);
  }

  /**
   * Stop monitoring (e.g. app shutdown)
   */
  public stopMonitoring(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  /**
   * Register a listener for alarm triggers (e.g. in RootLayout)
   */
  public addListener(listener: AlarmTriggerListener): () => void {
    this.listeners.add(listener);
    // If an alert is actively ringing, immediately dispatch it to the newly registered listener
    if (this.currentActiveAlert) {
      listener(this.currentActiveAlert);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getCurrentActiveAlert(): AlarmTriggerPayload | null {
    return this.currentActiveAlert;
  }

  /**
   * Snooze the active alert for a specified duration in minutes (default 5 minutes)
   */
  public snoozeActiveAlert(
    payload: AlarmTriggerPayload,
    snoozeMinutes: number = 5
  ): void {
    this.currentActiveAlert = null;
    const triggerTimestamp = Date.now() + snoozeMinutes * 60 * 1000;
    this.snoozedQueue.push({
      payload: { ...payload, isSnoozed: true },
      triggerTimestamp,
    });
  }

  /**
   * Dismiss the active alert completely
   */
  public dismissActiveAlert(alarmId: string): void {
    this.currentActiveAlert = null;
    this.snoozedQueue = this.snoozedQueue.filter(
      (item) => item.payload.id !== alarmId
    );
  }

  /**
   * Trigger a manual test alert (for Alarms screen test button)
   */
  public async triggerManualTest(
    customPayload?: Partial<AlarmTriggerPayload>
  ): Promise<void> {
    const profile = await ProfileRepo.getUserProfile();
    const time = customPayload?.time || getCurrentHHmm();
    const alarmType = customPayload?.alarmType || 'wake';
    const voiceText =
      customPayload?.voiceText ||
      generateAccurateAlarmAnnouncement(profile.name, alarmType, time);

    const payload: AlarmTriggerPayload = {
      id: customPayload?.id || `manual-test-${Date.now()}`,
      title: customPayload?.title || (alarmType === 'wake' ? 'Morning Wake-Up Alarm' : 'Bedtime Sleep Alarm'),
      time,
      voiceText,
      alarmType,
      soundMode: customPayload?.soundMode || 'voice',
      soundName: customPayload?.soundName || 'aurora_chime',
    };

    this.dispatchTrigger(payload);
  }

  /**
   * Checks current clock against saved alarms, routines, and snooze queue
   */
  private async checkTime(): Promise<void> {
    const now = new Date();
    const currentHHmm = getCurrentHHmm();
    const todayStr = getCurrentDateStr();
    const dayOfWeek = now.getDay();
    const currentTimestamp = now.getTime();

    // 1. Check Snooze Queue first
    const readySnoozes = this.snoozedQueue.filter(
      (item) => currentTimestamp >= item.triggerTimestamp
    );
    if (readySnoozes.length > 0) {
      this.snoozedQueue = this.snoozedQueue.filter(
        (item) => currentTimestamp < item.triggerTimestamp
      );
      for (const snoozeItem of readySnoozes) {
        this.dispatchTrigger(snoozeItem.payload);
        return; // Handle one alert at a time
      }
    }

    // Do not trigger a new alarm if an alert is already actively ringing
    if (this.currentActiveAlert) {
      return;
    }

    // 2. Check Saved Alarms
    try {
      const alarms = await AlarmRepo.getAllAlarms();
      const profile = await ProfileRepo.getUserProfile();

      for (const alarm of alarms) {
        if (!alarm.isEnabled) continue;
        if (!alarm.daysOfWeek.includes(dayOfWeek)) continue;

        if (alarm.time === currentHHmm) {
          const triggerKey = `alarm_${alarm.id}_${todayStr}_${currentHHmm}`;
          if (!this.triggeredMinutes.has(triggerKey)) {
            this.triggeredMinutes.add(triggerKey);

            const voiceText =
              alarm.voiceAnnouncementText ||
              generateAccurateAlarmAnnouncement(
                profile.name,
                alarm.alarmType,
                alarm.time,
                alarm.title
              );

            const payload: AlarmTriggerPayload = {
              id: alarm.id,
              title: alarm.title,
              time: alarm.time,
              voiceText,
              alarmType: alarm.alarmType,
              soundMode: alarm.soundMode,
              soundName: alarm.soundName,
            };

            this.dispatchTrigger(payload);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Error checking alarms in monitor:', err);
    }

    // 3. Check Scheduled Routines
    try {
      const routines = await RoutineRepo.getAllRoutines(todayStr);
      const profile = await ProfileRepo.getUserProfile();

      for (const routine of routines) {
        if (!routine.isActive) continue;
        if (!routine.daysOfWeek.includes(dayOfWeek)) continue;

        if (routine.scheduledTime === currentHHmm) {
          const triggerKey = `routine_${routine.id}_${todayStr}_${currentHHmm}`;
          if (!this.triggeredMinutes.has(triggerKey)) {
            this.triggeredMinutes.add(triggerKey);

            const voiceText =
              routine.voiceReminderText ||
              `${profile.name}, aapka routine block shuru ho gaya hai: ${routine.title}.`;

            const payload: AlarmTriggerPayload = {
              id: `routine-${routine.id}`,
              title: routine.title,
              time: routine.scheduledTime,
              voiceText,
              alarmType: 'routine',
              soundMode: 'voice',
              soundName: 'aurora_chime',
            };

            this.dispatchTrigger(payload);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Error checking routines in monitor:', err);
    }

    // Clean up old triggered minutes entries
    if (this.triggeredMinutes.size > 200) {
      this.triggeredMinutes.clear();
    }
  }

  private dispatchTrigger(payload: AlarmTriggerPayload): void {
    this.currentActiveAlert = payload;

    // Send notification
    NotificationService.triggerImmediateTestNotification(
      `⏰ ${payload.title} (${payload.time})`,
      payload.voiceText
    ).catch(() => {});

    // Notify UI listeners
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.warn('Error in alarm listener:', err);
      }
    }
  }
}

export const AlarmMonitorService = new AlarmMonitorServiceImpl();
