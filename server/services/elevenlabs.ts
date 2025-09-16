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
    console.log("Generating voice audio for:", text.substring(0, 50) + "...");
    
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

    console.log("Audio response type:", typeof audioResponse);
    console.log("Audio response constructor:", audioResponse.constructor?.name || 'unknown');

    // Check if it's a ReadableStream
    if (audioResponse instanceof ReadableStream) {
      console.log("Converting ReadableStream to ArrayBuffer");
      
      const reader = audioResponse.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      console.log("Converted to ArrayBuffer, size:", result.buffer.byteLength);
      return result.buffer;
    }

    // If it's already an ArrayBuffer or different type, handle accordingly
    if (audioResponse && typeof audioResponse === 'object' && 'byteLength' in audioResponse) {
      console.log("Already an ArrayBuffer, size:", (audioResponse as ArrayBuffer).byteLength);
      return audioResponse as ArrayBuffer;
    }

    // Try to convert other types
    console.log("Attempting to convert unknown type to ArrayBuffer");
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

  // Base greeting in multiple languages  
  const greetings = {
    'en': `Hello! It's ${currentTime} on ${currentDate} ${locationText}. I'm here to help you discover your IMEI number using USSD codes. Would you like me to guide you through the process?`,
    'es': `¡Hola! Son las ${currentTime} del ${currentDate} ${locationText}. Estoy aquí para ayudarte a descubrir tu número IMEI usando códigos USSD. ¿Te gustaría que te guíe en el proceso?`,
    'fr': `Bonjour! Il est ${currentTime} le ${currentDate} ${locationText}. Je suis ici pour vous aider à découvrir votre numéro IMEI en utilisant les codes USSD. Souhaitez-vous que je vous guide ?`,
    'pt': `Olá! São ${currentTime} de ${currentDate} ${locationText}. Estou aqui para ajudá-lo a descobrir o seu número IMEI usando códigos USSD. Gostaria que eu o orientasse no processo?`,
    'de': `Hallo! Es ist ${currentTime} am ${currentDate} ${locationText}. Ich bin hier, um Ihnen zu helfen, Ihre IMEI-Nummer mit USSD-Codes zu entdecken. Möchten Sie, dass ich Sie durch den Prozess führe?`,
    'it': `Ciao! Sono le ${currentTime} del ${currentDate} ${locationText}. Sono qui per aiutarti a scoprire il tuo numero IMEI usando i codici USSD. Vorresti che ti guidassi nel processo?`,
    'ru': `Привет! Сейчас ${currentTime} ${currentDate} ${locationText}. Я здесь, чтобы помочь вам найти ваш номер IMEI с помощью USSD-кодов. Хотите, чтобы я провел вас через этот процесс?`,
    'zh': `你好！现在是${currentDate} ${currentTime} ${locationText}。我在这里帮助您使用USSD代码找到您的IMEI号码。您想让我指导您完成这个过程吗？`,
    'ja': `こんにちは！${currentDate} ${currentTime} ${locationText}です。USSD コードを使用して IMEI 番号を見つけるお手伝いをします。プロセスをご案内いたしましょうか？`,
    'ar': `مرحبا! إنها ${currentTime} في ${currentDate} ${locationText}. أنا هنا لمساعدتك في اكتشاف رقم IMEI الخاص بك باستخدام رموز USSD. هل تريد مني أن أرشدك خلال العملية؟`,
    'nl': `Hallo! Het is ${currentTime} op ${currentDate} ${locationText}. Ik ben hier om je te helpen je IMEI-nummer te ontdekken met behulp van USSD-codes. Wil je dat ik je door het proces leid?`,
    'pl': `Cześć! Jest ${currentTime} w dniu ${currentDate} ${locationText}. Jestem tutaj, aby pomóc Ci odkryć Twój numer IMEI za pomocą kodów USSD. Czy chciałbyś, żebym przeprowadził Cię przez ten proces?`,
    'tr': `Merhaba! Şu anda ${currentTime}, ${currentDate} ${locationText}. USSD kodları kullanarak IMEI numaranızı keşfetmenize yardımcı olmak için buradayım. Süreç boyunca size rehberlik etmemi ister misiniz?`,
    'ko': `안녕하세요! 지금은 ${currentDate} ${currentTime} ${locationText}입니다. USSD 코드를 사용하여 IMEI 번호를 찾을 수 있도록 도와드리겠습니다. 과정을 안내해 드릴까요?`,
    'hi': `नमस्ते! अभी ${currentDate} को ${currentTime} बजे हैं ${locationText}। मैं यहाँ USSD कोड का उपयोग करके आपका IMEI नंबर खोजने में आपकी मदद करने के लिए हूँ। क्या आप चाहेंगे कि मैं आपको इस प्रक्रिया के माध्यम से मार्गदर्शन करूँ?`,
    'th': `สวัสดี! ตอนนี้เป็นเวลา ${currentTime} ของวันที่ ${currentDate} ${locationText} ฉันอยู่ที่นี่เพื่อช่วยคุณค้นหาหมายเลข IMEI โดยใช้รหัส USSD คุณต้องการให้ฉันแนะนำคุณผ่านกระบวนการนี้หรือไม่?`,
    'vi': `Xin chào! Bây giờ là ${currentTime} ngày ${currentDate} ${locationText}. Tôi ở đây để giúp bạn khám phá số IMEI của mình bằng cách sử dụng mã USSD. Bạn có muốn tôi hướng dẫn bạn qua quy trình này không?`,
    'id': `Halo! Sekarang pukul ${currentTime} pada ${currentDate} ${locationText}. Saya di sini untuk membantu Anda menemukan nomor IMEI menggunakan kode USSD. Apakah Anda ingin saya memandu Anda melalui prosesnya?`,
    'sv': `Hej! Det är ${currentTime} den ${currentDate} ${locationText}. Jag är här för att hjälpa dig upptäcka ditt IMEI-nummer med hjälp av USSD-koder. Vill du att jag ska guida dig genom processen?`,
    'no': `Hei! Det er ${currentTime} den ${currentDate} ${locationText}. Jeg er her for å hjelpe deg med å oppdage IMEI-nummeret ditt ved hjelp av USSD-koder. Vil du at jeg skal veilede deg gjennom prosessen?`,
    'da': `Hej! Det er ${currentTime} den ${currentDate} ${locationText}. Jeg er her for at hjælpe dig med at opdage dit IMEI-nummer ved hjælp af USSD-koder. Vil du have, at jeg guider dig gennem processen?`,
    'fi': `Hei! Kello on ${currentTime} ${currentDate} ${locationText}. Olen täällä auttamassa sinua löytämään IMEI-numerosi USSD-koodien avulla. Haluaisitko, että opastaisin sinut prosessin läpi?`,
    'he': `שלום! השעה היא ${currentTime} ב-${currentDate} ${locationText}. אני כאן כדי לעזור לך לגלות את מספר ה-IMEI שלך באמצעות קודי USSD. האם תרצה שאדריך אותך בתהליך?`,
    'el': `Γεια σας! Είναι ${currentTime} στις ${currentDate} ${locationText}. Είμαι εδώ για να σας βοηθήσω να ανακαλύψετε τον αριθμό IMEI σας χρησιμοποιώντας κωδικούς USSD. Θα θέλατε να σας καθοδηγήσω στη διαδικασία;`,
    'cs': `Ahoj! Je ${currentTime} dne ${currentDate} ${locationText}. Jsem tady, abych vám pomohl objevit vaše IMEI číslo pomocí USSD kódů. Chtěli byste, abych vás provedl procesem?`,
    'hu': `Szia! Most ${currentTime} van ${currentDate}-án ${locationText}. Itt vagyok, hogy segítsek felfedezni az IMEI számodat USSD kódok használatával. Szeretnéd, hogy végigvezesselek a folyamaton?`,
    'ro': `Salut! Sunt ${currentTime} pe ${currentDate} ${locationText}. Sunt aici să te ajut să îți descoperi numărul IMEI folosind coduri USSD. Ai dori să te ghidez prin proces?`,
    'bg': `Здравей! Сега е ${currentTime} на ${currentDate} ${locationText}. Тук съм, за да ви помогна да откриете вашия IMEI номер, използвайки USSD кодове. Бихте ли искали да ви направя през процеса?`,
    'hr': `Bok! Sada je ${currentTime} na ${currentDate} ${locationText}. Tu sam da vam pomognem otkriti vaš IMEI broj koristeći USSD kodove. Želite li da vas vodim kroz proces?`,
    'sk': `Ahoj! Je ${currentTime} dňa ${currentDate} ${locationText}. Som tu, aby som vám pomohol objaviť vaše IMEI číslo pomocou USSD kódov. Chceli by ste, aby som vás previedol procesom?`
  };

  return greetings[language as keyof typeof greetings] || greetings['en'];
}

/**
 * Create multi-voice conversation with harmonizing and singing modes
 */
export function createMultiVoiceConversation(
  baseText: string,
  voiceCount: number,
  location?: { city?: string; country?: string; lat?: number; lng?: number },
  isUSSDHelp: boolean = false,
  language: string = 'en',
  languageVoices?: VoiceConfig[]
): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  // Use language-specific voices if provided, otherwise fall back to default
  const availableVoices = languageVoices || DEFAULT_VOICE_AGENTS;
  const selectedVoices = availableVoices.slice(0, voiceCount);

  if (voiceCount === 1) {
    // Single voice - standard guidance
    messages.push({
      text: location ? generateLocationBasedGreeting(location, language) : baseText,
      voiceConfig: selectedVoices[0],
      timestamp: Date.now()
    });
  } else if (voiceCount === 2) {
    // Dual voice - question and answer
    messages.push({
      text: location ? generateLocationBasedGreeting(location, language) : "How can I find my IMEI number?",
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
      text: location ? generateLocationBasedGreeting(location, language) : "Let's discuss the different ways to find your IMEI.",
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
    // Harmonizing mode - actual 4-voice harmonized IMEI discovery
    if (isUSSDHelp) {
      const locationGreeting = location ? `Hello from ${location.city || 'your location'}! ` : "Hello! ";
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
      });
      
      // Voice 1 - Lead harmony with intro
      messages.push({
        text: `${locationGreeting}Today is ${currentDate}. Let us harmonize to help you discover your IMEI! 🎵 Welcome to our four-voice harmony experience! 🎵`,
        voiceConfig: selectedVoices[0], // Lead harmony
        timestamp: Date.now(),
        isHarmonizing: true
      });
      
      // Voice 2 - Alto harmony with USSD explanation
      messages.push({
        text: `🎵 Star-hash-zero-six-hash, the magical IMEI code! This universal sequence works on every phone, from basic to smart, you're never alone! 🎵`,
        voiceConfig: selectedVoices[1], // Alto harmony
        timestamp: Date.now() + 1000,
        isHarmonizing: true
      });
      
      // Voice 3 - Tenor harmony with device compatibility
      messages.push({
        text: `🎵 Together we sing, your device's unique song, fifteen digits strong, helping you along! Android or iPhone, it doesn't matter at all! 🎵`,
        voiceConfig: selectedVoices[2], // Tenor harmony
        timestamp: Date.now() + 2000,
        isHarmonizing: true
      });
      
      // Voice 4 - Bass harmony with final instructions
      messages.push({
        text: `🎵 This universal key works on every phone! Write it down safe, screenshot it too, your IMEI number will always help you! Let's harmonize together! 🎵`,
        voiceConfig: selectedVoices[3], // Bass harmony
        timestamp: Date.now() + 3000,
        isHarmonizing: true
      });
      
    } else {
      // Original harmonizing for non-USSD help
      messages.push({
        text: location ? generateLocationBasedGreeting(location) : "Welcome to our harmonized IMEI discovery experience!",
        voiceConfig: selectedVoices[0],
        timestamp: Date.now(),
        isHarmonizing: true
      });
      
      // Add harmonizing voices for non-USSD help
      messages.push({
        text: "🎵 Together we'll guide you through the process of finding your device's unique identifier! 🎵",
        voiceConfig: selectedVoices[1],
        timestamp: Date.now() + 1000,
        isHarmonizing: true
      });
      
      messages.push({
        text: "🎵 Multiple methods await you - USSD codes and settings menus, all harmonizing to help! 🎵",
        voiceConfig: selectedVoices[2],
        timestamp: Date.now() + 2000,
        isHarmonizing: true
      });
      
      messages.push({
        text: "🎵 Your IMEI journey begins now, with our voices guiding you every step of the way! 🎵",
        voiceConfig: selectedVoices[3],
        timestamp: Date.now() + 3000,
        isHarmonizing: true
      });
    }
  } else if (voiceCount === 5) {
    // Christmas song style - each voice sings about their first phone
    if (isUSSDHelp) {
      const locationGreeting = location ? `Greetings from ${location.city || 'your location'}! ` : "Hello friends! ";
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
      });
      
      // Voice 1 - Lead singer about first flip phone
      messages.push({
        text: `🎄 ${locationGreeting}It's ${currentDate}, and we're singing about phones! My first device was a silver flip phone, small and sleek, with buttons that clicked, the IMEI was hidden but star-hash-zero-six made it quick! 🎄`,
        voiceConfig: selectedVoices[0],
        timestamp: Date.now(),
        isSinging: true
      });
      
      // Voice 2 - About first smartphone  
      messages.push({
        text: `🎄 My first smartphone, oh what a sight! Touch screen glowing in the morning light! Android or iPhone, it didn't matter, star-hash-zero-six made the digits scatter! IMEI numbers, fifteen long, helping us sing this mobile phone song! 🎄`,
        voiceConfig: selectedVoices[1],
        timestamp: Date.now() + 1000,
        isSinging: true
      });
      
      // Voice 3 - About old Nokia brick phone
      messages.push({
        text: `🎄 Back when Nokia ruled the day, brick phones thick but built to stay! Snake game playing, battery lasting, star-hash-zero-six, no time for wasting! Those IMEI codes, so reliable and true, helping connect me and helping you! 🎄`,
        voiceConfig: selectedVoices[2],
        timestamp: Date.now() + 2000,
        isSinging: true
      });
      
      // Voice 4 - About first camera phone
      messages.push({
        text: `🎄 First camera phone, pixels so low, but memories captured, oh how we'd glow! Blurry pictures but hearts so bright, star-hash-zero-six in morning light! IMEI magic, network connection, bringing us joy and phone protection! 🎄`,
        voiceConfig: selectedVoices[3],
        timestamp: Date.now() + 3000,
        isSinging: true
      });
      
      // Voice 5 - Canadian rock lead with Christmas spirit
      messages.push({
        text: `🎸🎄 From the great white north, let me tell ya 'bout phones, eh! My first device had me singing like the holiday bells that ring! Star-hash-zero-six, that's the magic code, whether you're in Toronto or down the road! IMEI numbers, fifteen digits strong, like a Christmas carol, a beautiful song! Dial it now, don't hesitate, your phone's identity, let's celebrate! 🎄🎸`,
        voiceConfig: selectedVoices[4], // Canadian rock singer
        timestamp: Date.now() + 4000,
        isSinging: true
      });
      
      // Chorus - All voices together
      messages.push({
        text: `🎄🎵 All together now! Star-hash-zero-six-hash, the IMEI way! Every phone, every day! From flip to smart, from old to new, this magic code will see you through! Merry mobile Christmas, hip hip hooray! 🎵🎄`,
        voiceConfig: selectedVoices[0], // Lead for chorus
        timestamp: Date.now() + 5000,
        isSinging: true
      });
    } else {
      // Original rock arrangement for non-USSD help
      messages.push({
        text: location ? generateLocationBasedGreeting(location) : "🎸 Welcome to the IMEI Rock Experience! 🎸",
        voiceConfig: selectedVoices[4],
        timestamp: Date.now(),
        isSinging: true
      });
      // Add other rock messages...
    }
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
    'pt': "Para encontrar o seu número IMEI, basta discar *#06# no teclado do seu telefone. Este código universal funciona em todos os dispositivos móveis. O seu número IMEI de 15 dígitos aparecerá imediatamente no ecrã. Escreva-o ou tire uma captura de tela para os seus registros.",
    'de': "Um Ihre IMEI-Nummer zu finden, wählen Sie einfach *#06# auf der Tastatur Ihres Telefons. Dieser universelle Code funktioniert auf allen Mobilgeräten. Ihre 15-stellige IMEI-Nummer wird sofort auf dem Bildschirm angezeigt.",
    'it': "Per trovare il tuo numero IMEI, componi semplicemente *#06# sulla tastiera del tuo telefono. Questo codice universale funziona su tutti i dispositivi mobili. Il tuo numero IMEI di 15 cifre apparirà immediatamente sullo schermo.",
    'ru': "Чтобы найти ваш номер IMEI, просто наберите *#06# на клавиатуре телефона. Этот универсальный код работает на всех мобильных устройствах. Ваш 15-значный номер IMEI появится на экране немедленно.",
    'zh': "要查找您的IMEI号码，只需在手机键盘上拨打*#06#。这个通用代码适用于所有移动设备。您的15位IMEI号码将立即出现在屏幕上。",
    'ja': "IMEI番号を見つけるには、携帯電話のキーパッドで*#06#をダイヤルするだけです。この汎用コードはすべてのモバイルデバイスで機能します。15桁のIMEI番号がすぐに画面に表示されます。",
    'ar': "للعثور على رقم IMEI الخاص بك، ما عليك سوى الاتصال بـ *#06# على لوحة مفاتيح هاتفك. هذا الرمز العالمي يعمل على جميع الأجهزة المحمولة. سيظهر رقم IMEI المكون من 15 رقماً على الشاشة فوراً.",
    'nl': "Om uw IMEI-nummer te vinden, toetst u eenvoudig *#06# in op het toetsenbord van uw telefoon. Deze universele code werkt op alle mobiele apparaten - smartphones, gewone telefoons en tablets met mobiele functionaliteit. Uw 15-cijferige IMEI-nummer verschijnt onmiddellijk op het scherm.",
    'pl': "Aby znaleźć swój numer IMEI, po prostu wybierz *#06# na klawiaturze telefonu. Ten uniwersalny kod działa na wszystkich urządzeniach mobilnych - smartfonach, zwykłych telefonach i tabletach z funkcją komórkową. Twój 15-cyfrowy numer IMEI pojawi się natychmiast na ekranie.",
    'tr': "IMEI numaranızı bulmak için telefonunuzun tuş takımında *#06# tuşlayın. Bu evrensel kod tüm mobil cihazlarda çalışır - akıllı telefonlar, temel telefonlar ve hücresel özellikli tabletler. 15 haneli IMEI numaranız ekranda hemen görünecektir.",
    'ko': "IMEI 번호를 찾으려면 휴대폰 키패드에서 *#06#을 다이얼하기만 하면 됩니다. 이 범용 코드는 모든 모바일 기기에서 작동합니다 - 스마트폰, 기본 전화기, 셀룰러 기능이 있는 태블릿. 15자리 IMEI 번호가 화면에 즉시 나타납니다.",
    'hi': "अपना IMEI नंबर खोजने के लिए, बस अपने फोन के कीपैड पर *#06# डायल करें। यह सार्वभौमिक कोड सभी मोबाइल उपकरणों पर काम करता है - स्मार्टफोन, बेसिक फोन, और सेल्यूलर क्षमता वाले टैबलेट। आपका 15-अंकीय IMEI नंबर तुरंत स्क्रीन पर दिखाई देगा।",
    'th': "หากต้องการค้นหาหมายเลข IMEI ของคุณ เพียงกด *#06# บนแป้นพิมพ์ของโทรศัพท์ รหัสสากลนี้ใช้ได้กับอุปกรณ์มือถือทุกประเภท - สมาร์ทโฟน โทรศัพท์พื้นฐาน และแท็บเล็ตที่มีความสามารถทางเซลลูลาร์ หมายเลข IMEI 15 หลักของคุณจะปรากฏบนหน้าจอทันที",
    'vi': "Để tìm số IMEI của bạn, chỉ cần quay số *#06# trên bàn phím điện thoại. Mã phổ quát này hoạt động trên tất cả các thiết bị di động - điện thoại thông minh, điện thoại cơ bản và máy tính bảng có khả năng di động. Số IMEI 15 chữ số của bạn sẽ xuất hiện ngay lập tức trên màn hình.",
    'id': "Untuk menemukan nomor IMEI Anda, cukup tekan *#06# pada keypad ponsel Anda. Kode universal ini bekerja pada semua perangkat mobile - smartphone, ponsel dasar, dan tablet dengan kemampuan seluler. Nomor IMEI 15 digit Anda akan muncul di layar segera.",
    'sv': "För att hitta ditt IMEI-nummer, ring helt enkelt *#06# på telefonens knappsats. Denna universella kod fungerar på alla mobila enheter - smartphones, grundtelefoner och surfplattor med cellulär kapacitet. Ditt 15-siffriga IMEI-nummer kommer att visas på skärmen omedelbart.",
    'no': "For å finne ditt IMEI-nummer, ring ganske enkelt *#06# på telefonens tastatur. Denne universelle koden fungerer på alle mobile enheter - smarttelefoner, grunntelefoner og nettbrett med cellulær kapasitet. Ditt 15-sifrede IMEI-nummer vil vises på skjermen umiddelbart.",
    'da': "For at finde dit IMEI-nummer skal du blot ringe *#06# på din telefons tastatur. Denne universelle kode virker på alle mobile enheder - smartphones, grundlæggende telefoner og tablets med cellulær kapacitet. Dit 15-cifrede IMEI-nummer vil vises på skærmen øjeblikkeligt.",
    'fi': "Löytääksesi IMEI-numerosi, soita yksinkertaisesti *#06# puhelimesi näppäimistöllä. Tämä yleinen koodi toimii kaikissa mobiililaitteissa - älypuhelimissa, perusmatkapuhelimissa ja tableteissa, joissa on matkapuhelinominaisuus. 15-numeroinen IMEI-numerosi ilmestyy ruudulle välittömästi.",
    'he': "כדי למצוא את מספר ה-IMEI שלך, פשוט חייג *#06# על המקלדת של הטלפון שלך. הקוד האוניברסלי הזה עובד על כל המכשירים הניידים - סמארטפונים, טלפונים בסיסיים וטאבלטים עם יכולת סלולרית. מספר ה-IMEI בן 15 הספרות שלך יופיע על המסך מיד.",
    'el': "Για να βρείτε τον αριθμό IMEI σας, απλώς καλέστε *#06# στο πληκτρολόγιο του τηλεφώνου σας. Αυτός ο παγκόσμιος κωδικός λειτουργεί σε όλες τις κινητές συσκευές - smartphones, βασικά τηλέφωνα και tablets με κυψελοειδή δυνατότητα. Ο 15ψήφιος αριθμός IMEI σας θα εμφανιστεί στην οθόνη αμέσως.",
    'cs': "Chcete-li najít své číslo IMEI, jednoduše vytočte *#06# na klávesnici telefonu. Tento univerzální kód funguje na všech mobilních zařízeních - chytrých telefonech, základních telefonech a tabletech s mobilní konektivitou. Vaše 15místné číslo IMEI se okamžitě zobrazí na obrazovce.",
    'hu': "Az IMEI szám megtalálásához egyszerűen tárcsázza a *#06#-ot a telefon billentyűzetén. Ez az univerzális kód minden mobil eszközön működik - okostelefonokon, alapvető telefonokon és cellás képességű táblagépeken. A 15 jegyű IMEI száma azonnal megjelenik a képernyőn.",
    'ro': "Pentru a găsi numărul dvs. IMEI, pur și simplu formați *#06# pe tastatura telefonului. Acest cod universal funcționează pe toate dispozitivele mobile - smartphone-uri, telefoane de bază și tablete cu capacitate celulară. Numărul dvs. IMEI de 15 cifre va apărea pe ecran imediat.",
    'bg': "За да намерите вашия IMEI номер, просто наберете *#06# на клавиатурата на телефона. Този универсален код работи на всички мобилни устройства - смартфони, основни телефони и таблети с клетъчна възможност. Вашият 15-цифрен IMEI номер ще се появи на екрана веднага.",
    'hr': "Da biste pronašli svoj IMEI broj, jednostavno naberite *#06# na tipkovnici telefona. Ovaj univerzalni kod radi na svim mobilnim uređajima - pametnim telefonima, osnovnim telefonima i tabletima s mobilnim mogućnostima. Vaš 15-znamenkasti IMEI broj pojavit će se na zaslonu odmah.",
    'sk': "Ak chcete nájsť svoje IMEI číslo, jednoducho vytočte *#06# na klávesnici telefónu. Tento univerzálny kód funguje na všetkých mobilných zariadeniach - smartfónoch, základných telefónoch a tabletoch s mobilnou konektivitou. Vaše 15-miestne IMEI číslo sa okamžite zobrazí na obrazovke."
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