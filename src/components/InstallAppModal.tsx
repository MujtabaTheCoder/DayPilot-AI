import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

interface InstallAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InstallAppModal({ visible, onClose }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallClick = async () => {
    SoundService.triggerHapticSuccess();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install DayPilot AI on your phone:\n\n• On iPhone: Open Safari, tap Share icon (arrow pointing up), then tap "Add to Home Screen".\n• On Android: Open Chrome, tap menu (⋮), then tap "Install app" or "Add to Home screen".');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.glowDot} />
              <Text style={styles.modalTitle}>Install DayPilot AI on Mobile</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.description}>
              Install DayPilot AI directly on Android and iPhone for all family members. Works 100% offline with zero cloud dependency.
            </Text>

            {/* Direct PWA Install Button */}
            <Pressable
              onPress={handleInstallClick}
              style={({ pressed }) => [styles.installButton, pressed && styles.installButtonPressed]}>
              <Ionicons name="download-outline" size={20} color="#070A12" />
              <Text style={styles.installButtonText}>
                {installed ? '✅ App Already Installed!' : 'Install App on This Device (PWA)'}
              </Text>
            </Pressable>

            {/* iOS Safari Guide Card */}
            <View style={styles.platformCard}>
              <View style={styles.platformHeader}>
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                <Text style={styles.platformTitle}>iPhone / iOS Installation</Text>
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>1</Text>
                <Text style={styles.stepText}>Open this link in <Text style={styles.boldWhite}>Safari</Text> on your iPhone.</Text>
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>2</Text>
                <Text style={styles.stepText}>Tap the <Text style={styles.boldWhite}>Share</Text> icon (box with upward arrow) at bottom.</Text>
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>3</Text>
                <Text style={styles.stepText}>Scroll down and select <Text style={styles.boldCyan}>"Add to Home Screen"</Text>.</Text>
              </View>
            </View>

            {/* Android Chrome Guide Card */}
            <View style={styles.platformCard}>
              <View style={styles.platformHeader}>
                <Ionicons name="logo-android" size={20} color={Palette.auroraEmerald} />
                <Text style={styles.platformTitle}>Android Phone Installation</Text>
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>1</Text>
                <Text style={styles.stepText}>Open this link in <Text style={styles.boldWhite}>Google Chrome</Text>.</Text>
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>2</Text>
                <Text style={styles.stepText}>Tap the menu icon (⋮) in the top-right corner.</Text>
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>3</Text>
                <Text style={styles.stepText}>Select <Text style={styles.boldCyan}>"Install App"</Text> or "Add to Home Screen".</Text>
              </View>
            </View>

            {/* Local Family Network Address */}
            <View style={styles.networkCard}>
              <Ionicons name="wifi-outline" size={20} color={Palette.auroraCyan} />
              <View style={styles.networkInfo}>
                <Text style={styles.networkTitle}>Local Wi-Fi Network Access</Text>
                <Text style={styles.networkDesc}>
                  Open this address on your phone browser on your home Wi-Fi:
                </Text>
                <View style={styles.ipBox}>
                  <Text style={styles.ipText}>http://localhost:8081</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.auroraCyan,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: Spacing.xl,
  },
  description: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Palette.auroraCyan,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  installButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  installButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070A12',
  },
  platformCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.sm,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: Spacing.xs,
  },
  platformTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '800',
    color: Palette.auroraCyan,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  boldCyan: {
    color: Palette.auroraCyan,
    fontWeight: '700',
  },
  networkCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  networkInfo: {
    flex: 1,
  },
  networkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.auroraCyan,
    marginBottom: 2,
  },
  networkDesc: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  ipBox: {
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  ipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
});
