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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRO_KEY = 'daypilot_is_pro_member';

export function ProUpgradeModal({ visible, onClose, onSuccess }: ProUpgradeModalProps) {
  const [isPro, setIsPro] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('lifetime');

  useEffect(() => {
    AsyncStorage.getItem(PRO_KEY).then((val) => {
      if (val === 'true') setIsPro(true);
    });
  }, [visible]);

  const handleActivatePro = async () => {
    SoundService.playChime();
    await AsyncStorage.setItem(PRO_KEY, 'true');
    setIsPro(true);
    onSuccess?.();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Ionicons name="sparkles" size={18} color={Palette.auroraAmber} />
              <Text style={styles.modalTitle}>DayPilot Pro: Family Edition</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.tagline}>
              Empower your whole family with AI Voice Alarms, Urdu/Hindi Announcements, and unified Routine OS.
            </Text>

            {/* Feature Comparison Grid */}
            <View style={styles.featuresCard}>
              <View style={styles.featureRow}>
                <Ionicons name="mic-outline" size={18} color={Palette.auroraCyan} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>Multilingual AI Voice Announcements</Text>
                  <Text style={styles.featureDesc}>Natural Urdu, Hindi, and English voice alarms customized with your name.</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={Palette.auroraEmerald} />
              </View>

              <View style={styles.divider} />

              <View style={styles.featureRow}>
                <Ionicons name="sparkles-outline" size={18} color={Palette.auroraPurple} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>Advanced Life OS & Analytics</Text>
                  <Text style={styles.featureDesc}>Unlimited routines, custom AI voice styles, and performance PDF exports.</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={Palette.auroraEmerald} />
              </View>

              <View style={styles.divider} />

              <View style={styles.featureRow}>
                <Ionicons name="hardware-chip-outline" size={18} color={Palette.auroraEmerald} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>100% Offline Privacy Guarantee</Text>
                  <Text style={styles.featureDesc}>Zero cloud tracking, zero ads, all routines stored in on-device SQLite.</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={Palette.auroraEmerald} />
              </View>

              <View style={styles.divider} />

              <View style={styles.featureRow}>
                <Ionicons name="document-text-outline" size={18} color={Palette.auroraBlue} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>Weekly Family Analytics & Backup</Text>
                  <Text style={styles.featureDesc}>One-tap encrypted JSON backup and performance reports.</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={Palette.auroraEmerald} />
              </View>
            </View>

            {/* Pricing Tiers */}
            <View style={styles.pricingRow}>
              <Pressable
                onPress={() => setSelectedPlan('monthly')}
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardActive,
                ]}>
                <Text style={styles.planName}>Monthly Pass</Text>
                <Text style={styles.planPrice}>$4.99<Text style={styles.planPeriod}>/mo</Text></Text>
                <Text style={styles.planSub}>Flexible billing</Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedPlan('lifetime')}
                style={[
                  styles.planCard,
                  selectedPlan === 'lifetime' && styles.planCardActive,
                ]}>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                <Text style={styles.planName}>Lifetime Family Pass</Text>
                <Text style={styles.planPrice}>$29.99</Text>
                <Text style={styles.planSub}>One-time payment</Text>
              </Pressable>
            </View>

            {/* Action Button */}
            <Pressable
              onPress={handleActivatePro}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
              <Ionicons name={isPro ? 'checkmark-circle' : 'sparkles'} size={18} color="#070A12" />
              <Text style={styles.actionButtonText}>
                {isPro ? 'Family Pro Active 🎉' : selectedPlan === 'lifetime' ? 'Unlock Lifetime Family Pass ($29.99)' : 'Start Monthly Pass ($4.99)'}
              </Text>
            </Pressable>
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
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
  tagline: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  featuresCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  featureDesc: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pricingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  planCard: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  planCardActive: {
    borderColor: Palette.auroraAmber,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -9,
    backgroundColor: Palette.auroraAmber,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  bestValueText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#070A12',
  },
  planName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
    marginVertical: 2,
  },
  planPeriod: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    fontWeight: '600',
  },
  planSub: {
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Palette.auroraAmber,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070A12',
  },
});
