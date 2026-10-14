import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

interface InstallAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InstallAppModal({ visible, onClose }: InstallAppModalProps) {
  const localExpUrl = 'exp://192.168.18.37:8081';

  const handleOpenExpoGo = () => {
    SoundService.triggerHapticSuccess();
    Linking.openURL(localExpUrl).catch(() => {
      alert('To run natively, make sure Expo Go is installed on your phone, then scan the QR code in your PC terminal!');
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.glowDot} />
              <Text style={styles.modalTitle}>Run Native Mobile App</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.description}>
              Run DayPilot AI directly as a true native mobile app on your phone with zero browser bars, native hardware sound, and offline SQLite storage.
            </Text>

            {/* Quick Action: Open in Expo Go */}
            <Pressable
              onPress={handleOpenExpoGo}
              style={({ pressed }) => [styles.nativeLaunchBtn, pressed && styles.installButtonPressed]}>
              <Ionicons name="flash" size={18} color="#070A12" />
              <Text style={styles.nativeLaunchBtnText}>Launch in Expo Go (Native App)</Text>
            </Pressable>

            {/* Option 1: Instant Native App via Expo Go (iPhone & Android) */}
            <View style={styles.platformCard}>
              <View style={styles.platformHeader}>
                <Ionicons name="phone-portrait-outline" size={20} color={Palette.auroraCyan} />
                <Text style={styles.platformTitle}>Method 1: Instant Native App (Expo Go)</Text>
              </View>
              <Text style={styles.cardExplainer}>
                Works instantly on both iPhone and Android without cloud compile queues.
              </Text>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>1</Text>
                <Text style={styles.stepText}>
                  Install <Text style={styles.boldWhite}>Expo Go</Text> from Google Play or Apple App Store.
                </Text>
              </View>
              <View style={styles.storeButtonsRow}>
                <Pressable
                  onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=host.exp.exponent')}
                  style={styles.storeMiniBtn}>
                  <Ionicons name="logo-google-playstore" size={14} color={Palette.auroraEmerald} />
                  <Text style={styles.storeMiniBtnText}>Google Play</Text>
                </Pressable>
                <Pressable
                  onPress={() => Linking.openURL('https://apps.apple.com/app/expo-go/id982107779')}
                  style={styles.storeMiniBtn}>
                  <Ionicons name="logo-apple" size={14} color="#FFFFFF" />
                  <Text style={styles.storeMiniBtnText}>App Store</Text>
                </Pressable>
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>2</Text>
                <Text style={styles.stepText}>
                  Connect your phone to the same Wi-Fi as this PC.
                </Text>
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>3</Text>
                <Text style={styles.stepText}>
                  On Android, open Expo Go and scan the QR code in terminal. On iPhone, open the Camera app and tap the Expo Go banner!
                </Text>
              </View>
            </View>

            {/* Option 2: Standalone Native APK (Android) */}
            <View style={[styles.platformCard, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
              <View style={styles.platformHeader}>
                <Ionicons name="logo-android" size={20} color={Palette.auroraPurple} />
                <Text style={styles.platformTitle}>Method 2: Standalone APK (.apk installer)</Text>
              </View>
              <Text style={styles.cardExplainer}>
                Build an independent APK binary with its own custom launcher icon using EAS:
              </Text>
              <View style={styles.codeSnippetBox}>
                <Text style={styles.codeSnippetText}>npx eas login</Text>
                <Text style={styles.codeSnippetText}>npx eas build -p android --profile preview</Text>
              </View>
              <Text style={styles.apkExplainer}>
                Once the cloud build completes, EAS outputs a direct link to download and install the native `.apk` onto your phone.
              </Text>
            </View>

            {/* Local Wi-Fi Connection Info */}
            <View style={styles.networkCard}>
              <Ionicons name="wifi-outline" size={20} color={Palette.auroraCyan} />
              <View style={styles.networkInfo}>
                <Text style={styles.networkTitle}>Your Local Mobile Dev URL</Text>
                <Text style={styles.networkDesc}>
                  Expo Dev Server is actively running on your local Wi-Fi:
                </Text>
                <View style={styles.ipBox}>
                  <Text style={styles.ipText}>{localExpUrl}</Text>
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
  nativeLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Palette.auroraCyan,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  nativeLaunchBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070A12',
  },
  cardExplainer: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  storeButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
    paddingLeft: 28,
  },
  storeMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  storeMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  codeSnippetBox: {
    backgroundColor: '#070A12',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    gap: 4,
    marginVertical: Spacing.xs,
  },
  codeSnippetText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: Palette.auroraCyan,
  },
  apkExplainer: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    lineHeight: 15,
  },
  installButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
