import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { VoiceRoutineModal } from '@/components/VoiceRoutineModal';
import { InstallAppModal } from '@/components/InstallAppModal';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { EditProfileModal } from '@/components/EditProfileModal';
import { AssistantRepo } from '@/services/db/assistantRepo';
import { ProfileRepo, DEFAULT_USER_PROFILE } from '@/services/db/profileRepo';
import { IntentParser } from '@/services/assistant/intentParser';
import { AssistantMessage, UserProfile } from '@/services/db/types';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

const SUGGESTIONS = [
  '⏰ Set alarm for 6:30 AM with Urdu voice',
  '⚡ Set workout at 7 AM and lunch at 2 PM',
  '📋 Add deep work routine at 9:00 AM',
  '💧 Pani pi liya habit log karo',
  '📊 Aaj ka kya plan hai?',
];

export default function PilotScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const loadData = useCallback(async () => {
    try {
      const profile = await ProfileRepo.getUserProfile();
      setUserProfile(profile);

      const history = await AssistantRepo.getMessages();
      setMessages(history);
    } catch (e) {
      console.warn('Error loading assistant messages:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? inputText).trim();
    if (!textToSend || isProcessing) return;

    SoundService.triggerHapticLight();
    setInputText('');
    setIsProcessing(true);

    const userMsg = await AssistantRepo.addMessage({
      sender: 'user',
      content: textToSend,
      profileId: 'user',
    });
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await IntentParser.processCommand(textToSend, 'user');

      const botMsg = await AssistantRepo.addMessage({
        sender: 'assistant',
        content: result.reply,
        intent: result.intent,
        actionTaken: result.actionTaken,
        profileId: 'user',
      });

      setMessages((prev) => [...prev, botMsg]);

      // Speak back the response if speakReplies is enabled!
      if (speakReplies) {
        const cleanSpeech = result.reply.replace(/[*#_•]/g, '');
        await SoundService.speakVoice(cleanSpeech, userProfile.preferredLanguage || 'ur');
      }
    } catch {
      const errorMsg = await AssistantRepo.addMessage({
        sender: 'assistant',
        content: 'Offline assistant processing encountered an error.',
      });
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleClear = async () => {
    SoundService.triggerHapticMedium();
    await AssistantRepo.clearHistory();
    const welcome = await AssistantRepo.addMessage({
      sender: 'assistant',
      content: `Assalam-o-Alaikum, ${userProfile.name}! Conversation cleared. How can I assist your day?`,
      intent: 'welcome',
    });
    setMessages([welcome]);
  };

  const handleSpeakSingleMessage = (text: string) => {
    const cleanSpeech = text.replace(/[*#_•]/g, '');
    SoundService.speakVoice(cleanSpeech, userProfile.preferredLanguage || 'ur');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Pilot AI Co-Pilot"
        subtitle={`Assalam-o-Alaikum, ${userProfile.name} • Offline AI`}
        userName={userProfile.name}
        rightActionIcon="trash-outline"
        onRightAction={handleClear}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenPro={() => setIsProModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}>
        {/* Voice Audio Feedback Toggle Bar */}
        <View style={styles.speechToggleBar}>
          <Pressable
            onPress={() => {
              SoundService.triggerHapticLight();
              setSpeakReplies(!speakReplies);
            }}
            style={styles.speechToggleBtn}>
            <Ionicons
              name={speakReplies ? 'volume-high' : 'volume-mute'}
              size={15}
              color={speakReplies ? Palette.auroraCyan : Colors.dark.textMuted}
            />
            <Text style={[styles.speechToggleText, speakReplies && styles.speechToggleTextActive]}>
              {speakReplies ? 'AI Voice Response: ON' : 'AI Voice Response: MUTED'}
            </Text>
          </Pressable>

          <Pressable onPress={() => setIsVoiceModalOpen(true)} style={styles.voiceDictationChip}>
            <Ionicons name="mic" size={13} color="#070A12" />
            <Text style={styles.voiceDictationChipText}>Dictate Routine</Text>
          </Pressable>
        </View>

        {/* Messages Stream */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubbleContainer,
                  isUser ? styles.userBubbleContainer : styles.botBubbleContainer,
                ]}>
                {!isUser && (
                  <View style={styles.botAvatar}>
                    <Ionicons name="hardware-chip" size={14} color={Palette.auroraCyan} />
                  </View>
                )}

                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                  <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                    {msg.content}
                  </Text>
                  {!isUser && (
                    <Pressable
                      onPress={() => handleSpeakSingleMessage(msg.content)}
                      style={styles.miniSpeakerBtn}
                      hitSlop={6}>
                      <Ionicons name="volume-medium-outline" size={13} color={Palette.auroraCyan} />
                      <Text style={styles.miniSpeakerText}>Hear Voice</Text>
                    </Pressable>
                  )}
                  {msg.actionTaken && (
                    <View style={styles.actionBadge}>
                      <Ionicons name="checkmark-done" size={11} color={Palette.auroraEmerald} />
                      <Text style={styles.actionBadgeText}>Autonomous Routine Created</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {isProcessing && (
            <View style={[styles.bubbleContainer, styles.botBubbleContainer]}>
              <View style={styles.botAvatar}>
                <Ionicons name="hardware-chip" size={14} color={Palette.auroraCyan} />
              </View>
              <View style={[styles.bubble, styles.botBubble]}>
                <Text style={styles.typingText}>Thinking & parsing voice command offline...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Prompt Suggestion Chips */}
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {SUGGESTIONS.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => handleSend(item.replace(/^[^\s]+\s/, ''))}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <Pressable
            onPress={() => setIsVoiceModalOpen(true)}
            style={({ pressed }) => [styles.micButton, pressed && styles.micButtonPressed]}>
            <Ionicons name="mic" size={18} color="#070A12" />
          </Pressable>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Dictate or type (e.g. Set workout at 7 AM)...`}
            placeholderTextColor={Colors.dark.textMuted}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isProcessing}
            style={({ pressed }) => [
              styles.sendButton,
              (!inputText.trim() || isProcessing) && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}>
            <Ionicons name="arrow-up" size={20} color="#070A12" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <VoiceRoutineModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={loadData}
      />

      <InstallAppModal
        visible={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

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
  container: {
    flex: 1,
  },
  speechToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  speechToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speechToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textMuted,
  },
  speechToggleTextActive: {
    color: Palette.auroraCyan,
  },
  voiceDictationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.auroraCyan,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  voiceDictationChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#070A12',
  },
  messagesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  userBubbleContainer: {
    justifyContent: 'flex-end',
  },
  botBubbleContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  userBubble: {
    backgroundColor: Palette.auroraCyan,
    borderTopRightRadius: 2,
  },
  botBubble: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#070A12',
    fontWeight: '600',
  },
  botText: {
    color: Colors.dark.text,
  },
  typingText: {
    fontSize: 13,
    color: Palette.auroraCyan,
    fontStyle: 'italic',
  },
  miniSpeakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    alignSelf: 'flex-start',
  },
  miniSpeakerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.auroraEmerald,
  },
  suggestionsContainer: {
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  suggestionsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chipPressed: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  chipText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.xs,
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.auroraCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonPressed: {
    opacity: 0.75,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.auroraCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
  sendButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
