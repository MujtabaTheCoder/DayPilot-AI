import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { HabitCard } from '@/components/HabitCard';
import { AddHabitModal } from '@/components/AddHabitModal';
import { VoiceRoutineModal } from '@/components/VoiceRoutineModal';
import { InstallAppModal } from '@/components/InstallAppModal';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { EditProfileModal } from '@/components/EditProfileModal';
import { HabitRepo } from '@/services/db/habitRepo';
import { ProfileRepo, DEFAULT_USER_PROFILE } from '@/services/db/profileRepo';
import { Habit, UserProfile } from '@/services/db/types';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

export default function HabitsScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [habits, setHabits] = useState<Habit[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadHabits = useCallback(async () => {
    try {
      const profile = await ProfileRepo.getUserProfile();
      setUserProfile(profile);

      const list = await HabitRepo.getAllHabits(todayStr);
      setHabits(list);
    } catch (e) {
      console.warn('Error loading habits:', e);
    }
  }, [todayStr]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  const handleToggleToday = async (habitId: string) => {
    await HabitRepo.toggleHabitLog(habitId, todayStr);
    await loadHabits();
  };

  const handleDelete = async (habitId: string) => {
    SoundService.triggerHapticMedium();
    await HabitRepo.deleteHabit(habitId);
    await loadHabits();
  };

  const handleAddHabit = async (data: Omit<Habit, 'id' | 'createdAt'>) => {
    await HabitRepo.addHabit(data);
    await loadHabits();
  };

  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak ?? 0), 0);
  const completedTodayCount = habits.filter((h) => h.completedToday).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Habit Streaks"
        subtitle={`Consistency tracking • ${userProfile.name}`}
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
        {/* Leader / Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOP STREAK</Text>
            <View style={styles.summaryValueRow}>
              <Text style={styles.flameEmoji}>🔥</Text>
              <Text style={styles.summaryValue}>{bestStreak} Days</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TODAY'S LOG</Text>
            <View style={styles.summaryValueRow}>
              <Text style={styles.summaryValue}>
                {completedTodayCount}/{habits.length}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>CONSISTENCY</Text>
            <View style={styles.summaryValueRow}>
              <Text style={styles.summaryValue}>
                {habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACTIVE HABITS</Text>
          <Text style={styles.countBadge}>{habits.length} habits</Text>
        </View>

        {/* Habit Cards */}
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggleToday={handleToggleToday}
            onDelete={handleDelete}
          />
        ))}

        {habits.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="flame-outline" size={36} color={Palette.auroraAmber} />
            <Text style={styles.emptyTitle}>No habits tracked yet</Text>
            <Text style={styles.emptySubtitle}>Tap "+ " to start your first habit streak for {userProfile.name}.</Text>
          </View>
        )}
      </ScrollView>

      <AddHabitModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddHabit}
      />

      <VoiceRoutineModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={loadHabits}
      />

      <InstallAppModal
        visible={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <ProUpgradeModal
        visible={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onSuccess={loadHabits}
      />

      {/* Dynamic Profile Setup Modal */}
      <EditProfileModal
        visible={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={(updated) => {
          setUserProfile(updated);
          loadHabits();
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flameEmoji: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
