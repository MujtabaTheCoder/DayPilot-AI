import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { UserProfile, SupportedLanguage } from '@/services/db/types';
import { ProfileRepo } from '@/services/db/profileRepo';
import { SoundService } from '@/services/audio/soundService';
import { SpeechService } from '@/services/voice/speechService';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (profile: UserProfile) => void;
}

const LANGUAGES: { id: SupportedLanguage; label: string; flag: string }[] = [
  { id: 'ur', label: 'Urdu (اردو)', flag: '🇵🇰' },
  { id: 'hi', label: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { id: 'en', label: 'English (US)', flag: '🌐' },
];

export function EditProfileModal({ visible, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState('Aasif');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('ur');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    if (visible) {
      ProfileRepo.getUserProfile().then((profile) => {
        setName(profile.name || 'Aasif');
        setSelectedLang(profile.preferredLanguage || 'ur');
        setVoiceEnabled(profile.voiceEnabled !== false);
      });
    }
  }, [visible]);

  const handleTestVoice = async () => {
    const trimmed = name.trim() || 'Aasif';
    const sampleVoicePrompt = SpeechService.generateVoicePrompt(trimmed, 'wake');
    setIsTestingVoice(true);
    await SoundService.speakVoice(sampleVoicePrompt, selectedLang);
    setIsTestingVoice(false);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    SoundService.triggerHapticSuccess();
    const updated = await ProfileRepo.updateUserProfile({
      name: trimmed,
      preferredLanguage: selectedLang,
      voiceEnabled,
    });

    onSave?.(updated);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>Profile & Voice Setup</Text>
              <Text style={styles.modalSubtitle}>Customize your name & dynamic AI voice</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          {/* User Name Input */}
          <Text style={styles.fieldLabel}>Your Custom Name *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-circle-outline" size={22} color={Palette.auroraCyan} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Aasif, Mujtaba, Hamza, Sara"
              placeholderTextColor={Colors.dark.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Preferred Language */}
          <Text style={styles.fieldLabel}>AI Voice Language</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.id}
                onPress={() => {
                  SoundService.triggerHapticLight();
                  setSelectedLang(lang.id);
                }}
                style={[
                  styles.langPill,
                  selectedLang === lang.id && styles.langPillActive,
                ]}>
                <Text style={styles.flagEmoji}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.langText,
                    selectedLang === lang.id && styles.langTextActive,
                  ]}>
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Voice Preview & Test Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="volume-high" size={18} color={Palette.auroraCyan} />
              <Text style={styles.previewTitle}>Spoken Alarm Preview</Text>
            </View>
            <Text style={styles.previewQuote}>
              "{name.trim() || 'Aasif'}, ab tumhara uthne ka waqt ho gaya hai, uth jao!"
            </Text>
            <Pressable
              onPress={handleTestVoice}
              disabled={isTestingVoice}
              style={({ pressed }) => [
                styles.testVoiceButton,
                pressed && styles.testVoiceButtonPressed,
              ]}>
              <Ionicons name="play" size={15} color={Palette.auroraCyan} />
              <Text style={styles.testVoiceText}>Hear My Name Spoken</Text>
            </Pressable>
          </View>

          {/* Toggle Voice Alarms */}
          <Pressable
            onPress={() => {
              SoundService.triggerHapticLight();
              setVoiceEnabled(!voiceEnabled);
            }}
            style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons
                name={voiceEnabled ? 'mic-outline' : 'mic-off-outline'}
                size={20}
                color={voiceEnabled ? Palette.auroraCyan : Colors.dark.textMuted}
              />
              <View>
                <Text style={styles.toggleTitle}>Voice Announcements</Text>
                <Text style={styles.toggleSubtitle}>Speak alerts dynamically via on-device TTS</Text>
              </View>
            </View>
            <Ionicons
              name={voiceEnabled ? 'checkbox' : 'square-outline'}
              size={24}
              color={voiceEnabled ? Palette.auroraCyan : Colors.dark.textMuted}
            />
          </Pressable>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={!name.trim()}
            style={({ pressed }) => [
              styles.saveButton,
              !name.trim() && styles.saveButtonDisabled,
              pressed && styles.saveButtonPressed,
            ]}>
            <Ionicons name="checkmark-done" size={20} color="#070A12" />
            <Text style={styles.saveButtonText}>Save Profile & Apply Voice</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  langPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  langPillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: Palette.auroraCyan,
  },
  flagEmoji: {
    fontSize: 13,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  langTextActive: {
    color: Palette.auroraCyan,
  },
  previewCard: {
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.auroraCyan,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewQuote: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  testVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  testVoiceButtonPressed: {
    opacity: 0.75,
  },
  testVoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Palette.auroraCyan,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#070A12',
  },
});
