import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';
import { IntentParser, CommandExecutionResult } from '@/services/assistant/intentParser';
import { ProfileRepo } from '@/services/db/profileRepo';

interface VoiceRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VOICE_PRESETS = [
  'Set workout at 7 AM and lunch at 2 PM',
  'Set alarm for 6:30 AM with Urdu voice',
  'Add deep work routine at 9:00 AM',
  'Pani pi liya habit log karo',
  'Aaj ka kya plan hai?',
];

export function VoiceRoutineModal({ visible, onClose, onSuccess }: VoiceRoutineModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setTranscript('');
      setResultMessage(null);
      setIsListening(false);
      SoundService.stopSpeech();
    }
  }, [visible]);

  const startVoiceRecognition = () => {
    SoundService.triggerHapticSuccess();
    setResultMessage(null);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'ur-PK, hi-IN, en-US';
          recognition.continuous = false;
          recognition.interimResults = true;

          setIsListening(true);

          recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript;
            setTranscript(text);
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
          return;
        } catch {
          setIsListening(false);
        }
      }
    }

    // Native simulation or fallback if web SpeechRecognition is not accessible
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      if (!transcript) {
        setTranscript('Set workout at 7 AM and lunch at 2 PM');
      }
    }, 2000);
  };

  const handleExecuteVoice = async (textToUse?: string) => {
    const finalQuery = (textToUse ?? transcript).trim();
    if (!finalQuery || isProcessing) return;

    SoundService.triggerHapticSuccess();
    setIsProcessing(true);

    try {
      const active = await ProfileRepo.getActiveProfile();
      const result: CommandExecutionResult = await IntentParser.processCommand(finalQuery, active.id);

      setResultMessage(result.reply);

      // Speak back the response in natural Urdu/English voice!
      await SoundService.speakVoice(result.reply.replace(/[*#]/g, ''), active.preferredLanguage);

      onSuccess();
    } catch {
      setResultMessage('Command processing encountered an offline issue.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestHearVoice = async () => {
    if (!transcript.trim()) return;
    await SoundService.speakVoice(transcript.trim(), 'ur');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.modalTitle}>Voice Routine Dictation</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.subhead}>
              Dictate single or multi-step routines in English, Urdu, or Roman Urdu without typing.
            </Text>

            {/* Glowing Microphone Visualizer */}
            <View style={styles.micContainer}>
              <Pressable
                onPress={startVoiceRecognition}
                style={({ pressed }) => [
                  styles.micCircle,
                  isListening && styles.micCircleListening,
                  pressed && styles.micCirclePressed,
                ]}>
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={36}
                  color={isListening ? '#070A12' : Palette.auroraCyan}
                />
              </Pressable>
              <Text style={styles.micStatusText}>
                {isListening ? 'Listening to your voice... Speak now' : 'Tap Microphone to Speak'}
              </Text>
            </View>

            {/* Live Transcript / Text Box */}
            <Text style={styles.fieldLabel}>Voice Transcript / Spoken Command</Text>
            <TextInput
              style={styles.transcriptInput}
              value={transcript}
              onChangeText={setTranscript}
              placeholder="e.g. Set workout at 7 AM and lunch at 2 PM or Set alarm for 6:30 AM"
              placeholderTextColor={Colors.dark.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Test Hear Voice Button */}
            {transcript.trim().length > 0 && (
              <Pressable onPress={handleTestHearVoice} style={styles.previewHearButton}>
                <Ionicons name="volume-high-outline" size={16} color={Palette.auroraCyan} />
                <Text style={styles.previewHearText}>Hear Synthesized Voice Sample</Text>
              </Pressable>
            )}

            {/* Quick Sample Voice Presets */}
            <Text style={styles.fieldLabel}>Try Family Voice Presets</Text>
            <View style={styles.presetsRow}>
              {VOICE_PRESETS.map((preset, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    setTranscript(preset);
                    handleExecuteVoice(preset);
                  }}
                  style={styles.presetChip}>
                  <Ionicons name="sparkles-outline" size={12} color={Palette.auroraCyan} />
                  <Text style={styles.presetText}>{preset}</Text>
                </Pressable>
              ))}
            </View>

            {/* Result display */}
            {resultMessage && (
              <View style={styles.resultCard}>
                <Ionicons name="checkmark-circle" size={18} color={Palette.auroraEmerald} />
                <Text style={styles.resultText}>{resultMessage}</Text>
              </View>
            )}

            {/* Execute Command Button */}
            <Pressable
              onPress={() => handleExecuteVoice()}
              disabled={!transcript.trim() || isProcessing}
              style={({ pressed }) => [
                styles.submitButton,
                (!transcript.trim() || isProcessing) && styles.submitButtonDisabled,
                pressed && styles.submitButtonPressed,
              ]}>
              <Ionicons name="rocket-outline" size={18} color="#070A12" />
              <Text style={styles.submitButtonText}>
                {isProcessing ? 'Processing Voice...' : 'Execute & Save Routine'}
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
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pulseDot: {
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
    paddingBottom: Spacing.lg,
  },
  subhead: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  micCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 2,
    borderColor: Palette.auroraCyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  micCircleListening: {
    backgroundColor: Palette.auroraCyan,
    transform: [{ scale: 1.08 }],
  },
  micCirclePressed: {
    transform: [{ scale: 0.95 }],
  },
  micStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.auroraCyan,
    marginTop: Spacing.sm,
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
  transcriptInput: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  previewHearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  previewHearText: {
    fontSize: 11,
    color: Palette.auroraCyan,
    fontWeight: '600',
  },
  presetsRow: {
    gap: Spacing.xs,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  presetText: {
    fontSize: 12,
    color: Colors.dark.text,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Palette.auroraCyan,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070A12',
  },
});
