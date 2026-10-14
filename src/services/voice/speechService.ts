import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { SupportedLanguage, VoiceGender, VoiceTone } from '../db/types';

export interface VoiceStyleConfig {
  label: string;
  tone: VoiceTone;
  gender: VoiceGender;
  pitch: number;
  rate: number;
  description: string;
}

export const VOICE_PROFILES: Record<VoiceGender, Record<VoiceTone, VoiceStyleConfig>> = {
  female: {
    warm: {
      label: 'Warm & Caring (Female)',
      tone: 'warm',
      gender: 'female',
      pitch: 1.05,
      rate: 0.88,
      description: 'Soft, gentle, comforting wake-up and daily guidance',
    },
    energetic: {
      label: 'Energetic & Bright (Female)',
      tone: 'energetic',
      gender: 'female',
      pitch: 1.15,
      rate: 0.95,
      description: 'High-energy, lively tempo for instant alertness',
    },
    calm: {
      label: 'Calm & Peaceful (Female)',
      tone: 'calm',
      gender: 'female',
      pitch: 1.02,
      rate: 0.85,
      description: 'Serene, meditative tone ideal for early mornings',
    },
    authoritative: {
      label: 'Clear & Disciplined (Female)',
      tone: 'authoritative',
      gender: 'female',
      pitch: 1.08,
      rate: 0.90,
      description: 'Crisp, firm call that ensures you rise on time',
    },
  },
  male: {
    warm: {
      label: 'Warm & Friendly (Male)',
      tone: 'warm',
      gender: 'male',
      pitch: 0.95,
      rate: 0.88,
      description: 'Warm, reassuring brotherly wake-up voice',
    },
    energetic: {
      label: 'Dynamic & Bold (Male)',
      tone: 'energetic',
      gender: 'male',
      pitch: 1.00,
      rate: 0.95,
      description: 'Athletic, high-drive motivation to conquer the day',
    },
    calm: {
      label: 'Deep & Grounded (Male)',
      tone: 'calm',
      gender: 'male',
      pitch: 0.90,
      rate: 0.85,
      description: 'Deep, steady, peaceful resonance',
    },
    authoritative: {
      label: 'Commander & Direct (Male)',
      tone: 'authoritative',
      gender: 'male',
      pitch: 0.92,
      rate: 0.90,
      description: 'Unyielding, prompt alarm cadence',
    },
  },
};

/**
 * Normalizes Roman Urdu and Hindi text before sending to native TTS.
 * Smooths out harsh or clipped phonetic spellings, ensures natural elongation of vowels,
 * and standardizes punctuation to give the synthesizer natural breathing pauses.
 */
export function normalizeForPhoneticTTS(
  text: string,
  lang: SupportedLanguage = 'ur'
): string {
  if (!text || typeof text !== 'string') return '';
  if (lang !== 'ur' && lang !== 'hi') return text.trim();

  let s = text.trim();

  // 1. Phonetic vowel & imperative verb adjustments for smoother natural delivery
  // Replace abrupt "uth jao" with elongated smooth "uth jaao"
  s = s.replace(/\buth\s+jao\b/gi, 'uth jaao');
  s = s.replace(/\butho\b/gi, 'uttho');
  s = s.replace(/\bshab\s+bakhair\b/gi, 'shab ba-khair');
  s = s.replace(/\baaraam\b/gi, 'aaram');
  s = s.replace(/\bdawai\b/gi, 'dawaai');
  s = s.replace(/\bkar lo\b/gi, 'kar lo');
  s = s.replace(/\bpi lo\b/gi, 'pee lo');
  s = s.replace(/\bpani\b/gi, 'paani');
  s = s.replace(/\bsone\s+ka\b/gi, 'soney ka');

  // 2. Ensure natural pauses around punctuation so the synthesizer breathes naturally
  s = s.replace(/,\s*/g, ', ');
  s = s.replace(/\.\s*/g, '. ');
  s = s.replace(/!\s*/g, '! ');

  // 3. Ensure a natural pause after the person's name if comma was omitted
  s = s.replace(/^([A-Za-z]+)\s+(uthne|ab|sone|aapka|aapki)\b/i, (_m, g1, g2) => `${g1}, ${g2}`);

  return s.trim();
}

export interface SpeakOptions {
  language?: SupportedLanguage;
  voiceGender?: VoiceGender;
  voiceTone?: VoiceTone;
  pitch?: number;
  rate?: number;
  onStart?: () => void;
  onDone?: () => void;
}

// Keywords to accurately distinguish female vs male voices across Apple, Google, Microsoft, and Android TTS
const FEMALE_KEYWORDS = [
  'female',
  'woman',
  'zira',
  'samantha',
  'karen',
  'victoria',
  'moira',
  'fiona',
  'veena',
  'ananya',
  'priya',
  'sangeeta',
  'kavita',
  'noor',
  'fatima',
  'ayesha',
  'zoya',
  'sara',
  'eva',
  'olivia',
  'emma',
  'hazel',
  'heera',
  'kalpana',
  'geeta',
  'f00',
  'f01',
  'f02',
  'female-compact',
  '#female',
];

const MALE_KEYWORDS = [
  'male',
  'man',
  'david',
  'alex',
  'george',
  'daniel',
  'fred',
  'ravi',
  'neel',
  'amit',
  'raj',
  'tariq',
  'bilal',
  'ali',
  'ahmed',
  'hamza',
  'omar',
  'usman',
  'hassan',
  'm00',
  'm01',
  'm02',
  'mark',
  'guy',
  'male-compact',
  '#male',
];

interface DiscoveredVoice {
  identifier: string;
  name: string;
  language: string;
  rawVoice?: any;
}

class SpeechServiceImpl {
  public isSpeaking = false;
  private cachedVoices: DiscoveredVoice[] = [];
  private voicesLoaded = false;
  private webHeartbeatTimer: any = null;

  constructor() {
    this.initVoiceDiscovery();
  }

  /**
   * Initializes native and web voice discovery
   */
  public async initVoiceDiscovery(): Promise<void> {
    if (this.voicesLoaded) return;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const updateWebVoices = () => {
          const raw = window.speechSynthesis.getVoices();
          if (raw && raw.length > 0) {
            this.cachedVoices = raw.map((v) => ({
              identifier: v.voiceURI || v.name,
              name: v.name,
              language: v.lang,
              rawVoice: v,
            }));
            this.voicesLoaded = true;
          }
        };

        updateWebVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = updateWebVoices;
        }
      }
      return;
    }

    try {
      const nativeVoices = await Speech.getAvailableVoicesAsync();
      if (nativeVoices && nativeVoices.length > 0) {
        this.cachedVoices = nativeVoices.map((v) => ({
          identifier: v.identifier,
          name: v.name,
          language: v.language,
        }));
        this.voicesLoaded = true;
      }
    } catch (err) {
      console.warn('[SpeechService] Could not query native voices:', err);
    }
  }

  /**
   * Finds the best matching voice on the device for the given gender and language.
   */
  public async findBestVoice(
    gender: VoiceGender,
    lang: SupportedLanguage
  ): Promise<DiscoveredVoice | null> {
    await this.initVoiceDiscovery();

    if (this.cachedVoices.length === 0) {
      return null;
    }

    const targetLangCode = this.resolveLanguageCode(lang).toLowerCase(); // e.g. "ur-pk", "hi-in", "en-us"
    const targetLangPrefix = targetLangCode.split('-')[0]; // "ur", "hi", "en"

    const isMatchGender = (name: string, targetGender: VoiceGender): boolean => {
      const lower = name.toLowerCase();
      if (targetGender === 'female') {
        const hasFemale = FEMALE_KEYWORDS.some((kw) => lower.includes(kw));
        const hasMale = MALE_KEYWORDS.some((kw) => lower.includes(kw));
        return hasFemale && !hasMale;
      } else {
        const hasMale = MALE_KEYWORDS.some((kw) => lower.includes(kw));
        const hasFemale = FEMALE_KEYWORDS.some((kw) => lower.includes(kw));
        return hasMale && !hasFemale;
      }
    };

    // Candidate scoring
    let bestCandidate: DiscoveredVoice | null = null;
    let highestScore = -100;

    for (const voice of this.cachedVoices) {
      const voiceLang = (voice.language || '').toLowerCase();
      const voiceName = (voice.name || '').toLowerCase();
      let score = 0;

      // 1. Language matching
      if (targetLangPrefix === 'ur') {
        if (voiceLang.startsWith('ur')) {
          score += 60; // Top tier: exact native Urdu voice
        } else if (voiceLang.startsWith('hi')) {
          // Native Hindi voices deliver the most natural, authentic pronunciation for Roman Urdu
          score += 50;
        } else if (voiceLang.startsWith('en-in') || voiceLang.startsWith('en_in')) {
          score += 25; // Indian English understands Hindi/Urdu phonetics
        } else if (voiceLang.startsWith('en')) {
          score += 5;
        }
      } else if (targetLangPrefix === 'hi') {
        if (voiceLang.startsWith('hi')) {
          score += 60;
        } else if (voiceLang.startsWith('ur')) {
          score += 50;
        } else if (voiceLang.startsWith('en-in') || voiceLang.startsWith('en_in')) {
          score += 25;
        } else if (voiceLang.startsWith('en')) {
          score += 5;
        }
      } else {
        if (voiceLang === targetLangCode) {
          score += 50;
        } else if (voiceLang.startsWith(targetLangPrefix)) {
          score += 30;
        } else {
          score += 5;
        }
      }

      // 2. Gender matching
      if (isMatchGender(voiceName, gender)) {
        score += 35;
      } else if (isMatchGender(voice.identifier, gender)) {
        score += 30;
      }

      if (score > highestScore) {
        highestScore = score;
        bestCandidate = voice;
      }
    }

    return bestCandidate;
  }

  /**
   * Speak arbitrary text offline using native device TTS (expo-speech) or Web SpeechSynthesis.
   * Softness & Pitch Tuning: rate 0.88, pitch 1.05 (female) / 0.95 (male),
   * falling back to native Urdu (ur-PK) or Hindi (hi-IN) voice locales.
   */
  public async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!text || text.trim().length === 0) return;

    const lang = options.language || 'ur';
    const langCode = this.resolveLanguageCode(lang);
    const gender = options.voiceGender || 'female';
    const tone = options.voiceTone || 'warm';
    const preset =
      VOICE_PROFILES[gender]?.[tone] ||
      VOICE_PROFILES[gender]?.warm ||
      VOICE_PROFILES.female.warm;

    // Softness & Pitch tuning: default rate 0.88, pitch 1.05 (female) / 0.95 (male)
    const defaultPitch = gender === 'female' ? 1.05 : 0.95;
    const defaultRate = 0.88;

    const pitch = options.pitch ?? preset?.pitch ?? defaultPitch;
    const rate = options.rate ?? preset?.rate ?? defaultRate;

    // Normalize Roman Urdu / Hindi text for soft, natural phonetic delivery
    const spokenText = normalizeForPhoneticTTS(text, lang);

    this.isSpeaking = true;
    options.onStart?.();

    // Query best available platform voice
    const matchedVoice = await this.findBestVoice(gender, lang);

    // Fall back to native Urdu (ur-PK) or Hindi (hi-IN) voice locales
    const effectiveLanguage =
      matchedVoice?.language ||
      (lang === 'ur' ? 'hi-IN' : langCode);

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = effectiveLanguage;
        utterance.pitch = pitch;
        utterance.rate = rate;

        if (matchedVoice?.rawVoice) {
          utterance.voice = matchedVoice.rawVoice;
        }

        // Keep-alive heartbeat for web speech synthesis
        this.startWebKeepAlive();

        let finished = false;
        const cleanup = () => {
          if (finished) return;
          finished = true;
          this.isSpeaking = false;
          this.stopWebKeepAlive();
          options.onDone?.();
        };

        utterance.onend = cleanup;
        utterance.onerror = cleanup;

        window.speechSynthesis.speak(utterance);
      } else {
        this.isSpeaking = false;
        options.onDone?.();
      }
      return;
    }

    // Native Mobile (iOS & Android)
    try {
      await Speech.stop();

      const speakParams: Speech.SpeechOptions = {
        language: effectiveLanguage,
        pitch,
        rate,
        onDone: () => {
          this.isSpeaking = false;
          options.onDone?.();
        },
        onStopped: () => {
          this.isSpeaking = false;
          options.onDone?.();
        },
        onError: () => {
          this.isSpeaking = false;
          options.onDone?.();
        },
      };

      if (matchedVoice?.identifier) {
        speakParams.voice = matchedVoice.identifier;
      }

      Speech.speak(spokenText, speakParams);
    } catch (e) {
      console.warn('[SpeechService] Native synthesis error:', e);
      this.isSpeaking = false;
      options.onDone?.();
    }
  }

  /**
   * Stop any current speech playback immediately
   */
  public async stop(): Promise<void> {
    this.isSpeaking = false;
    this.stopWebKeepAlive();

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    try {
      await Speech.stop();
    } catch {}
  }

  /**
   * Web speech synthesis heartbeat to prevent browser garbage collection or pause
   */
  private startWebKeepAlive(): void {
    this.stopWebKeepAlive();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.webHeartbeatTimer = setInterval(() => {
      if (this.isSpeaking && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
      } else {
        this.stopWebKeepAlive();
      }
    }, 3000);
  }

  private stopWebKeepAlive(): void {
    if (this.webHeartbeatTimer) {
      clearInterval(this.webHeartbeatTimer);
      this.webHeartbeatTimer = null;
    }
  }

  /**
   * Generates a warm, culturally natural, respectful voice announcement
   * dynamically personalized with the user's configured name.
   */
  public generateVoicePrompt(
    userName: string,
    context: 'wake' | 'bedtime' | 'medicine' | 'lunch' | 'water' | 'workout' | 'generic',
    customTitle?: string
  ): string {
    const name = userName?.trim() || 'Aasif';

    switch (context) {
      case 'wake':
        return `${name}, uthne ka waqt ho gaya hai, uth jaao!`;

      case 'medicine':
        return `${name}, aapki dawaai lene ka waqt ho gaya hai, dawaai le lein.`;

      case 'lunch':
        return `${name}, lunch karne ka waqt ho gaya hai, lunch kar lein.`;

      case 'water':
        return `${name}, paani pi lijiye, hydrate hone ka waqt hai.`;

      case 'workout':
        return `${name}, focus kijiye aur workout session shuru kijiye!`;

      case 'bedtime':
        return `${name}, sone aur aaraam karne ka waqt ho gaya hai, shab bakhair.`;

      default:
        if (customTitle) {
          return `${name}, aapka waqt ho gaya hai: ${customTitle}.`;
        }
        return `${name}, aapka DayPilot routine time active hai.`;
    }
  }

  public resolveLanguageCode(lang: SupportedLanguage): string {
    switch (lang) {
      case 'ur':
        return 'ur-PK';
      case 'hi':
        return 'hi-IN';
      case 'en':
      default:
        return 'en-US';
    }
  }
}

export const SpeechService = new SpeechServiceImpl();
