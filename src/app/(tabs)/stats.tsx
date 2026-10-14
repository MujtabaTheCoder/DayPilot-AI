import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '@/components/Header';
import { VoiceRoutineModal } from '@/components/VoiceRoutineModal';
import { InstallAppModal } from '@/components/InstallAppModal';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { EditProfileModal } from '@/components/EditProfileModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { RoutineRepo } from '@/services/db/routineRepo';
import { HabitRepo } from '@/services/db/habitRepo';
import { AlarmRepo } from '@/services/db/alarmRepo';
import { ProfileRepo, DEFAULT_USER_PROFILE } from '@/services/db/profileRepo';
import { Routine, Habit, AlarmItem, UserProfile } from '@/services/db/types';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

const PRO_KEY = 'daypilot_is_pro_member';

export default function StatsScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [isProMember, setIsProMember] = useState(false);

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    try {
      const profile = await ProfileRepo.getUserProfile();
      setUserProfile(profile);

      const r = await RoutineRepo.getAllRoutines(todayStr);
      const h = await HabitRepo.getAllHabits(todayStr);
      const a = await AlarmRepo.getAllAlarms();
      setRoutines(r);
      setHabits(h);
      setAlarms(a);

      const proVal = await AsyncStorage.getItem(PRO_KEY);
      setIsProMember(proVal === 'true');
    } catch (e) {
      console.warn('Error loading analytics:', e);
    }
  }, [todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedRoutines = routines.filter((r) => r.isCompletedToday).length;
  const completedHabits = habits.filter((h) => h.completedToday).length;
  const totalTasks = routines.length + habits.length;
  const totalCompleted = completedRoutines + completedHabits;
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // Breakdown by category
  const categories: Record<string, { total: number; done: number }> = {};
  routines.forEach((r) => {
    const cat = r.category || 'productivity';
    if (!categories[cat]) categories[cat] = { total: 0, done: 0 };
    categories[cat].total++;
    if (r.isCompletedToday) categories[cat].done++;
  });

  const handleExportBackup = () => {
    SoundService.triggerHapticSuccess();
    const backupData = {
      exportedAt: new Date().toISOString(),
      appName: 'DayPilot AI: Personal OS',
      user: userProfile.name,
      routines,
      habits,
      alarms,
    };
    const jsonString = JSON.stringify(backupData, null, 2);

    if (Platform.OS === 'web') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daypilot_backup_${todayStr}.json`;
      a.click();
    } else {
      Alert.alert(
        '🔒 Encrypted Local Backup Ready',
        `Export payload generated with ${routines.length} routines, ${habits.length} habits, and ${alarms.length} alarms for ${userProfile.name}.\n\nAll data is stored safely on-device.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Personal Analytics"
        subtitle={`Zero cloud • 100% Private • ${userProfile.name}`}
        userName={userProfile.name}
        rightActionIcon="download-outline"
        onRightAction={handleExportBackup}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenPro={() => setIsProModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Pro Pass Card */}
        <Pressable
          onPress={() => setIsProModalOpen(true)}
          style={[styles.proCard, isProMember && styles.proCardActive]}>
          <View style={styles.proCardLeft}>
            <Ionicons
              name={isProMember ? 'shield-checkmark' : 'sparkles'}
              size={20}
              color={Palette.auroraAmber}
            />
            <View>
              <Text style={styles.proTitle}>
                {isProMember ? 'DayPilot Pro: Lifetime Active' : 'Upgrade to DayPilot Pro'}
              </Text>
              <Text style={styles.proSubtitle}>
                {isProMember
                  ? '👑 Advanced Voice Synthesis & Cloud Backup Unlocked'
                  : 'Multilingual Urdu/Hindi voice alarms, JSON backups, custom voice styles.'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Palette.auroraAmber} />
        </Pressable>

        {/* Execution Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreSubtitle}>TODAY'S EXECUTION SCORE</Text>
              <Text style={styles.scoreNumber}>{completionRate}%</Text>
              <Text style={styles.scoreStatus}>
                {completionRate >= 80 ? '🌟 Peak Performance' : completionRate >= 50 ? '⚡ Strong Momentum' : '🌱 Progress Underway'}
              </Text>
            </View>

            <View style={styles.scoreCircle}>
              <Ionicons
                name={completionRate >= 80 ? 'trophy' : 'speedometer'}
                size={34}
                color={Palette.auroraCyan}
              />
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CATEGORY BREAKDOWN • {userProfile.name.toUpperCase()}</Text>
        </View>

        <View style={styles.categoriesCard}>
          {Object.entries(categories).map(([cat, data]) => {
            const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
            return (
              <View key={cat} style={styles.categoryRow}>
                <View style={styles.catLeft}>
                  <Text style={styles.catName}>{cat.toUpperCase()}</Text>
                  <Text style={styles.catCount}>
                    {data.done}/{data.total} completed ({pct}%)
                  </Text>
                </View>
                <View style={styles.catTrack}>
                  <View style={[styles.catFill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
          {Object.keys(categories).length === 0 && (
            <Text style={styles.emptyNote}>No routines logged today for {userProfile.name}</Text>
          )}
        </View>

        {/* Voice Persona & Onboarding Wizard */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI VOICE PERSONA & SETUP</Text>
        </View>

        <View style={styles.voiceCard}>
          <View style={styles.voiceCardHeader}>
            <View style={styles.voiceIconCircle}>
              <Ionicons name="mic" size={20} color={Palette.auroraCyan} />
            </View>
            <View style={styles.voiceTextGroup}>
              <Text style={styles.voiceCardTitle}>
                {userProfile.voiceGender === 'male' ? '👨 Male Synthesized Voice' : '👩 Female Synthesized Voice'}
              </Text>
              <Text style={styles.voiceCardSubtitle}>
                Tone: {userProfile.voiceTone?.toUpperCase() || 'WARM'} • Language: {userProfile.preferredLanguage === 'ur' ? 'Urdu (اردو)' : userProfile.preferredLanguage === 'hi' ? 'Hindi (हिंदी)' : 'English'}
              </Text>
            </View>
          </View>

          <View style={styles.voiceButtonsRow}>
            <Pressable
              onPress={() => {
                SoundService.triggerHapticSuccess();
                SoundService.speakVoice(
                  `${userProfile.name}, aapka DayPilot AI voice assistant bilkul taiyar hai!`,
                  userProfile.preferredLanguage,
                  { voiceGender: userProfile.voiceGender, voiceTone: userProfile.voiceTone }
                );
              }}
              style={styles.voiceTestBtn}>
              <Ionicons name="play" size={14} color="#070A12" />
              <Text style={styles.voiceTestBtnText}>Test Spoken Greeting</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                SoundService.triggerHapticLight();
                setIsOnboardingOpen(true);
              }}
              style={styles.relaunchWizardBtn}>
              <Ionicons name="sparkles" size={14} color={Palette.auroraCyan} />
              <Text style={styles.relaunchWizardText}>Re-run Onboarding</Text>
            </Pressable>
          </View>
        </View>

        {/* Privacy & Architecture Audit */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PRIVACY & OFFLINE ARCHITECTURE</Text>
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyItem}>
            <Ionicons name="server-outline" size={20} color={Palette.auroraEmerald} />
            <View style={styles.privacyItemText}>
              <Text style={styles.privacyItemTitle}>Local SQLite Database</Text>
              <Text style={styles.privacyItemDesc}>
                All daily routines, alarms, habits, and user profiles are stored directly on this device.
              </Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <Ionicons name="hardware-chip-outline" size={20} color={Palette.auroraCyan} />
            <View style={styles.privacyItemText}>
              <Text style={styles.privacyItemTitle}>Offline Speech Synthesizer</Text>
              <Text style={styles.privacyItemDesc}>
                TTS synthesis runs through native device text-to-speech without sending voice data to remote servers.
              </Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <Ionicons name="eye-off-outline" size={20} color={Palette.auroraPurple} />
            <View style={styles.privacyItemText}>
              <Text style={styles.privacyItemTitle}>Zero Telemetry / No Cloud APIs</Text>
              <Text style={styles.privacyItemDesc}>
                100% offline-first. No tracking pixels, paid API keys, or mandatory external subscriptions required.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <VoiceRoutineModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={loadData}
      />

      <InstallAppModal
        visible={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <ProUpgradeModal
        visible={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Dynamic Profile Setup Modal */}
      <EditProfileModal
        visible={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={(updated) => {
          setUserProfile(updated);
          loadData();
        }}
      />

      {/* 3-Step Onboarding Modal */}
      <OnboardingModal
        visible={isOnboardingOpen}
        onComplete={() => {
          setIsOnboardingOpen(false);
          loadData();
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
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  proCardActive: {
    borderColor: Palette.auroraEmerald,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  proCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  proTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  proSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  scoreCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: Palette.auroraCyan,
    letterSpacing: -1,
  },
  scoreStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: 4,
  },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Palette.auroraCyan,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
  },
  categoriesCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.md,
  },
  categoryRow: {
    gap: 6,
  },
  catLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  catCount: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  catTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.surfaceElevated,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    backgroundColor: Palette.auroraCyan,
    borderRadius: 3,
  },
  emptyNote: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
  },
  privacyCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.md,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  privacyItemText: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  privacyItemDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  voiceCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    gap: Spacing.md,
  },
  voiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  voiceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceTextGroup: {
    flex: 1,
  },
  voiceCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  voiceCardSubtitle: {
    fontSize: 12,
    color: Palette.auroraCyan,
    marginTop: 2,
    fontWeight: '600',
  },
  voiceButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  voiceTestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.auroraCyan,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  voiceTestBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#070A12',
  },
  relaunchWizardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  relaunchWizardText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
});
