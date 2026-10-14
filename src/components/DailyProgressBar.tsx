import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface DailyProgressBarProps {
  progressPercentage: number;
  completedRoutines: number;
  totalRoutines: number;
  completedHabits: number;
  totalHabits: number;
}

export function DailyProgressBar({
  progressPercentage,
  completedRoutines,
  totalRoutines,
  completedHabits,
  totalHabits,
}: DailyProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.cardTitle}>Today's Execution</Text>
          <Text style={styles.cardSubtitle}>
            {completedRoutines}/{totalRoutines} Routines • {completedHabits}/{totalHabits} Habits
          </Text>
        </View>

        <View style={styles.scorePill}>
          <Ionicons
            name={clampedProgress === 100 ? 'trophy' : 'flash'}
            size={14}
            color={clampedProgress === 100 ? Palette.auroraAmber : Palette.auroraCyan}
          />
          <Text style={styles.scoreText}>{clampedProgress}%</Text>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clampedProgress}%` }]} />
      </View>

      {/* Feedback message */}
      <View style={styles.bottomRow}>
        <Text style={styles.motivationText}>
          {clampedProgress === 100
            ? '🔥 Flawless day! All routines and habits completed.'
            : clampedProgress >= 70
            ? '⚡ Exceptional momentum. Finish the day strong!'
            : clampedProgress >= 30
            ? '🚀 Great start. Keep knocking out your time blocks.'
            : '🌱 Ready to conquer your daily blocks? Tap to check in.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  labelGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.auroraCyan,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Palette.auroraCyan,
  },
  bottomRow: {
    marginTop: Spacing.sm,
  },
  motivationText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
  },
});
