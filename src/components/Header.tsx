import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;
  onRightAction?: () => void;
  onOpenVoice?: () => void;
  onOpenInstall?: () => void;
  onOpenPro?: () => void;
  onOpenProfile?: () => void;
  showPrivacyBadge?: boolean;
}

export function Header({
  title,
  subtitle,
  userName,
  rightActionIcon,
  onRightAction,
  onOpenVoice,
  onOpenInstall,
  onOpenPro,
  onOpenProfile,
  showPrivacyBadge = true,
}: HeaderProps) {
  const handlePress = () => {
    SoundService.triggerHapticLight();
    onRightAction?.();
  };

  const handleVoice = () => {
    SoundService.triggerHapticSuccess();
    onOpenVoice?.();
  };

  const handleInstall = () => {
    SoundService.triggerHapticLight();
    onOpenInstall?.();
  };

  const handlePro = () => {
    SoundService.triggerHapticLight();
    onOpenPro?.();
  };

  const handleProfile = () => {
    SoundService.triggerHapticLight();
    onOpenProfile?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <View style={styles.brandRow}>
          <View style={styles.glowDot} />
          <Text style={styles.brandText}>DAYPILOT AI</Text>
          <View style={styles.editionBadge}>
            <Text style={styles.editionText}>PERSONAL OS</Text>
          </View>
          {showPrivacyBadge && (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={10} color={Palette.auroraCyan} />
              <Text style={styles.badgeText}>OFFLINE</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.actionsRow}>
        {onOpenProfile && (
          <Pressable
            onPress={handleProfile}
            style={({ pressed }) => [styles.profilePillButton, pressed && styles.actionButtonPressed]}>
            <Ionicons name="person-circle" size={16} color={Palette.auroraCyan} />
            <Text style={styles.profilePillText}>{userName || 'Aasif'}</Text>
          </Pressable>
        )}

        {onOpenVoice && (
          <Pressable
            onPress={handleVoice}
            style={({ pressed }) => [styles.voiceButton, pressed && styles.actionButtonPressed]}>
            <Ionicons name="mic" size={18} color="#070A12" />
          </Pressable>
        )}

        {onOpenInstall && (
          <Pressable
            onPress={handleInstall}
            style={({ pressed }) => [styles.actionButton, styles.installButton, pressed && styles.actionButtonPressed]}>
            <Ionicons name="download-outline" size={18} color={Palette.auroraCyan} />
          </Pressable>
        )}

        {onOpenPro && (
          <Pressable
            onPress={handlePro}
            style={({ pressed }) => [styles.actionButton, styles.proButton, pressed && styles.actionButtonPressed]}>
            <Ionicons name="sparkles" size={17} color={Palette.auroraAmber} />
          </Pressable>
        )}

        {rightActionIcon && (
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
            <Ionicons name={rightActionIcon} size={20} color={Palette.auroraCyan} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  leftContainer: {
    flex: 1,
    minWidth: 140,
    paddingRight: Spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: 4,
    flexWrap: 'wrap',
  },
  glowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.auroraCyan,
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  brandText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: Palette.auroraCyan,
  },
  editionBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  editionText: {
    fontSize: 8,
    fontWeight: '800',
    color: Palette.auroraPurple,
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: Palette.auroraCyan,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 215,
  },
  voiceButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.auroraCyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  installButton: {
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  proButton: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  profilePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: Spacing.sm,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.auroraCyan,
    maxWidth: 80,
  },
});
