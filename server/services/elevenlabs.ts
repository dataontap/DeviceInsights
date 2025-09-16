// Import ElevenLabs Client for API usage
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || ""
});

export interface VoiceConfig {
  voiceId: string;
  name: string;
  language: string;
  gender: string;
  accent: string;
  personality: string;
}

export interface ConversationMessage {
  text: string;
  voiceConfig: VoiceConfig;
  timestamp: number;
  isHarmonizing?: boolean;
  isSinging?: boolean;
}

// 30 supported languages with their codes
export const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', flag: '🇺🇸' },
  'es': { name: 'Spanish', flag: '🇪🇸' },
  'fr': { name: 'French', flag: '🇫🇷' },
  'de': { name: 'German', flag: '🇩🇪' },
  'it': { name: 'Italian', flag: '🇮🇹' },
  'pt': { name: 'Portuguese', flag: '🇵🇹' },
  'nl': { name: 'Dutch', flag: '🇳🇱' },
  'ru': { name: 'Russian', flag: '🇷🇺' },
  'pl': { name: 'Polish', flag: '🇵🇱' },
  'tr': { name: 'Turkish', flag: '🇹🇷' },
  'zh': { name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  'ja': { name: 'Japanese', flag: '🇯🇵' },
  'ko': { name: 'Korean', flag: '🇰🇷' },
  'hi': { name: 'Hindi', flag: '🇮🇳' },
  'th': { name: 'Thai', flag: '🇹🇭' },
  'vi': { name: 'Vietnamese', flag: '🇻🇳' },
  'id': { name: 'Indonesian', flag: '🇮🇩' },
  'ar': { name: 'Arabic', flag: '🇸🇦' },
  'sv': { name: 'Swedish', flag: '🇸🇪' },
  'no': { name: 'Norwegian', flag: '🇳🇴' },
  'da': { name: 'Danish', flag: '🇩🇰' },
  'fi': { name: 'Finnish', flag: '🇫🇮' },
  'he': { name: 'Hebrew', flag: '🇮🇱' },
  'el': { name: 'Greek', flag: '🇬🇷' },
  'cs': { name: 'Czech', flag: '🇨🇿' },
  'hu': { name: 'Hungarian', flag: '🇭🇺' },
  'ro': { name: 'Romanian', flag: '🇷🇴' },
  'bg': { name: 'Bulgarian', flag: '🇧🇬' },
  'hr': { name: 'Croatian', flag: '🇭🇷' },
  'sk': { name: 'Slovak', flag: '🇸🇰' }
};

// Default voice configurations for multi-voice system
export const DEFAULT_VOICE_AGENTS: VoiceConfig[] = [
  {
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel - Professional
    name: "Professional Assistant",
    language: "en",
    gender: "female",
    accent: "american",
    personality: "professional"
  },
  {
    voiceId: "AZnzlk1XvdvUeBnXmlld", // Domi - Friendly
    name: "Friendly Tech Support", 
    language: "en",
    gender: "female",
    accent: "american",
    personality: "friendly"
  },
  {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella - Expert
    name: "Expert Analyst",
    language: "en", 
    gender: "female",
    accent: "british",
    personality: "expert"
  },
  {
    voiceId: "ErXwobaYiN019PkySvjV", // Antoni - Patient
    name: "Patient Teacher",
    language: "en",
    gender: "male", 
    accent: "american",
    personality: "patient"
  },
  {
    voiceId: "VR6AewLTigWG4xSOukaG", // Josh - Enthusiastic (Canadian-style for rock mode)
    name: "Enthusiastic Helper",
    language: "en",
    gender: "male",
    accent: "canadian", 
    personality: "enthusiastic"
  }
];

/**
 * Generate voice audio using ElevenLabs API
 */
export async function generateVoiceAudio(
  text: string, 
  voiceConfig: VoiceConfig,
  options: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  } = {}
): Promise<ArrayBuffer> {
  try {
    const audioResponse = await elevenlabs.textToSpeech.convert(voiceConfig.voiceId, {
      text,
      modelId: "eleven_multilingual_v2", // Supports 30+ languages
      voiceSettings: {
        stability: options.stability ?? 0.75,
        similarityBoost: options.similarity_boost ?? 0.75,
        style: options.style ?? 0.5,
        useSpeakerBoost: options.use_speaker_boost ?? true
      }
    });

    return audioResponse as ArrayBuffer;
  } catch (error) {
    console.error("ElevenLabs API error:", error);
    throw new Error("Failed to generate voice audio");
  }
}

/**
 * Generate location-based conversation starter
 */
export function generateLocationBasedGreeting(
  location: { city?: string; country?: string; lat?: number; lng?: number },
  language: string = 'en'
): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let locationText = '';
  if (location.city && location.country) {
    locationText = `in ${location.city}, ${location.country}`;
  } else if (location.country) {
    locationText = `in ${location.country}`;
  } else if (location.lat && location.lng) {
    locationText = `at coordinates ${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`;
  }

  // Base greeting in English - can be translated for other languages
  const greetings = {
    'en': `Hello! It's ${currentTime} on ${currentDate} ${locationText}. I'm here to help you discover your IMEI number using USSD codes. Would you like me to guide you through the process?`,
    'es': `¡Hola! Son las ${currentTime} del ${currentDate} ${locationText}. Estoy aquí para ayudarte a descubrir tu número IMEI usando códigos USSD. ¿Te gustaría que te guíe en el proceso?`,
    'fr': `Bonjour! Il est ${currentTime} le ${currentDate} ${locationText}. Je suis ici pour vous aider à découvrir votre numéro IMEI en utilisant les codes USSD. Souhaitez-vous que je vous guide ?`,
    // Add more languages as needed
  };

  return greetings[language as keyof typeof greetings] || greetings['en'];
}

/**
 * Create multi-voice conversation with harmonizing and singing modes
 */
export function createMultiVoiceConversation(
  baseText: string,
  voiceCount: number,
  location?: { city?: string; country?: string; lat?: number; lng?: number }
): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  const selectedVoices = DEFAULT_VOICE_AGENTS.slice(0, voiceCount);

  if (voiceCount === 1) {
    // Single voice - standard guidance
    messages.push({
      text: location ? generateLocationBasedGreeting(location) : baseText,
      voiceConfig: selectedVoices[0],
      timestamp: Date.now()
    });
  } else if (voiceCount === 2) {
    // Dual voice - question and answer
    messages.push({
      text: location ? generateLocationBasedGreeting(location) : "How can I find my IMEI number?",
      voiceConfig: selectedVoices[0],
      timestamp: Date.now()
    });
    messages.push({
      text: "Great question! You can find your IMEI by dialing *#06# on your phone. This universal code works on all mobile devices.",
      voiceConfig: selectedVoices[1], 
      timestamp: Date.now() + 1000
    });
  } else if (voiceCount === 3) {
    // Panel discussion format
    messages.push({
      text: location ? generateLocationBasedGreeting(location) : "Let's discuss the different ways to find your IMEI.",
      voiceConfig: selectedVoices[0],
      timestamp: Date.now()
    });
    messages.push({
      text: "The quickest method is dialing *#06# - it's built into every phone's firmware.",
      voiceConfig: selectedVoices[1],
      timestamp: Date.now() + 1000
    });
    messages.push({
      text: "You can also find it in your phone's settings under 'About Phone' or 'General Information'.",
      voiceConfig: selectedVoices[2],
      timestamp: Date.now() + 2000
    });
  } else if (voiceCount === 4) {
    // Harmonizing mode
    messages.push({
      text: location ? generateLocationBasedGreeting(location) : "Welcome to our harmonized IMEI discovery experience!",
      voiceConfig: selectedVoices[0],
      timestamp: Date.now(),
      isHarmonizing: true
    });
    // Add harmonic variations
    messages.push({
      text: "Dial *#06# on your device", // Main melody
      voiceConfig: selectedVoices[0],
      timestamp: Date.now() + 2000,
      isHarmonizing: true
    });
    messages.push({
      text: "This magical code reveals", // Perfect fifth harmony
      voiceConfig: selectedVoices[1],
      timestamp: Date.now() + 2000,
      isHarmonizing: true
    });
    messages.push({
      text: "Your unique identifier", // Major third harmony
      voiceConfig: selectedVoices[2],
      timestamp: Date.now() + 2000,
      isHarmonizing: true
    });
    messages.push({
      text: "The IMEI number", // Octave doubling
      voiceConfig: selectedVoices[3],
      timestamp: Date.now() + 2000,
      isHarmonizing: true
    });
  } else if (voiceCount === 5) {
    // Canadian rock singing mode
    messages.push({
      text: location ? generateLocationBasedGreeting(location) : "🎸 Welcome to the IMEI Rock Experience! 🎸",
      voiceConfig: selectedVoices[4], // Josh - Canadian accent lead
      timestamp: Date.now(),
      isSinging: true
    });
    
    // Rock choir arrangement for IMEI discovery
    messages.push({
      text: "🎵 Dial star-hash-zero-six-hash, that's the way to find your code! 🎵", // Raspy lead vocal
      voiceConfig: selectedVoices[4],
      timestamp: Date.now() + 3000,
      isSinging: true
    });
    messages.push({
      text: "🎵 Find that number, find it now! 🎵", // Melodic Christmas ballad harmony
      voiceConfig: selectedVoices[0],
      timestamp: Date.now() + 3000,
      isSinging: true
    });
    messages.push({
      text: "🎵 Your device's identity! 🎵", // Second harmony
      voiceConfig: selectedVoices[1], 
      timestamp: Date.now() + 3000,
      isSinging: true
    });
    messages.push({
      text: "🎵 IMEI revelation! 🎵", // Bass foundation
      voiceConfig: selectedVoices[2],
      timestamp: Date.now() + 3000,
      isSinging: true
    });
    messages.push({
      text: "🎵 Technology's Christmas miracle! 🎵", // High soaring harmony
      voiceConfig: selectedVoices[3],
      timestamp: Date.now() + 3000,
      isSinging: true
    });
  }

  return messages;
}

/**
 * Get USSD code instructions in specified language
 */
export function getUSSDInstructions(language: string = 'en'): string {
  const instructions = {
    'en': "To find your IMEI number, simply dial *#06# on your phone's keypad. This universal code works on all mobile devices - smartphones, basic phones, and tablets with cellular capability. Your 15-digit IMEI number will appear on screen immediately. Write it down or take a screenshot for your records.",
    'es': "Para encontrar tu número IMEI, simplemente marca *#06# en el teclado de tu teléfono. Este código universal funciona en todos los dispositivos móviles. Tu número IMEI de 15 dígitos aparecerá en pantalla inmediatamente.",
    'fr': "Pour trouver votre numéro IMEI, composez simplement *#06# sur le clavier de votre téléphone. Ce code universel fonctionne sur tous les appareils mobiles. Votre numéro IMEI à 15 chiffres apparaîtra immédiatement à l'écran.",
    // Add more languages as needed
  };

  return instructions[language as keyof typeof instructions] || instructions['en'];
}

/**
 * Get available voices for a specific language
 */
export async function getVoicesForLanguage(language: string): Promise<VoiceConfig[]> {
  try {
    const voices = await elevenlabs.voices.getAll();
    
    // Filter voices that support the specified language
    const filteredVoices: VoiceConfig[] = voices.voices
      .filter((voice: any) => {
        // ElevenLabs voices are generally multilingual with the v2 model
        return voice.voice_id && voice.name;
      })
      .slice(0, 10) // Limit to first 10 voices
      .map((voice: any) => ({
        voiceId: voice.voice_id!,
        name: voice.name!,
        language: language,
        gender: voice.labels?.gender || 'unknown',
        accent: voice.labels?.accent || 'neutral',
        personality: voice.labels?.description || 'neutral'
      }));

    return filteredVoices.length > 0 ? filteredVoices : DEFAULT_VOICE_AGENTS;
  } catch (error) {
    console.error("Error fetching voices:", error);
    // Return default agents if API fails
    return DEFAULT_VOICE_AGENTS;
  }
}