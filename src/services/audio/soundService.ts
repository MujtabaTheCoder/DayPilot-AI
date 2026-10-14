import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SpeechService } from '../voice/speechService';
import { AlarmSoundMode, SupportedLanguage, Routine, VoiceGender, VoiceTone } from '../db/types';

export interface VoiceAlarmLoopOptions {
  voiceGender?: VoiceGender;
  voiceTone?: VoiceTone;
  pitch?: number;
  rate?: number;
}

let voiceLoopActive = false;
let voiceLoopTimeout: any = null;
let voiceLoopWatchdog: any = null;

export const SoundService = {
  async triggerHapticSuccess() {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  },

  async triggerHapticMedium() {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  },

  async triggerHapticLight() {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  },

  async speakVoice(
    text: string,
    lang: SupportedLanguage = 'ur',
    options?: VoiceAlarmLoopOptions
  ) {
    await this.triggerHapticSuccess();
    await SpeechService.speak(text, {
      language: lang,
      voiceGender: options?.voiceGender,
      voiceTone: options?.voiceTone,
      pitch: options?.pitch,
      rate: options?.rate,
    });
  },

  async stopSpeech() {
    this.stopVoiceAlarmLoop();
    await SpeechService.stop();
  },

  /**
   * Continuous repeating voice alarm loop.
   * Speaks the voice announcement repeatedly with short intervals until stopped or snoozed.
   * Guaranteed unbreakable: uses a watchdog timer to auto-cycle even if platform TTS drops onDone.
   */
  startVoiceAlarmLoop(
    voiceText: string,
    lang: SupportedLanguage = 'ur',
    onCycle?: (cycleCount: number) => void,
    options?: VoiceAlarmLoopOptions
  ) {
    this.stopVoiceAlarmLoop();
    voiceLoopActive = true;
    let cycle = 0;

    const runCycle = async () => {
      if (!voiceLoopActive) return;
      cycle++;
      onCycle?.(cycle);
      await this.triggerHapticMedium();

      let hasAdvanced = false;
      const advanceToNext = () => {
        if (hasAdvanced || !voiceLoopActive) return;
        hasAdvanced = true;

        if (voiceLoopWatchdog) {
          clearTimeout(voiceLoopWatchdog);
          voiceLoopWatchdog = null;
        }

        voiceLoopTimeout = setTimeout(() => {
          if (voiceLoopActive) {
            runCycle();
          }
        }, 2200);
      };

      // Watchdog failsafe: if TTS onDone doesn't fire within 8.5s, force-cycle next loop
      voiceLoopWatchdog = setTimeout(() => {
        if (!hasAdvanced && voiceLoopActive) {
          advanceToNext();
        }
      }, 8500);

      await SpeechService.speak(voiceText, {
        language: lang,
        voiceGender: options?.voiceGender,
        voiceTone: options?.voiceTone,
        pitch: options?.pitch,
        rate: options?.rate,
        onDone: advanceToNext,
      });
    };

    runCycle();
  },

  /**
   * Stops the continuous voice alarm loop immediately.
   */
  stopVoiceAlarmLoop() {
    voiceLoopActive = false;
    if (voiceLoopTimeout) {
      clearTimeout(voiceLoopTimeout);
      voiceLoopTimeout = null;
    }
    if (voiceLoopWatchdog) {
      clearTimeout(voiceLoopWatchdog);
      voiceLoopWatchdog = null;
    }
    SpeechService.stop();
  },

  isVoiceAlarmLooping(): boolean {
    return voiceLoopActive;
  },

  /**
   * Speaks a morning schedule briefing of today's actual scheduled tasks
   * upon the user tapping "I'm Awake / Done".
   */
  async speakMorningBriefing(
    userName: string,
    routines: Routine[],
    lang: SupportedLanguage = 'ur',
    options?: VoiceAlarmLoopOptions
  ): Promise<void> {
    const activeTasks = routines.filter((r) => r.isActive !== false);
    const count = activeTasks.length;
    let briefingText = '';

    if (count > 0) {
      const taskList = activeTasks
        .slice(0, 3)
        .map((r) => `${r.title} at ${r.scheduledTime}`)
        .join(', ');
      briefingText = `Shabaash ${userName}! Uthne ka waqt khatam hua. Aaj aapke schedule mein ${count} routines hain: ${taskList}. Din shuru karein aur kamyab rahein!`;
    } else {
      briefingText = `Shabaash ${userName}! Uthne ka waqt khatam hua. Aaj aapka schedule abhi clear hai. Din shuru karein aur enjoy karein!`;
    }

    await this.triggerHapticSuccess();
    await SpeechService.speak(briefingText, {
      language: lang,
      voiceGender: options?.voiceGender,
      voiceTone: options?.voiceTone,
      pitch: options?.pitch,
      rate: options?.rate,
    });
  },

  /**
   * Speaks a bedtime goodnight acknowledgment when dismissing a bedtime alert.
   */
  async speakBedtimeAcknowledgment(
    userName: string,
    lang: SupportedLanguage = 'ur',
    options?: VoiceAlarmLoopOptions
  ): Promise<void> {
    const text = `Shab bakhair ${userName}! Aaraam se so jao, sweet dreams. Subha nayi energy ke saath milte hain.`;
    await this.triggerHapticSuccess();
    await SpeechService.speak(text, {
      language: lang,
      voiceGender: options?.voiceGender,
      voiceTone: options?.voiceTone,
      pitch: options?.pitch,
      rate: options?.rate,
    });
  },

  async playAlarmByMode(
    mode: AlarmSoundMode,
    voiceText?: string,
    _soundName?: string,
    lang: SupportedLanguage = 'ur'
  ) {
    if (mode === 'voice' && voiceText) {
      await this.speakVoice(voiceText, lang);
    } else if (mode === 'chime') {
      await this.playChime();
    } else {
      await this.playAlarmSound();
    }
  },

  async playChime() {
    await this.triggerHapticSuccess();

    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).AudioContext) {
      try {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(739.99, now); // F#5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.6);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1108.73, now + 0.15); // C#6
        gain2.gain.setValueAtTime(0.15, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.9);
      } catch {}
    }
  },

  async playAlarmSound() {
    await this.triggerHapticMedium();

    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).AudioContext) {
      try {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.18);
          gain.gain.setValueAtTime(0.2, now + i * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.18);
          osc.stop(now + (i + 1) * 0.18);
        });
      } catch {}
    }
  },
};
