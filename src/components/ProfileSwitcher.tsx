import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FamilyProfile } from '@/services/db/types';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

interface ProfileSwitcherProps {
  profiles: FamilyProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
}

export function ProfileSwitcher({
  profiles,
  activeProfileId,
  onSelectProfile,
}: ProfileSwitcherProps) {
  const handleSelect = (id: string) => {
    SoundService.triggerHapticLight();
    onSelectProfile(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* All Family Option */}
        <Pressable
          onPress={() => handleSelect('all')}
          style={[
            styles.chip,
            activeProfileId === 'all' && styles.chipActive,
          ]}>
          <Ionicons
            name="people"
            size={14}
            color={activeProfileId === 'all' ? '#070A12' : Palette.auroraCyan}
          />
          <Text
            style={[
              styles.chipText,
              activeProfileId === 'all' && styles.chipTextActive,
            ]}>
            All Family
          </Text>
        </Pressable>

        {/* Member Profiles */}
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          return (
            <Pressable
              key={p.id}
              onPress={() => handleSelect(p.id)}
              style={[
                styles.chip,
                isActive && { backgroundColor: p.color || Palette.auroraCyan, borderColor: p.color || Palette.auroraCyan },
              ]}>
              <View style={[styles.avatarCircle, { backgroundColor: isActive ? '#070A12' : `${p.color || Palette.auroraCyan}20` }]}>
                <Ionicons
                  name={(p.avatar as any) || 'person'}
                  size={12}
                  color={isActive ? p.color || Palette.auroraCyan : p.color || Palette.auroraCyan}
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}>
                {p.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chipActive: {
    backgroundColor: Palette.auroraCyan,
    borderColor: Palette.auroraCyan,
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  chipTextActive: {
    color: '#070A12',
  },
});
