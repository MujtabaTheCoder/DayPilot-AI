import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { AlarmCard } from '@/components/AlarmCard';
import { AddAlarmModal } from '@/components/AddAlarmModal';
import { VoiceRoutineModal } from '@/components/VoiceRoutineModal';
import { InstallAppModal } from '@/components/InstallAppModal';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { EditProfileModal } from '@/components/EditProfileModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { AlarmRepo } from '@/services/db/alarmRepo';
import { ProfileRepo, DEFAULT_USER_PROFILE } from '@/services/db/profileRepo';
import { AlarmItem, UserProfile } from '@/services/db/types';
import { SoundService } from '@/services/audio/soundService';
import { NotificationService } from '@/services/notifications/notificationService';
import { AlarmMonitorService } from '@/services/alarm/alarmMonitorService';
import { computeSleepDuration, formatTo12Hour } from '@/utils/timeUtils';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';

export default function AlarmsScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlarms = useCallback(async () => {
    try {
      const profile = await ProfileRepo.getUserProfile();
      setUserProfile(profile);

      const list = await AlarmRepo.getAllAlarms();
      setAlarms(list);
    } catch (e) {
      console.warn('Error loading alarms:', e);
    }
  }, []);

  useEffect(() => {
    loadAlarms();
    NotificationService.requestPermissions();
  }, [loadAlarms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlarms();
    setRefreshing(false);
  };

  const handleToggle = async (id: string, isEnabled: boolean) => {
    await AlarmRepo.toggleAlarm(id, isEnabled);
    const target = alarms.find((a) => a.id === id);
    if (target) {
      if (isEnabled) {
        const notifId = await NotificationService.scheduleAlarmNotification({
          ...target,
          isEnabled: true,
        });
        if (notifId) await AlarmRepo.updateAlarmNotificationId(id, notifId);
      } else if (target.notificationId) {
        await NotificationService.cancelNotification(target.notificationId);
        await AlarmRepo.updateAlarmNotificationId(id, null);
      }
    }
    await loadAlarms();
  };

  const handleDelete = async (id: string) => {
    SoundService.triggerHapticMedium();
    const target = alarms.find((a) => a.id === id);
    if (target?.notificationId) {
      await NotificationService.cancelNotification(target.notificationId);
    }
    await AlarmRepo.deleteAlarm(id);
    await loadAlarms();
  };

  const handleAddAlarm = async (data: any) => {
    const created = await AlarmRepo.addAlarm(data);
    const notifId = await NotificationService.scheduleAlarmNotification(created);
    if (notifId) {
      await AlarmRepo.updateAlarmNotificationId(created.id, notifId);
    }
    await loadAlarms();
  };

  const handleTestSound = (alarm: AlarmItem) => {
    if (alarm.soundMode === 'voice') {
      const msg =
        alarm.voiceAnnouncementText || `${userProfile.name}, uthne ka waqt ho gaya hai, uth jaao!`;
      AlarmMonitorService.triggerManualTest({
        id: alarm.id,
        title: alarm.title,
        time: alarm.time,
        voiceText: msg,
        alarmType: alarm.alarmType,
        soundMode: alarm.soundMode,
        soundName: alarm.soundName,
      });
    } else {
      SoundService.playAlarmByMode(alarm.soundMode, alarm.voiceAnnouncementText, alarm.soundName);
    }
  };

  const handleTriggerTestAlert = async () => {
    SoundService.triggerHapticSuccess();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msg = `${userProfile.name}, uthne ka waqt ho gaya hai, uth jaao!`;
    AlarmMonitorService.triggerManualTest({
      title: 'Morning Wake-Up Alarm',
      time: timeStr,
      voiceText: msg,
      alarmType: 'wake',
    });
  };

  // Circadian sleep computation
  const wakeAlarm = alarms.find((a) => a.alarmType === 'wake' && a.isEnabled);
  const bedAlarm = alarms.find((a) => a.alarmType === 'bedtime' && a.isEnabled);
  const circadianStats = computeSleepDuration(
    bedAlarm?.time ?? '22:00',
    wakeAlarm?.time ?? '06:30'
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Voice Alarms"
        subtitle={`Smart precision wake & sleep • ${userProfile.name}`}
        userName={userProfile.name}
        rightActionIcon="add"
        onRightAction={() => setIsAddModalOpen(true)}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenPro={() => setIsProModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.auroraCyan}
          />
        }
        contentContainerStyle={styles.scroll}>
        {/* Circadian Sleep Card */}
        <View style={styles.circadianCard}>
          <View style={styles.circadianTop}>
            <View style={styles.sleepIconCircle}>
              <Ionicons name="moon" size={18} color={Palette.auroraPurple} />
            </View>
            <View style={styles.circadianTexts}>
              <Text style={styles.circadianTitle}>Circadian Rhythm & Voice Sleep</Text>
              <Text style={styles.circadianSubtitle}>
                Target duration: <Text style={styles.boldCyan}>{circadianStats.formatted}</Text> (approx.{' '}
                {circadianStats.cycles} sleep cycles)
              </Text>
            </View>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.schedulePill}>
              <Ionicons name="bed-outline" size={14} color={Palette.auroraPurple} />
              <Text style={styles.schedulePillText}>
                Bedtime: {bedAlarm ? formatTo12Hour(bedAlarm.time).display : '10:00 PM'}
              </Text>
            </View>
            <View style={styles.schedulePill}>
              <Ionicons name="sunny-outline" size={14} color={Palette.auroraCyan} />
              <Text style={styles.schedulePillText}>
                Wake-Up: {wakeAlarm ? formatTo12Hour(wakeAlarm.time).display : '06:30 AM'}
              </Text>
            </View>
          </View>
        </View>

        {/* Test Alert Banner */}
        <Pressable onPress={handleTriggerTestAlert} style={styles.testBanner}>
          <Ionicons name="volume-high" size={16} color={Palette.auroraCyan} />
          <Text style={styles.testBannerText}>Tap to test Voice Alarm: "{userProfile.name} uth jao..."</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.dark.textMuted} />
        </Pressable>

        {/* Alarms List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CONFIGURED ALARMS</Text>
          <Pressable
            onPress={() => setIsOnboardingModalOpen(true)}
            style={styles.reconfigureBtn}
            hitSlop={8}>
            <Ionicons name="sparkles-outline" size={12} color={Palette.auroraCyan} />
            <Text style={styles.reconfigureText}>Reconfigure Sleep & Voice</Text>
          </Pressable>
        </View>

        {alarms.map((alarm) => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            onToggle={handleToggle}
            onTestSound={handleTestSound}
            onDelete={handleDelete}
          />
        ))}

        {alarms.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="alarm-outline" size={36} color={Palette.auroraCyan} />
            <Text style={styles.emptyTitle}>No alarms configured</Text>
            <Text style={styles.emptySubtitle}>Tap "+ " to add wake-up, bedtime, or medicine alarms for {userProfile.name}.</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Alarm Modal */}
      <AddAlarmModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddAlarm}
      />

      {/* Voice Dictation Modal */}
      <VoiceRoutineModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={loadAlarms}
      />

      {/* Install Mobile PWA Modal */}
      <InstallAppModal
        visible={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Pro Subscription Modal */}
      <ProUpgradeModal
        visible={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onSuccess={loadAlarms}
      />

      {/* Dynamic Profile Setup Modal */}
      <EditProfileModal
        visible={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={(updated) => {
          setUserProfile(updated);
          loadAlarms();
        }}
      />

      {/* Onboarding / Setup Wizard Modal */}
      <OnboardingModal
        visible={isOnboardingModalOpen}
        onComplete={() => {
          setIsOnboardingModalOpen(false);
          loadAlarms();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    paddingBottom: Spacing.huge,
  },
  circadianCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  circadianTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sleepIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circadianTexts: {
    flex: 1,
  },
  circadianTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  circadianSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  boldCyan: {
    color: Palette.auroraCyan,
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  schedulePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  schedulePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  testBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  testBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.auroraCyan,
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
  },
  reconfigureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  reconfigureText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
  countBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
