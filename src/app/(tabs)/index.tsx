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
import { DailyProgressBar } from '@/components/DailyProgressBar';
import { RoutineCard } from '@/components/RoutineCard';
import { AddRoutineModal } from '@/components/AddRoutineModal';
import { VoiceRoutineModal } from '@/components/VoiceRoutineModal';
import { InstallAppModal } from '@/components/InstallAppModal';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { EditProfileModal } from '@/components/EditProfileModal';
import { RoutineRepo } from '@/services/db/routineRepo';
import { HabitRepo } from '@/services/db/habitRepo';
import { ProfileRepo, DEFAULT_USER_PROFILE } from '@/services/db/profileRepo';
import { Routine, UserProfile } from '@/services/db/types';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

export default function TodayScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [totalHabitsCount, setTotalHabitsCount] = useState(0);
  const [completedHabitsCount, setCompletedHabitsCount] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const dateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const loadData = useCallback(async () => {
    try {
      const profile = await ProfileRepo.getUserProfile();
      setUserProfile(profile);

      const routineList = await RoutineRepo.getAllRoutines(todayStr);
      setRoutines(routineList);

      const habits = await HabitRepo.getAllHabits(todayStr);
      setTotalHabitsCount(habits.length);
      setCompletedHabitsCount(habits.filter((h) => h.completedToday).length);
    } catch (e) {
      console.warn('Error loading routines:', e);
    }
  }, [todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleComplete = async (routineId: string) => {
    await RoutineRepo.toggleRoutineCompletion(routineId, todayStr);
    await loadData();
  };

  const handleToggleActive = async (routineId: string, isActive: boolean) => {
    SoundService.triggerHapticLight();
    await RoutineRepo.toggleRoutineActive(routineId, isActive);
    await loadData();
  };

  const handleDelete = async (routineId: string) => {
    SoundService.triggerHapticMedium();
    await RoutineRepo.deleteRoutine(routineId);
    await loadData();
  };

  const handleAddRoutine = async (newRoutineData: any) => {
    await RoutineRepo.addRoutine(newRoutineData);
    await loadData();
  };

  const completedRoutines = routines.filter((r) => r.isCompletedToday).length;
  const totalItems = routines.length + totalHabitsCount;
  const completedTotal = completedRoutines + completedHabitsCount;
  const progressPercent = totalItems > 0 ? (completedTotal / totalItems) * 100 : 0;

  const filteredRoutines = routines.filter((r) => {
    if (selectedBlock === 'all') return true;
    return r.timeBlock === selectedBlock;
  });

  const BLOCKS: { key: string; label: string }[] = [
    { key: 'all', label: 'All Day' },
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'evening', label: 'Evening' },
    { key: 'night', label: 'Night' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Today's Flight"
        subtitle={`Welcome back, ${userProfile.name} • ${dateFormatted}`}
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
        {/* Quick Voice Dictation Promo Banner */}
        <Pressable
          onPress={() => setIsVoiceModalOpen(true)}
          style={styles.voicePromoBanner}>
          <View style={styles.voicePromoIcon}>
            <Ionicons name="mic" size={16} color="#070A12" />
          </View>
          <View style={styles.voicePromoTextCol}>
            <Text style={styles.voicePromoTitle}>Dictate by Voice (Urdu / English)</Text>
            <Text style={styles.voicePromoSubtitle}>Tap to speak: "Set my workout at 7 AM and lunch at 2 PM"</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Palette.auroraCyan} />
        </Pressable>

        {/* Progress Widget */}
        <DailyProgressBar
          progressPercentage={progressPercent}
          completedRoutines={completedRoutines}
          totalRoutines={routines.length}
          completedHabits={completedHabitsCount}
          totalHabits={totalHabitsCount}
        />

        {/* Time-Block Filters */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {BLOCKS.map((b) => (
              <Pressable
                key={b.key}
                onPress={() => {
                  SoundService.triggerHapticLight();
                  setSelectedBlock(b.key);
                }}
                style={[
                  styles.filterPill,
                  selectedBlock === b.key && styles.filterPillActive,
                ]}>
                <Text
                  style={[
                    styles.filterText,
                    selectedBlock === b.key && styles.filterTextActive,
                  ]}>
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedBlock === 'all' ? 'SCHEDULED ROUTINES' : `${selectedBlock.toUpperCase()} BLOCK`}
          </Text>
          <Text style={styles.countBadge}>{filteredRoutines.length} items</Text>
        </View>

        {/* Routines List */}
        {filteredRoutines.length > 0 ? (
          filteredRoutines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onToggleComplete={handleToggleComplete}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles-outline" size={36} color={Palette.auroraCyan} />
            <Text style={styles.emptyTitle}>No routines scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Tap the microphone icon or "+ " button above to schedule routines for {userProfile.name}.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Routine Modal */}
      <AddRoutineModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRoutine}
      />

      {/* Voice Routine Dictation Modal */}
      <VoiceRoutineModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={loadData}
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
  voicePromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    gap: Spacing.sm,
  },
  voicePromoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.auroraCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voicePromoTextCol: {
    flex: 1,
  },
  voicePromoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  voicePromoSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    marginVertical: Spacing.md,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterPillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: Palette.auroraCyan,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  filterTextActive: {
    color: Palette.auroraCyan,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
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
