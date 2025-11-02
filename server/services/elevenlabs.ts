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

// Multilingual 4-voice harmonizing content for USSD Help
export const HARMONIZING_CONTENT = {
  'en': {
    voice1: "🎵 Welcome to our four-voice harmony experience! 🎵",
    voice2: "🎵 Star-hash-zero-six-hash, the magical IMEI code! This universal sequence works on every phone, from basic to smart, you're never alone! 🎵",
    voice3: "🎵 Together we sing, your device's unique song, fifteen digits strong, helping you along! Android or iPhone, it doesn't matter at all! 🎵",
    voice4: "🎵 This universal key works on every phone! Write it down safe, screenshot it too, your IMEI number will always help you! Let's harmonize together! 🎵"
  },
  'es': {
    voice1: "🎵 ¡Bienvenidos a nuestra experiencia de armonía a cuatro voces! 🎵",
    voice2: "🎵 ¡Asterisco-numeral-cero-seis-numeral, el código IMEI mágico! Esta secuencia universal funciona en cada teléfono, básico o inteligente, ¡nunca estás solo! 🎵",
    voice3: "🎵 ¡Juntos cantamos la canción única de tu dispositivo, quince dígitos fuertes, ayudándote siempre! ¡Android o iPhone, no importa para nada! 🎵",
    voice4: "🎵 ¡Esta clave universal funciona en cada teléfono! Anótalo seguro, toma captura también, ¡tu número IMEI siempre te ayudará! ¡Armonicemos juntos! 🎵"
  },
  'fr': {
    voice1: "🎵 Bienvenue dans notre expérience d'harmonie à quatre voix! 🎵",
    voice2: "🎵 Étoile-dièse-zéro-six-dièse, le code IMEI magique! Cette séquence universelle fonctionne sur chaque téléphone, basique ou intelligent, vous n'êtes jamais seul! 🎵",
    voice3: "🎵 Ensemble nous chantons la chanson unique de votre appareil, quinze chiffres forts, vous aidant toujours! Android ou iPhone, peu importe! 🎵",
    voice4: "🎵 Cette clé universelle fonctionne sur chaque téléphone! Notez-le bien, prenez une capture aussi, votre numéro IMEI vous aidera toujours! Harmonisons ensemble! 🎵"
  },
  'de': {
    voice1: "🎵 Willkommen zu unserem vierstimmigen Harmonie-Erlebnis! 🎵",
    voice2: "🎵 Stern-Raute-Null-Sechs-Raute, der magische IMEI-Code! Diese universelle Sequenz funktioniert auf jedem Telefon, einfach oder smart, du bist nie allein! 🎵",
    voice3: "🎵 Zusammen singen wir das einzigartige Lied deines Geräts, fünfzehn Ziffern stark, dir immer helfend! Android oder iPhone, es spielt keine Rolle! 🎵",
    voice4: "🎵 Dieser universelle Schlüssel funktioniert auf jedem Telefon! Schreib es sicher auf, mach auch einen Screenshot, deine IMEI-Nummer wird dir immer helfen! Lasst uns zusammen harmonisieren! 🎵"
  },
  'it': {
    voice1: "🎵 Benvenuti alla nostra esperienza di armonia a quattro voci! 🎵",
    voice2: "🎵 Stella-cancelletto-zero-sei-cancelletto, il codice IMEI magico! Questa sequenza universale funziona su ogni telefono, base o smart, non sei mai solo! 🎵",
    voice3: "🎵 Insieme cantiamo la canzone unica del tuo dispositivo, quindici cifre forti, aiutandoti sempre! Android o iPhone, non importa affatto! 🎵",
    voice4: "🎵 Questa chiave universale funziona su ogni telefono! Scrivilo al sicuro, fai anche uno screenshot, il tuo numero IMEI ti aiuterà sempre! Armonizziamo insieme! 🎵"
  },
  'pt': {
    voice1: "🎵 Bem-vindos à nossa experiência de harmonia de quatro vozes! 🎵",
    voice2: "🎵 Asterisco-sustenido-zero-seis-sustenido, o código IMEI mágico! Esta sequência universal funciona em qualquer telefone, básico ou inteligente, você nunca está sozinho! 🎵",
    voice3: "🎵 Juntos cantamos a música única do seu dispositivo, quinze dígitos fortes, sempre te ajudando! Android ou iPhone, não importa nada! 🎵",
    voice4: "🎵 Esta chave universal funciona em qualquer telefone! Anote com segurança, tire uma captura também, seu número IMEI sempre te ajudará! Vamos harmonizar juntos! 🎵"
  },
  'nl': {
    voice1: "🎵 Welkom bij onze vierstemmige harmonie-ervaring! 🎵",
    voice2: "🎵 Ster-hekje-nul-zes-hekje, de magische IMEI-code! Deze universele reeks werkt op elke telefoon, basis of smart, je bent nooit alleen! 🎵",
    voice3: "🎵 Samen zingen we het unieke lied van je apparaat, vijftien cijfers sterk, je altijd helpend! Android of iPhone, het maakt niet uit! 🎵",
    voice4: "🎵 Deze universele sleutel werkt op elke telefoon! Schrijf het veilig op, neem ook een screenshot, je IMEI-nummer zal je altijd helpen! Laten we samen harmoniseren! 🎵"
  },
  'ru': {
    voice1: "🎵 Добро пожаловать в наш опыт четырёхголосной гармонии! 🎵",
    voice2: "🎵 Звёздочка-решётка-ноль-шесть-решётка, магический IMEI-код! Эта универсальная последовательность работает на каждом телефоне, простом или умном, ты никогда не одинок! 🎵",
    voice3: "🎵 Вместе мы поём уникальную песню твоего устройства, пятнадцать цифр сильных, всегда помогая тебе! Android или iPhone, совсем не важно! 🎵",
    voice4: "🎵 Этот универсальный ключ работает на каждом телефоне! Запиши безопасно, сделай скриншот тоже, твой IMEI-номер всегда поможет тебе! Давайте гармонировать вместе! 🎵"
  },
  'zh': {
    voice1: "🎵 欢迎来到我们的四声部和声体验！🎵",
    voice2: "🎵 星号-井号-零-六-井号，神奇的IMEI代码！这个通用序列在每部手机上都有效，无论基础还是智能，你永远不孤单！🎵",
    voice3: "🎵 我们一起唱出你设备独特的歌曲，十五位数字强劲，永远帮助你前进！安卓或苹果，完全不重要！🎵",
    voice4: "🎵 这把万能钥匙在每部手机上都有效！安全记下它，也截个屏，你的IMEI号码永远会帮助你！让我们一起和声！🎵"
  },
  'ja': {
    voice1: "🎵 四声部ハーモニー体験へようこそ！🎵",
    voice2: "🎵 アスタリスク-シャープ-ゼロ-シックス-シャープ、魔法のIMEIコード！この汎用シーケンスはすべての電話で動作します、ベーシックでもスマートでも、あなたは決して一人ではありません！🎵",
    voice3: "🎵 一緒にあなたのデバイスのユニークな歌を歌います、15桁の強い数字、いつもあなたを助けています！AndroidでもiPhoneでも、全く関係ありません！🎵",
    voice4: "🎵 この汎用キーはすべての電話で動作します！安全にメモして、スクリーンショットも撮って、あなたのIMEI番号はいつもあなたを助けてくれます！一緒にハーモナイズしましょう！🎵"
  },
  'ko': {
    voice1: "🎵 4성부 하모니 경험에 오신 것을 환영합니다! 🎵",
    voice2: "🎵 별표-샵-영-육-샵, 마법의 IMEI 코드! 이 범용 시퀀스는 모든 전화기에서 작동합니다, 기본형이든 스마트폰이든, 당신은 결코 혼자가 아닙니다! 🎵",
    voice3: "🎵 함께 당신 기기만의 독특한 노래를 부릅니다, 15자리 강력한 숫자, 항상 당신을 도와줍니다! 안드로이드든 아이폰이든, 전혀 중요하지 않습니다! 🎵",
    voice4: "🎵 이 범용 키는 모든 전화기에서 작동합니다! 안전하게 기록하고, 스크린샷도 찍으세요, 당신의 IMEI 번호가 항상 도움이 될 것입니다! 함께 하모나이즈해요! 🎵"
  },
  'hi': {
    voice1: "🎵 हमारे चार-आवाज़ के सामंजस्य अनुभव में आपका स्वागत है! 🎵",
    voice2: "🎵 तारा-हैश-शून्य-छह-हैश, जादुई IMEI कोड! यह सार्वभौमिक अनुक्रम हर फोन पर काम करता है, बेसिक से लेकर स्मार्ट तक, आप कभी अकेले नहीं हैं! 🎵",
    voice3: "🎵 साथ मिलकर हम आपके डिवाइस का अनोखा गाना गाते हैं, पंद्रह अंक मजबूत, हमेशा आपकी मदद करते हुए! एंड्रॉइड हो या आईफोन, कुछ फर्क नहीं पड़ता! 🎵",
    voice4: "🎵 यह सार्वभौमिक चाबी हर फोन पर काम करती है! इसे सुरक्षित लिखें, स्क्रीनशॉट भी लें, आपका IMEI नंबर हमेशा आपकी मदद करेगा! आइए साथ मिलकर सामंजस्य बनाएं! 🎵"
  },
  'th': {
    voice1: "🎵 ยินดีต้อนรับสู่ประสบการณ์ฮาร์โมนี่สี่เสียงของเรา! 🎵",
    voice2: "🎵 ดาว-แฮช-ศูนย์-หก-แฮช, รหัส IMEI มหัศจรรย์! ลำดับสากลนี้ใช้งานได้กับทุกโทรศัพท์ ไม่ว่าจะธรรมดาหรือสมาร์ท คุณไม่เคยอยู่คนเดียว! 🎵",
    voice3: "🎵 เราร้องเพลงเฉพาะของอุปกรณ์คุณด้วยกัน สิบห้าหลักที่แข็งแกร่ง ช่วยเหลือคุณเสมอ! ไม่ว่าจะแอนดรอยด์หรือไอโฟน ไม่สำคัญเลย! 🎵",
    voice4: "🎵 กุญแจสากลนี้ใช้งานได้กับทุกโทรศัพท์! จดไว้อย่างปลอดภัย ถ่ายหน้าจอด้วย หมายเลข IMEI ของคุณจะช่วยคุณเสมอ! มาฮาร์โมนี่กันเถอะ! 🎵"
  },
  'vi': {
    voice1: "🎵 Chào mừng bạn đến với trải nghiệm hòa âm bốn giọng của chúng tôi! 🎵",
    voice2: "🎵 Dấu sao-thăng-không-sáu-thăng, mã IMEI kỳ diệu! Chuỗi phổ quát này hoạt động trên mọi điện thoại, từ cơ bản đến thông minh, bạn không bao giờ cô đơn! 🎵",
    voice3: "🎵 Cùng nhau chúng ta hát bài hát độc đáo của thiết bị bạn, mười lăm chữ số mạnh mẽ, luôn giúp đỡ bạn! Android hay iPhone, điều đó không quan trọng! 🎵",
    voice4: "🎵 Chìa khóa vạn năng này hoạt động trên mọi điện thoại! Viết nó an toàn, chụp màn hình cũng được, số IMEI của bạn sẽ luôn giúp bạn! Hãy hòa âm cùng nhau! 🎵"
  },
  'id': {
    voice1: "🎵 Selamat datang di pengalaman harmoni empat suara kami! 🎵",
    voice2: "🎵 Bintang-pagar-nol-enam-pagar, kode IMEI ajaib! Urutan universal ini bekerja di setiap telepon, dasar atau pintar, kamu tidak pernah sendirian! 🎵",
    voice3: "🎵 Bersama kita menyanyikan lagu unik perangkatmu, lima belas digit kuat, selalu membantumu! Android atau iPhone, tidak masalah sama sekali! 🎵",
    voice4: "🎵 Kunci universal ini bekerja di setiap telepon! Tulis dengan aman, screenshot juga, nomor IMEI-mu akan selalu membantumu! Mari berharmoni bersama! 🎵"
  },
  'ar': {
    voice1: "🎵 أهلاً بكم في تجربة الانسجام الصوتي الرباعي! 🎵",
    voice2: "🎵 نجمة-هاش-صفر-ستة-هاش، رمز IMEI السحري! هذا التسلسل الشامل يعمل على كل هاتف، بسيط أو ذكي، أنت لست وحيداً أبداً! 🎵",
    voice3: "🎵 معاً نغني أغنية جهازك الفريدة، خمسة عشر رقماً قوياً، تساعدك دائماً! أندرويد أو آيفون، لا يهم على الإطلاق! 🎵",
    voice4: "🎵 هذا المفتاح الشامل يعمل على كل هاتف! اكتبه بأمان، والتقط صورة أيضاً، رقم IMEI الخاص بك سيساعدك دائماً! دعونا ننسجم معاً! 🎵"
  },
  'sv': {
    voice1: "🎵 Välkommen till vår fyrstämmiga harmoniupplevelse! 🎵",
    voice2: "🎵 Stjärna-hash-noll-sex-hash, den magiska IMEI-koden! Denna universella sekvens fungerar på varje telefon, enkel eller smart, du är aldrig ensam! 🎵",
    voice3: "🎵 Tillsammans sjunger vi din enhets unika sång, femton siffror starka, hjälper dig alltid! Android eller iPhone, det spelar ingen roll alls! 🎵",
    voice4: "🎵 Denna universella nyckel fungerar på varje telefon! Skriv ner det säkert, ta en skärmbild också, ditt IMEI-nummer kommer alltid att hjälpa dig! Låt oss harmonisera tillsammans! 🎵"
  },
  'no': {
    voice1: "🎵 Velkommen til vår firestemmige harmoniopplevelse! 🎵",
    voice2: "🎵 Stjerne-hash-null-seks-hash, den magiske IMEI-koden! Denne universelle sekvensen fungerer på enhver telefon, enkel eller smart, du er aldri alene! 🎵",
    voice3: "🎵 Sammen synger vi din enhets unike sang, femten sifre sterke, hjelper deg alltid! Android eller iPhone, det spiller ingen rolle i det hele tatt! 🎵",
    voice4: "🎵 Denne universelle nøkkelen fungerer på enhver telefon! Skriv det ned trygt, ta et skjermskudd også, ditt IMEI-nummer vil alltid hjelpe deg! La oss harmonisere sammen! 🎵"
  },
  'da': {
    voice1: "🎵 Velkommen til vores firestemmige harmonioplevelse! 🎵",
    voice2: "🎵 Stjerne-hash-nul-seks-hash, den magiske IMEI-kode! Denne universelle sekvens virker på enhver telefon, simpel eller smart, du er aldrig alene! 🎵",
    voice3: "🎵 Sammen synger vi din enheds unikke sang, femten cifre stærke, hjælper dig altid! Android eller iPhone, det betyder slet intet! 🎵",
    voice4: "🎵 Denne universelle nøgle virker på enhver telefon! Skriv det sikkert ned, tag også et skærmbillede, dit IMEI-nummer vil altid hjælpe dig! Lad os harmonisere sammen! 🎵"
  },
  'fi': {
    voice1: "🎵 Tervetuloa neliosaiseen harmoniakokemukseemme! 🎵",
    voice2: "🎵 Tähti-hash-nolla-kuusi-hash, maaginen IMEI-koodi! Tämä yleissekvenssi toimii jokaisessa puhelimessa, yksinkertaisessa tai älypuhelimessa, et ole koskaan yksin! 🎵",
    voice3: "🎵 Yhdessä laulamme laitteesi ainutlaatuista laulua, viisitoista numeroa vahvana, auttaen sinua aina! Android tai iPhone, sillä ei ole väliä ollenkaan! 🎵",
    voice4: "🎵 Tämä yleisavain toimii jokaisessa puhelimessa! Kirjoita se turvallisesti, ota kuvakaappaus myös, IMEI-numerosi auttaa sinua aina! Harmonisoikaamme yhdessä! 🎵"
  },
  'he': {
    voice1: "🎵 ברוכים הבאים לחוויית ההרמוניה בארבעה קולות שלנו! 🎵",
    voice2: "🎵 כוכבית-סולמית-אפס-שש-סולמית, קוד IMEI הקסום! הרצף האוניברסלי הזה עובד על כל טלפון, בסיסי או חכם, אתם אף פעם לא לבד! 🎵",
    voice3: "🎵 יחד אנחנו שרים את השיר הייחודי של המכשיר שלכם, חמש עשרה ספרות חזקות, עוזרות לכם תמיד! אנדרואיד או אייפון, זה לא משנה בכלל! 🎵",
    voice4: "🎵 המפתח האוניברסלי הזה עובד על כל טלפון! רישמו את זה בבטחה, צילמו מסך גם, מספר IMEI שלכם תמיד יעזור לכם! בואו נעשה הרמוניה יחד! 🎵"
  },
  'el': {
    voice1: "🎵 Καλώς ήρθατε στην εμπειρία αρμονίας τεσσάρων φωνών μας! 🎵",
    voice2: "🎵 Αστερίσκος-δίεση-μηδέν-έξι-δίεση, ο μαγικός κωδικός IMEI! Αυτή η καθολική ακολουθία λειτουργεί σε κάθε τηλέφωνο, βασικό ή έξυπνο, δεν είστε ποτέ μόνοι! 🎵",
    voice3: "🎵 Μαζί τραγουδάμε το μοναδικό τραγούδι της συσκευής σας, δεκαπέντε ψηφία δυνατά, σας βοηθούν πάντα! Android ή iPhone, δεν έχει καμία σημασία! 🎵",
    voice4: "🎵 Αυτό το καθολικό κλειδί λειτουργεί σε κάθε τηλέφωνο! Γράψτε το με ασφάλεια, τραβήξτε στιγμιότυπο επίσης, ο αριθμός IMEI σας θα σας βοηθήσει πάντα! Ας αρμονίσουμε μαζί! 🎵"
  },
  'cs': {
    voice1: "🎵 Vítejte v našem čtyřhlasém harmonickém zážitku! 🎵",
    voice2: "🎵 Hvězdička-křížek-nula-šest-křížek, magický IMEI kód! Tato univerzální sekvence funguje na každém telefonu, základním i chytrém, nikdy nejste sami! 🎵",
    voice3: "🎵 Společně zpíváme jedinečnou píseň vašeho zařízení, patnáct číslic silných, vždy vám pomáhají! Android nebo iPhone, vůbec na tom nezáleží! 🎵",
    voice4: "🎵 Tento univerzální klíč funguje na každém telefonu! Zapište si to bezpečně, udělejte snímek obrazovky také, vaše IMEI číslo vám vždy pomůže! Pojďme harmonizovat společně! 🎵"
  },
  'hu': {
    voice1: "🎵 Üdvözöljük négyszólamú harmóniaélményünkben! 🎵",
    voice2: "🎵 Csillag-kettőskereszt-nulla-hat-kettőskereszt, a mágikus IMEI kód! Ez az univerzális sorozat minden telefonon működik, alapokon és okostelefonokon, sosem vagy egyedül! 🎵",
    voice3: "🎵 Együtt énekeljük eszközöd egyedi dalát, tizenöt erős számjegy, mindig segít neked! Android vagy iPhone, egyáltalán nem számít! 🎵",
    voice4: "🎵 Ez az univerzális kulcs minden telefonon működik! Írd fel biztonságosan, készíts képernyőfotót is, az IMEI számod mindig segíteni fog! Harmonizáljunk együtt! 🎵"
  },
  'ro': {
    voice1: "🎵 Bun veniți la experiența noastră de armonie în patru voci! 🎵",
    voice2: "🎵 Stea-diez-zero-șase-diez, codul IMEI magic! Această secvență universală funcționează pe fiecare telefon, simplu sau inteligent, nu sunteți niciodată singuri! 🎵",
    voice3: "🎵 Împreună cântăm cântecul unic al dispozitivului tău, cincisprezece cifre puternice, te ajută mereu! Android sau iPhone, nu contează deloc! 🎵",
    voice4: "🎵 Această cheie universală funcționează pe fiecare telefon! Scrie-l în siguranță, fă o captură de ecran și tu, numărul tău IMEI te va ajuta mereu! Să armonizăm împreună! 🎵"
  },
  'bg': {
    voice1: "🎵 Добре дошли в нашето четиригласно хармонично изживяване! 🎵",
    voice2: "🎵 Звездичка-диез-нула-шест-диез, магическия IMEI код! Тази универсална последователност работи на всеки телефон, основен или умен, никога не сте сами! 🎵",
    voice3: "🎵 Заедно пеем уникалната песен на твоето устройство, петнадесет цифри силни, винagi ти помагат! Android или iPhone, изобщо не е важно! 🎵",
    voice4: "🎵 Този универсален ключ работи на всеки телефон! Запиши го безопасно, направи снимка на екрана също, твоя IMEI номер винаги ще ти помага! Да хармонизираме заедно! 🎵"
  },
  'hr': {
    voice1: "🎵 Dobrodošli u naše četveroglasno harmonijsko iskustvo! 🎵",
    voice2: "🎵 Zvjezdica-taraba-nula-šest-taraba, čarobni IMEI kod! Ovaj univerzalni slijed radi na svakom telefonu, osnovnom ili pametnom, nikad niste sami! 🎵",
    voice3: "🎵 Zajedno pjevamo jedinstvenu pjesmu vašeg uređaja, petnaest brojeva jakih, uvijek vam pomažu! Android ili iPhone, uopće nije važno! 🎵",
    voice4: "🎵 Ovaj univerzalni ključ radi na svakom telefonu! Zapišite sigurno, napravite snimak ekrana također, vaš IMEI broj će vam uvijek pomoći! Harmonizirajmo zajedno! 🎵"
  },
  'sk': {
    voice1: "🎵 Vitajte v našom štyrhlasom harmonickom zážitku! 🎵",
    voice2: "🎵 Hviezdička-krížik-nula-šesť-krížik, magický IMEI kód! Táto univerzálna sekvencia funguje na každom telefóne, základnom aj chytrom, nikdy nie ste sami! 🎵",
    voice3: "🎵 Spoločne spievame jedinečnú pieseň vášho zariadenia, pätnásť číslic silných, vždy vám pomáhajú! Android alebo iPhone, vôbec na tom nezáleží! 🎵",
    voice4: "🎵 Tento univerzálny kľúč funguje na každom telefóne! Zapíšte si to bezpečne, urobte snímku obrazovky tiež, vaše IMEI číslo vám vždy pomôže! Poďme harmonizovať spolu! 🎵"
  },
  'pl': {
    voice1: "🎵 Witajcie w naszym czterogłosowym doświadczeniu harmonijnym! 🎵",
    voice2: "🎵 Gwiazdka-hash-zero-sześć-hash, magiczny kod IMEI! Ta uniwersalna sekwencja działa na każdym telefonie, prostym czy smartfonie, nigdy nie jesteś sam! 🎵",
    voice3: "🎵 Razem śpiewamy unikalną piosenką twojego urządzenia, piętnaście cyfr mocnych, zawsze ci pomagając! Android czy iPhone, to w ogóle nie ma znaczenia! 🎵",
    voice4: "🎵 Ten uniwersalny klucz działa na każdym telefonie! Zapisz to bezpiecznie, zrób też zrzut ekranu, twój numer IMEI zawsze ci pomoże! Harmonizujmy razem! 🎵"
  },
  'tr': {
    voice1: "🎵 Dört sesli armoni deneyimimize hoş geldiniz! 🎵",
    voice2: "🎵 Yıldız-diyez-sıfır-altı-diyez, sihirli IMEI kodu! Bu evrensel dizi her telefonda çalışır, temel veya akıllı, asla yalnız değilsiniz! 🎵",
    voice3: "🎵 Birlikte cihazınızın benzersiz şarkısını söylüyoruz, on beş rakam güçlü, size her zaman yardım ediyor! Android veya iPhone, hiç önemli değil! 🎵",
    voice4: "🎵 Bu evrensel anahtar her telefonda çalışır! Güvenle yazın, ekran görüntüsü de alın, IMEI numaranız size her zaman yardım edecek! Birlikte uyum sağlayalım! 🎵"
  }
};

// Multilingual 5-voice Christmas rock song content about first phones
export const CHRISTMAS_ROCK_CONTENT = {
  'en': {
    voice1: "🎸 Oh the first phone ever made, in eighteen seventy-six that day! Alexander Bell did say 'Hello Watson!' and history came alive! 🎸",
    voice2: "🎸 Christmas bells and IMEI spells, fifteen digits tell the tale! From rotary phones to smartphones today, technology will never fail! 🎸", 
    voice3: "🎸 Star-hash-zero-six-hash code, unlock your device's episode! Every phone has got a story, every number tells of glory! 🎸",
    voice4: "🎸 Rock and roll this Christmas night, IMEI numbers burning bright! From the first phone call to now, technology shows us how! 🎸",
    voice5: "🎸 Together we're singing this rock Christmas song, about the phones that keep us strong! Write down that code, don't let it slide, your IMEI's your digital guide! 🎸"
  },
  'es': {
    voice1: "🎸 ¡Oh el primer teléfono creado, en mil ochocientos setenta y seis! ¡Alexander Bell dijo '¡Hola Watson!' y la historia cobró vida! 🎸",
    voice2: "🎸 ¡Campanas navideñas y hechizos IMEI, quince dígitos cuentan la historia! ¡De teléfonos rotatorios a smartphones hoy, la tecnología nunca fallará! 🎸",
    voice3: "🎸 ¡Código asterisco-numeral-cero-seis-numeral, desbloquea el episodio de tu dispositivo! ¡Cada teléfono tiene una historia, cada número cuenta de gloria! 🎸",
    voice4: "🎸 ¡Rock and roll esta noche navideña, números IMEI brillando! ¡Desde la primera llamada hasta ahora, la tecnología nos muestra cómo! 🎸",
    voice5: "🎸 ¡Juntos cantamos esta canción navideña rock, sobre los teléfonos que nos mantienen fuertes! ¡Anota ese código, no lo dejes pasar, tu IMEI es tu guía digital! 🎸"
  },
  'fr': {
    voice1: "🎸 Oh le premier téléphone créé, en mille huit cent soixante-seize ce jour! Alexander Bell a dit 'Bonjour Watson!' et l'histoire a pris vie! 🎸",
    voice2: "🎸 Cloches de Noël et sorts IMEI, quinze chiffres racontent l'histoire! Des téléphones rotatifs aux smartphones aujourd'hui, la technologie ne faillira jamais! 🎸",
    voice3: "🎸 Code étoile-dièse-zéro-six-dièse, déverrouille l'épisode de ton appareil! Chaque téléphone a une histoire, chaque nombre parle de gloire! 🎸",
    voice4: "🎸 Rock and roll cette nuit de Noël, numéros IMEI brillant! Du premier appel à maintenant, la technologie nous montre comment! 🎸",
    voice5: "🎸 Ensemble nous chantons cette chanson rock de Noël, sur les téléphones qui nous rendent forts! Écris ce code, ne le laisse pas filer, ton IMEI est ton guide numérique! 🎸"
  },
  'de': {
    voice1: "🎸 Oh das erste Telefon gemacht, in achtzehnhundertsechsundsiebzig an dem Tag! Alexander Bell sagte 'Hallo Watson!' und die Geschichte wurde lebendig! 🎸",
    voice2: "🎸 Weihnachtsglocken und IMEI-Zauber, fünfzehn Ziffern erzählen die Geschichte! Von Drehtelefonen zu Smartphones heute, Technologie wird nie versagen! 🎸",
    voice3: "🎸 Stern-Raute-Null-Sechs-Raute-Code, entsperre die Episode deines Geräts! Jedes Telefon hat eine Geschichte, jede Nummer spricht von Ruhm! 🎸",
    voice4: "🎸 Rock and roll diese Weihnachtsnacht, IMEI-Nummern brennend hell! Vom ersten Anruf bis jetzt, Technologie zeigt uns wie! 🎸",
    voice5: "🎸 Zusammen singen wir dieses Rock-Weihnachtslied, über die Telefone die uns stark machen! Schreib den Code auf, lass ihn nicht gleiten, dein IMEI ist dein digitaler Führer! 🎸"
  },
  'it': {
    voice1: "🎸 Oh il primo telefono mai fatto, nel milleottocentosettantasei quel giorno! Alexander Bell disse 'Ciao Watson!' e la storia prese vita! 🎸",
    voice2: "🎸 Campane natalizie e incantesimi IMEI, quindici cifre raccontano la storia! Da telefoni rotativi a smartphone oggi, la tecnologia non fallirà mai! 🎸",
    voice3: "🎸 Codice stella-cancelletto-zero-sei-cancelletto, sblocca l'episodio del tuo dispositivo! Ogni telefono ha una storia, ogni numero parla di gloria! 🎸",
    voice4: "🎸 Rock and roll questa notte di Natale, numeri IMEI che brillano! Dalla prima chiamata ad ora, la tecnologia ci mostra come! 🎸",
    voice5: "🎸 Insieme stiamo cantando questa canzone rock natalizia, sui telefoni che ci tengono forti! Scrivi quel codice, non farlo scivolare, il tuo IMEI è la tua guida digitale! 🎸"
  },
  'pt': {
    voice1: "🎸 Oh o primeiro telefone já feito, em mil oitocentos e setenta e seis naquele dia! Alexander Bell disse 'Olá Watson!' e a história ganhou vida! 🎸",
    voice2: "🎸 Sinos de Natal e feitiços IMEI, quinze dígitos contam a história! De telefones rotativos a smartphones hoje, tecnologia nunca falhará! 🎸",
    voice3: "🎸 Código asterisco-sustenido-zero-seis-sustenido, desbloqueie o episódio do seu dispositivo! Todo telefone tem uma história, todo número fala de glória! 🎸",
    voice4: "🎸 Rock and roll esta noite de Natal, números IMEI brilhando! Da primeira chamada até agora, tecnologia nos mostra como! 🎸",
    voice5: "🎸 Juntos estamos cantando esta canção rock natalina, sobre os telefones que nos mantêm fortes! Anote esse código, não deixe escorregar, seu IMEI é seu guia digital! 🎸"
  },
  'nl': {
    voice1: "🎸 Oh de eerste telefoon ooit gemaakt, in achttien zeventig zes die dag! Alexander Bell zei 'Hallo Watson!' en geschiedenis kwam tot leven! 🎸",
    voice2: "🎸 Kerstklokken en IMEI-spreuken, vijftien cijfers vertellen het verhaal! Van draaiende telefoons tot smartphones vandaag, technologie zal nooit falen! 🎸",
    voice3: "🎸 Ster-hekje-nul-zes-hekje-code, ontgrendel de episode van je apparaat! Elke telefoon heeft een verhaal, elk nummer spreekt van glorie! 🎸",
    voice4: "🎸 Rock and roll deze kerstnacht, IMEI-nummers brandend helder! Van de eerste telefoongesprek tot nu, technologie toont ons hoe! 🎸",
    voice5: "🎸 Samen zingen we dit rock kerstlied, over de telefoons die ons sterk houden! Schrijf die code op, laat het niet glippen, je IMEI is je digitale gids! 🎸"
  },
  'ru': {
    voice1: "🎸 О первый телефон созданный, в тысяча восемьсот семьдесят шестом в тот день! Александр Белл сказал 'Привет Ватсон!' и история ожила! 🎸",
    voice2: "🎸 Рождественские колокола и IMEI заклинания, пятнадцать цифр рассказывают историю! От поворотных телефонов до смартфонов сегодня, технология никогда не подведёт! 🎸",
    voice3: "🎸 Код звёздочка-решётка-ноль-шесть-решётка, разблокируй эпизод твоего устройства! У каждого телефона есть история, каждая цифра говорит о славе! 🎸",
    voice4: "🎸 Рок-н-ролл эта рождественская ночь, IMEI номера горят ярко! От первого звонка до сейчас, технология показывает нам как! 🎸",
    voice5: "🎸 Вместе мы поём эту рок рождественскую песню, о телефонах которые делают нас сильными! Запиши этот код, не дай ему ускользнуть, твой IMEI твой цифровой проводник! 🎸"
  },
  'zh': {
    voice1: "🎸 哦第一部电话制造出来，在一八七六年那一天！亚历山大贝尔说'你好华生！'历史就此鲜活起来！🎸",
    voice2: "🎸 圣诞铃声和IMEI咒语，十五位数字述说故事！从旋转电话到今日智能手机，科技永远不会失败！🎸",
    voice3: "🎸 星号-井号-零-六-井号代码，解锁你设备的故事！每部电话都有传说，每个号码都诉说荣耀！🎸",
    voice4: "🎸 摇滚这个圣诞夜，IMEI号码闪闪发光！从第一通电话到现在，科技向我们展示方式！🎸",
    voice5: "🎸 我们一起唱这首摇滚圣诞歌，关于让我们强大的电话！记下那个代码，别让它溜走，你的IMEI是你的数字向导！🎸"
  },
  'ja': {
    voice1: "🎸 ああ最初に作られた電話、千八百七十六年のその日に！アレクサンダー・ベルが「もしもしワトソン！」と言い、歴史が生まれた！🎸",
    voice2: "🎸 クリスマスベルとIMEI呪文、十五桁が物語を語る！回転式電話から今日のスマートフォンまで、テクノロジーは決して失敗しない！🎸",
    voice3: "🎸 アスタリスク-シャープ-ゼロ-シックス-シャープコード、あなたのデバイスのエピソードをアンロック！すべての電話には物語があり、すべての番号は栄光を語る！🎸",
    voice4: "🎸 ロックンロールこのクリスマスの夜、IMEI番号が明るく燃えている！最初の電話から今まで、テクノロジーは私たちに方法を示す！🎸",
    voice5: "🎸 一緒にこのロッククリスマスソングを歌っています、私たちを強くしてくれる電話について！そのコードを書き留めて、滑らせないで、あなたのIMEIはあなたのデジタルガイドです！🎸"
  },
  'ko': {
    voice1: "🎸 오 최초로 만들어진 전화기, 1876년 그날에! 알렉산더 벨이 '안녕 왓슨!'이라 말했고 역사가 살아났다! 🎸",
    voice2: "🎸 크리스마스 벨과 IMEI 주문, 15자리가 이야기를 말해준다! 회전식 전화기부터 오늘날 스마트폰까지, 기술은 절대 실패하지 않는다! 🎸",
    voice3: "🎸 별표-샵-영-육-샵 코드, 당신 기기의 에피소드를 잠금 해제하라! 모든 전화기에는 이야기가 있고, 모든 번호는 영광을 말한다! 🎸",
    voice4: "🎸 록앤롤 이 크리스마스 밤, IMEI 번호들이 밝게 타오른다! 첫 번째 전화통화부터 지금까지, 기술이 우리에게 방법을 보여준다! 🎸",
    voice5: "🎸 함께 이 록 크리스마스 노래를 부르고 있다, 우리를 강하게 만들어주는 전화기들에 대해! 그 코드를 적어둬, 놓치지 마, 당신의 IMEI는 당신의 디지털 가이드다! 🎸"
  },
  'hi': {
    voice1: "🎸 ओह पहला फोन जो कभी बना, अठारह सौ छिहत्तर में उस दिन! अलेक्जेंडर बेल ने कहा 'हैलो वाटसन!' और इतिहास जीवंत हो गया! 🎸",
    voice2: "🎸 क्रिसमस की घंटियां और IMEI जादू, पंद्रह अंक कहानी कहते हैं! रोटरी फोन से आज के स्मार्टफोन तक, तकनीक कभी नहीं होगी फेल! 🎸",
    voice3: "🎸 तारा-हैश-शून्य-छह-हैश कोड, अपने डिवाइस के एपिसोड को अनलॉक करो! हर फोन की एक कहानी है, हर नंबर गौरव का बखान करता है! 🎸",
    voice4: "🎸 रॉक एंड रोल यह क्रिसमस रात, IMEI नंबर चमकते उज्ज्वल! पहली फोन कॉल से अब तक, तकनीक हमें दिखाती है कैसे! 🎸",
    voice5: "🎸 साथ मिलकर हम गा रहे हैं यह रॉक क्रिसमस गाना, उन फोन्स के बारे में जो हमें मजबूत बनाते हैं! उस कोड को लिख लो, फिसलने मत दो, आपका IMEI आपका डिजिटल गाइड है! 🎸"
  },
  'th': {
    voice1: "🎸 โอ้โทรศัพท์เครื่องแรกที่เคยทำ ในปี 1876 วันนั้น! อเล็กซานเดอร์ เบลล์พูดว่า 'สวัสดีวัตสัน!' และประวัติศาสตร์ก็มีชีวิตขึ้น! 🎸",
    voice2: "🎸 ระฆังคริสต์มาสและคาถา IMEI สิบห้าหลักเล่าเรื่องราว! จากโทรศัพท์หมุนถึงสมาร์ทโฟนวันนี้ เทคโนโลยีจะไม่มีวันล้มเหลว! 🎸",
    voice3: "🎸 รหัสดาว-แฮช-ศูนย์-หก-แฮช ปลดล็อคเอพิโซดของอุปกรณ์คุณ! ทุกโทรศัพท์มีเรื่องราว ทุกตัวเลขเล่าถึงความรุ่งโรจน์! 🎸",
    voice4: "🎸 ร็อคแอนด์โรลล์คืนคริสต์มาสนี้ หมายเลข IMEI เผาไหม้สว่าง! จากการโทรครั้งแรกจนถึงตอนนี้ เทคโนโลยีแสดงให้เราเห็นวิธี! 🎸",
    voice5: "🎸 เราร้องเพลงร็อคคริสต์มาสนี้ร่วมกัน เกี่ยวกับโทรศัพท์ที่ทำให้เราแข็งแกร่ง! จดรหัสนั้นไว้ อย่าปล่อยให้หลุด IMEI ของคุณคือไกด์ดิจิทัลของคุณ! 🎸"
  },
  'vi': {
    voice1: "🎸 Ôi chiếc điện thoại đầu tiên được tạo ra, vào năm 1876 ngày đó! Alexander Bell đã nói 'Xin chào Watson!' và lịch sử đã sống dậy! 🎸",
    voice2: "🎸 Chuông Giáng sinh và phép thuật IMEI, mười lăm chữ số kể câu chuyện! Từ điện thoại quay đến smartphone ngày nay, công nghệ sẽ không bao giờ thất bại! 🎸",
    voice3: "🎸 Mã dấu sao-thăng-không-sáu-thăng, mở khóa tập phim của thiết bị bạn! Mỗi điện thoại đều có câu chuyện, mỗi số đều nói về vinh quang! 🎸",
    voice4: "🎸 Rock and roll đêm Giáng sinh này, số IMEI cháy sáng! Từ cuộc gọi đầu tiên đến bây giờ, công nghệ cho chúng ta thấy cách! 🎸",
    voice5: "🎸 Cùng nhau chúng ta hát bài rock Giáng sinh này, về những chiếc điện thoại giữ cho chúng ta mạnh mẽ! Ghi mã đó xuống, đừng để trượt, IMEI của bạn là hướng dẫn viên kỹ thuật số của bạn! 🎸"
  },
  'id': {
    voice1: "🎸 Oh telepon pertama yang pernah dibuat, pada tahun 1876 hari itu! Alexander Bell berkata 'Halo Watson!' dan sejarah menjadi hidup! 🎸",
    voice2: "🎸 Lonceng Natal dan mantra IMEI, lima belas digit menceritakan kisah! Dari telepon putar ke smartphone hari ini, teknologi tidak akan pernah gagal! 🎸",
    voice3: "🎸 Kode bintang-pagar-nol-enam-pagar, buka episode perangkatmu! Setiap telepon punya cerita, setiap nomor bercerita tentang kejayaan! 🎸",
    voice4: "🎸 Rock and roll malam Natal ini, nomor IMEI menyala terang! Dari panggilan telepon pertama hingga sekarang, teknologi menunjukkan cara kepada kita! 🎸",
    voice5: "🎸 Bersama kita menyanyikan lagu rock Natal ini, tentang telepon yang membuat kita kuat! Tulis kode itu, jangan biarkan tergelincir, IMEI-mu adalah panduan digitalmu! 🎸"
  },
  'ar': {
    voice1: "🎸 أوه الهاتف الأول الذي صُنع، في عام ألف وثمانمائة وستة وسبعين ذلك اليوم! قال ألكسندر بيل 'مرحباً واتسون!' وأصبح التاريخ حيّاً! 🎸",
    voice2: "🎸 أجراس عيد الميلاد وسحر IMEI، خمسة عشر رقماً تحكي الحكاية! من الهواتف الدوارة إلى الهواتف الذكية اليوم، لن تفشل التكنولوجيا أبداً! 🎸",
    voice3: "🎸 رمز نجمة-هاش-صفر-ستة-هاش، افتح حلقة جهازك! كل هاتف لديه قصة، كل رقم يحكي عن المجد! 🎸",
    voice4: "🎸 روك أند رول هذه ليلة عيد الميلاد، أرقام IMEI تحترق مشرقة! من أول مكالمة هاتفية حتى الآن، التكنولوجيا تُظهر لنا كيف! 🎸",
    voice5: "🎸 معاً نغني أغنية الروك هذه لعيد الميلاد، عن الهواتف التي تبقينا أقوياء! اكتب ذلك الرمز، لا تدعه ينزلق، IMEI الخاص بك هو دليلك الرقمي! 🎸"
  },
  'sv': {
    voice1: "🎸 Åh den första telefonen som någonsin gjordes, 1876 den dagen! Alexander Bell sa 'Hej Watson!' och historien kom till liv! 🎸",
    voice2: "🎸 Julklockor och IMEI-trollformler, femton siffror berättar historien! Från vridtelefoner till smartphones idag, tekniken kommer aldrig att misslyckas! 🎸",
    voice3: "🎸 Stjärn-hash-noll-sex-hash-kod, lås upp din enhets episod! Varje telefon har en berättelse, varje nummer berättar om ära! 🎸",
    voice4: "🎸 Rock and roll denna julnatt, IMEI-nummer brinner ljust! Från det första telefonsamtalet till nu, tekniken visar oss hur! 🎸",
    voice5: "🎸 Tillsammans sjunger vi denna rock-julsång, om telefonerna som håller oss starka! Skriv ner den koden, låt den inte glida, din IMEI är din digitala guide! 🎸"
  },
  'no': {
    voice1: "🎸 Å den første telefonen som noensinne ble laget, i 1876 den dagen! Alexander Bell sa 'Hei Watson!' og historien kom til live! 🎸",
    voice2: "🎸 Juleklokker og IMEI-trollformler, femten siffer forteller historien! Fra dreietelefoner til smarttelefoner i dag, teknologien vil aldri svikte! 🎸",
    voice3: "🎸 Stjerne-hash-null-seks-hash-kode, lås opp din enhets episode! Hver telefon har en historie, hvert nummer forteller om ære! 🎸",
    voice4: "🎸 Rock and roll denne julenatta, IMEI-numre brenner lyst! Fra den første telefonsamtalen til nå, teknologien viser oss hvordan! 🎸",
    voice5: "🎸 Sammen synger vi denne rock-julesangen, om telefonene som holder oss sterke! Skriv ned den koden, ikke la den gli, din IMEI er din digitale guide! 🎸"
  },
  'da': {
    voice1: "🎸 Åh den første telefon der nogensinde blev lavet, i 1876 den dag! Alexander Bell sagde 'Hej Watson!' og historien blev levende! 🎸",
    voice2: "🎸 Juleklokker og IMEI-trylleformler, femten cifre fortæller historien! Fra drejetelefoner til smartphones i dag, teknologien vil aldrig svigte! 🎸",
    voice3: "🎸 Stjerne-hash-nul-seks-hash-kode, lås din enheds episode op! Hver telefon har en historie, hvert nummer fortæller om ære! 🎸",
    voice4: "🎸 Rock and roll denne julenat, IMEI-numre brænder lyst! Fra det første telefonopkald til nu, teknologien viser os hvordan! 🎸",
    voice5: "🎸 Sammen synger vi denne rock-julesang, om telefonerne der holder os stærke! Skriv den kode ned, lad den ikke glide, din IMEI er din digitale guide! 🎸"
  },
  'fi': {
    voice1: "🎸 Voi ensimmäinen puhelin koskaan tehty, vuonna 1876 sinä päivänä! Alexander Bell sanoi 'Hei Watson!' ja historia heräsi eloon! 🎸",
    voice2: "🎸 Joulukellot ja IMEI-loitsut, viisitoista numeroa kertoo tarinan! Kiertolevypuhelimista älypuhelimiin tänään, teknologia ei koskaan epäonnistu! 🎸",
    voice3: "🎸 Tähti-hash-nolla-kuusi-hash-koodi, avaa laitteesi jakso! Jokaisella puhelimella on tarina, jokainen numero kertoo kunniasta! 🎸",
    voice4: "🎸 Rock and roll tämä jouluyo, IMEI-numerot palavat kirkkaasti! Ensimmäisestä puhelinsoitosta nyt, teknologia näyttää meille miten! 🎸",
    voice5: "🎸 Yhdessä laulamme tätä rock-joululaulua, puhelimista jotka pitävät meidät vahvoina! Kirjoita se koodi, älä anna sen liukua, IMEI-si on digitaalinen oppaasi! 🎸"
  },
  'he': {
    voice1: "🎸 אוה הטלפון הראשון שנעשה אי פעם, בשנת 1876 באותו היום! אלכסנדר בל אמר 'שלום ווטסון!' וההיסטוריה התעוררה לחיים! 🎸",
    voice2: "🎸 פעמוני חג המולד וכישופי IMEI, חמש עשרה ספרות מספרות את הסיפור! מטלפונים סיבוביים לסמארטפונים היום, טכנולוגיה לעולם לא תיכשל! 🎸",
    voice3: "🎸 קוד כוכבית-סולמית-אפס-שש-סולמית, פתח את הפרק של המכשיר שלך! לכל טלפון יש סיפור, כל מספר מספר על תפארת! 🎸",
    voice4: "🎸 רוק אנד רול הלילה הזה של חג המולד, מספרי IMEI בוערים בהירים! מהשיחה הטלפונית הראשונה עד עכשיו, טכנולוגיה מראה לנו איך! 🎸",
    voice5: "🎸 יחד אנחנו שרים את שיר הרוק הזה של חג המולד, על הטלפונים ששומרים עלינו חזקים! תרשום את הקוד הזה, אל תיתן לו להחליק, IMEI שלך הוא המדריך הדיגיטלי שלך! 🎸"
  },
  'el': {
    voice1: "🎸 Ω το πρώτο τηλέφωνο που έγινε ποτέ, το 1876 εκείνη τη μέρα! Ο Αλέξανδρος Μπελ είπε 'Γεια σου Γουάτσον!' και η ιστορία ожила! 🎸",
    voice2: "🎸 Χριστουγεννιάτικες καμπάνες και ξόρκια IMEI, δεκαπέντε ψηφία λένε την ιστορία! Από περιστροφικά τηλέφωνα σε smartphones σήμερα, η τεχνολογία δεν θα αποτύχει ποτέ! 🎸",
    voice3: "🎸 Κωδικός αστερίσκος-δίεση-μηδέν-έξι-δίεση, ξεκλείδωσε το επεισόδιο της συσκευής σου! Κάθε τηλέφωνο έχει μια ιστορία, κάθε αριθμός μιλάει για δόξα! 🎸",
    voice4: "🎸 Rock and roll αυτή τη χριστουγεννιάτικη νύχτα, αριθμοί IMEI καίγονται φωτεινά! Από το πρώτο τηλεφώνημα μέχρι τώρα, η τεχνολογία μας δείχνει πώς! 🎸",
    voice5: "🎸 Μαζί τραγουδάμε αυτό το rock χριστουγεννιάτικο τραγούδι, για τα τηλέφωνα που μας κρατούν δυνατούς! Γράψε αυτόν τον κωδικό, μη τον αφήσεις να γλιστρήσει, το IMEI σου είναι ο ψηφιακός σου οδηγός! 🎸"
  },
  'cs': {
    voice1: "🎸 Ách první telefon kdy vyrobený, v roce 1876 ten den! Alexander Bell řekl 'Ahoj Watsone!' a historie ožila! 🎸",
    voice2: "🎸 Vánoční zvony a IMEI kouzla, patnáct číslic vypráví příběh! Od otočných telefonů po chytré telefony dnes, technologie nikdy neselže! 🎸",
    voice3: "🎸 Hvězdička-křížek-nula-šest-křížek kód, odemkni epizodu svého zařízení! Každý telefon má příběh, každé číslo vypráví o slávě! 🎸",
    voice4: "🎸 Rock and roll tato vánoční noc, IMEI čísla hoří jasně! Od prvního telefonního hovoru dodnes, technologie nám ukazuje jak! 🎸",
    voice5: "🎸 Společně zpíváme tuto rock vánoční píseň, o telefonech které nás drží silné! Napiš ten kód, nenech ho sklouznout, tvoje IMEI je tvůj digitální průvodce! 🎸"
  },
  'hu': {
    voice1: "🎸 Ó az első telefon valaha készült, 1876-ban aznap! Alexander Bell azt mondta 'Szia Watson!' és a történelem életre kelt! 🎸",
    voice2: "🎸 Karácsonyi harangok és IMEI varázslatok, tizenöt számjegy meséli a történetet! Tárcsás telefonoktól okostelefonokig ma, a technológia soha nem fog kudarcot vallani! 🎸",
    voice3: "🎸 Csillag-kettőskereszt-nulla-hat-kettőskereszt kód, nyisd ki eszközöd epizódját! Minden telefonnak van története, minden szám dicsőségről mesél! 🎸",
    voice4: "🎸 Rock and roll ez a karácsonyi éjszaka, IMEI számok fényesen égnek! Az első telefonhívástól mostanáig, a technológia megmutatja nekünk hogyan! 🎸",
    voice5: "🎸 Együtt énekeljük ezt a rock karácsonyi dalt, a telefonokról amik erősek tartanak! Írd fel azt a kódot, ne hagyd elcsúszni, az IMEI-d a digitális útmutatód! 🎸"
  },
  'ro': {
    voice1: "🎸 Oh primul telefon vreodată făcut, în 1876 în acea zi! Alexander Bell a spus 'Salut Watson!' și istoria a prins viață! 🎸",
    voice2: "🎸 Clopote de Crăciun și vrăji IMEI, cincisprezece cifre spun povestea! De la telefoane rotative la smartphone-uri astăzi, tehnologia nu va eșua niciodată! 🎸",
    voice3: "🎸 Cod stea-diez-zero-șase-diez, deblochează episodul dispozitivului tău! Fiecare telefon are o poveste, fiecare număr spune despre glorie! 🎸",
    voice4: "🎸 Rock and roll această noapte de Crăciun, numerele IMEI ard strălucitor! De la primul apel telefonic până acum, tehnologia ne arată cum! 🎸",
    voice5: "🎸 Împreună cântăm această cântare rock de Crăciun, despre telefoanele care ne țin puternici! Scrie acel cod, nu-l lăsa să alunece, IMEI-ul tău este ghidul tău digital! 🎸"
  },
  'bg': {
    voice1: "🎸 О първия телефон направен някога, през 1876 в онзи ден! Александър Бел каза 'Здравей Уотсън!' и историята оживя! 🎸",
    voice2: "🎸 Коледни камбани и IMEI магии, петнадесет цифри разказват историята! От дискови телефони до смартфони днес, технологията никога няма да се провали! 🎸",
    voice3: "🎸 Код звездичка-диез-нула-шест-диез, отключи епизода на твоето устройство! Всеки телефон има история, всяко число говори за слава! 🎸",
    voice4: "🎸 Рок енд рол тази коледна нощ, IMEI номерата горят ярко! От първия телефонен разговор до сега, технологията ни показва как! 🎸",
    voice5: "🎸 Заедно пеем тази рок коледна песен, за телефоните които ни правят силни! Запиши този код, не го оставяй да се плъзне, твоя IMEI е твоя дигитален водач! 🎸"
  },
  'hr': {
    voice1: "🎸 Oh prvi telefon ikad napravljen, 1876. godine tog dana! Alexander Bell je rekao 'Zdravo Watson!' i povijest je oživjela! 🎸",
    voice2: "🎸 Božićni zvonovi i IMEI čarolije, petnaest brojeva priča priču! Od rotacijskih telefona do pametnih telefona danas, tehnologija nikad neće podbaciti! 🎸",
    voice3: "🎸 Kod zvjezdica-taraba-nula-šest-taraba, otključaj epizodu svog uređaja! Svaki telefon ima priču, svaki broj govori o slavi! 🎸",
    voice4: "🎸 Rock and roll ova božićna noć, IMEI brojevi gore jarko! Od prvog telefonskog poziva do sada, tehnologija nam pokazuje kako! 🎸",
    voice5: "🎸 Zajedno pjevamo ovu rock božićnu pjesmu, o telefonima koji nas čine jačima! Zapiši taj kod, nemoj ga pustiti da klizne, tvoj IMEI je tvoj digitalni vodič! 🎸"
  },
  'sk': {
    voice1: "🎸 Ó prvý telefón kedy vyrobený, v roku 1876 v ten deň! Alexander Bell povedal 'Ahoj Watson!' a história ožila! 🎸",
    voice2: "🎸 Vianočné zvony a IMEI kúzla, pätnásť číslic rozpráva príbeh! Od otočných telefónov po chytré telefóny dnes, technológia nikdy nezlyhá! 🎸",
    voice3: "🎸 Hviezdička-krížik-nula-šesť-krížik kód, odomkni epizódu svojho zariadenia! Každý telefón má príbeh, každé číslo hovorí o sláve! 🎸",
    voice4: "🎸 Rock and roll táto vianočná noc, IMEI čísla horia jasno! Od prvého telefonického hovoru dodnes, technológia nám ukazuje ako! 🎸",
    voice5: "🎸 Spoločne spievame túto rock vianočnú pieseň, o telefónoch ktoré nás držia silných! Napíš ten kód, nenechaj ho skĺznuť, tvoje IMEI je tvoj digitálny sprievodca! 🎸"
  },
  'pl': {
    voice1: "🎸 O pierwszy telefon kiedykolwiek stworzony, w 1876 roku tego dnia! Alexander Bell powiedział 'Cześć Watson!' i historia ożyła! 🎸",
    voice2: "🎸 Świąteczne dzwony i IMEI czary, piętnaście cyfr opowiada historię! Od telefonów obrotowych po smartfony dzisiaj, technologia nigdy nie zawiedzie! 🎸",
    voice3: "🎸 Kod gwiazdka-hash-zero-sześć-hash, odblokuj epizod swojego urządzenia! Każdy telefon ma historię, każda liczba mówi o chwale! 🎸",
    voice4: "🎸 Rock and roll tej świątecznej nocy, numery IMEI płoną jasno! Od pierwszej rozmowy telefonicznej do teraz, technologia pokazuje nam jak! 🎸",
    voice5: "🎸 Razem śpiewamy tę rockową świąteczną piosenkę, o telefonach które trzymają nas mocnych! Zapisz ten kod, nie pozwól mu się wymknąć, twój IMEI to twój cyfrowy przewodnik! 🎸"
  },
  'tr': {
    voice1: "🎸 Oh yapılan ilk telefon, 1876'da o gün! Alexander Bell 'Merhaba Watson!' dedi ve tarih canlandı! 🎸",
    voice2: "🎸 Noel çanları ve IMEI büyüleri, on beş rakam hikayeyi anlatıyor! Döner telefonlardan günümüzün akıllı telefonlarına, teknoloji asla başarısız olmayacak! 🎸",
    voice3: "🎸 Yıldız-diyez-sıfır-altı-diyez kodu, cihazınızın bölümünün kilidini açın! Her telefonun bir hikayesi var, her sayı zaferden bahsediyor! 🎸",
    voice4: "🎸 Rock and roll bu Noel gecesi, IMEI numaraları parlak yanıyor! İlk telefon görüşmesinden şimdiye, teknoloji bize nasıl olduğunu gösteriyor! 🎸",
    voice5: "🎸 Birlikte bu rock Noel şarkısını söylüyoruz, bizi güçlü tutan telefonlar hakkında! O kodu yaz, kaymasına izin verme, IMEI'n senin dijital rehberin! 🎸"
  }
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
 * Generate generic greeting for USSD help (template-based, no personalization)
 */
export function generateGenericGreeting(language: string = 'en'): string {
  // Generic greetings in multiple languages (no location/device/time personalization)
  const greetings = {
    'en': "Welcome! I'm here to help you discover your IMEI number using USSD codes. Would you like me to guide you through the process?",
    'es': "¡Bienvenido! Estoy aquí para ayudarte a descubrir tu número IMEI usando códigos USSD. ¿Te gustaría que te guíe en el proceso?",
    'fr': "Bienvenue! Je suis ici pour vous aider à découvrir votre numéro IMEI en utilisant les codes USSD. Souhaitez-vous que je vous guide?",
    'pt': "Bem-vindo! Estou aqui para ajudá-lo a descobrir o seu número IMEI usando códigos USSD. Gostaria que eu o orientasse no processo?",
    'de': "Willkommen! Ich bin hier, um Ihnen zu helfen, Ihre IMEI-Nummer mit USSD-Codes zu entdecken. Möchten Sie, dass ich Sie durch den Prozess führe?",
    'it': "Benvenuto! Sono qui per aiutarti a scoprire il tuo numero IMEI usando i codici USSD. Vorresti che ti guidassi nel processo?",
    'ru': "Добро пожаловать! Я здесь, чтобы помочь вам найти ваш номер IMEI с помощью USSD-кодов. Хотите, чтобы я провел вас через этот процесс?",
    'zh': "欢迎！我在这里帮助您使用USSD代码找到您的IMEI号码。您想让我指导您完成这个过程吗？",
    'ja': "ようこそ！USSD コードを使用して IMEI 番号を見つけるお手伝いをします。プロセスをご案内いたしましょうか？",
    'ar': "مرحبا! أنا هنا لمساعدتك في اكتشاف رقم IMEI الخاص بك باستخدام رموز USSD. هل تريد مني أن أرشدك خلال العملية؟",
    'nl': "Welkom! Ik ben hier om je te helpen je IMEI-nummer te ontdekken met behulp van USSD-codes. Wil je dat ik je door het proces leid?",
    'pl': "Witaj! Jestem tutaj, aby pomóc Ci odkryć Twój numer IMEI za pomocą kodów USSD. Czy chciałbyś, żebym przeprowadził Cię przez ten proces?",
    'tr': "Hoş geldiniz! USSD kodları kullanarak IMEI numaranızı keşfetmenize yardımcı olmak için buradayım. Süreç boyunca size rehberlik etmemi ister misiniz?",
    'ko': "환영합니다! USSD 코드를 사용하여 IMEI 번호를 찾을 수 있도록 도와드리겠습니다. 과정을 안내해 드릴까요?",
    'hi': "स्वागत है! मैं यहाँ USSD कोड का उपयोग करके आपका IMEI नंबर खोजने में आपकी मदद करने के लिए हूँ। क्या आप चाहेंगे कि मैं आपको इस प्रक्रिया के माध्यम से मार्गदर्शन करूँ?",
    'th': "ยินดีต้อนรับ! ฉันอยู่ที่นี่เพื่อช่วยคุณค้นหาหมายเลข IMEI โดยใช้รหัส USSD คุณต้องการให้ฉันแนะนำคุณผ่านกระบวนการนี้หรือไม่?",
    'vi': "Chào mừng! Tôi ở đây để giúp bạn khám phá số IMEI của mình bằng cách sử dụng mã USSD. Bạn có muốn tôi hướng dẫn bạn qua quy trình này không?",
    'id': "Selamat datang! Saya di sini untuk membantu Anda menemukan nomor IMEI menggunakan kode USSD. Apakah Anda ingin saya memandu Anda melalui prosesnya?",
    'sv': "Välkommen! Jag är här för att hjälpa dig upptäcka ditt IMEI-nummer med hjälp av USSD-koder. Vill du att jag ska guida dig genom processen?",
    'no': "Velkommen! Jeg er her for å hjelpe deg med å oppdage IMEI-nummeret ditt ved hjelp av USSD-koder. Vil du at jeg skal veilede deg gjennom prosessen?",
    'da': "Velkommen! Jeg er her for at hjælpe dig med at opdage dit IMEI-nummer ved hjælp af USSD-koder. Vil du have, at jeg guider dig gennem processen?",
    'fi': "Tervetuloa! Olen täällä auttamassa sinua löytämään IMEI-numerosi USSD-koodien avulla. Haluaisitko, että opastaisin sinut prosessin läpi?",
    'he': "ברוך הבא! אני כאן כדי לעזור לך לגלות את מספר ה-IMEI שלך באמצעות קודי USSD. האם תרצה שאדריך אותך בתהליך?",
    'el': "Καλώς ήρθατε! Είμαι εδώ για να σας βοηθήσω να ανακαλύψετε τον αριθμό IMEI σας χρησιμοποιώντας κωδικούς USSD. Θα θέλατε να σας καθοδηγήσω στη διαδικασία;",
    'cs': "Vítejte! Jsem tady, abych vám pomohl objevit vaše IMEI číslo pomocí USSD kódů. Chtěli byste, abych vás provedl procesem?",
    'hu': "Üdvözöljük! Itt vagyok, hogy segítsek felfedezni az IMEI számodat USSD kódok használatával. Szeretnéd, hogy végigvezesselek a folyamaton?",
    'ro': "Bun venit! Sunt aici să te ajut să îți descoperi numărul IMEI folosind coduri USSD. Ai dori să te ghidez prin proces?",
    'bg': "Добре дошли! Тук съм, за да ви помогна да откриете вашия IMEI номер, използвайки USSD кодове. Бихте ли искали да ви направя през процеса?",
    'hr': "Dobrodošli! Tu sam da vam pomognem otkriti vaš IMEI broj koristeći USSD kodove. Želite li da vas vodim kroz proces?",
    'sk': "Vitajte! Som tu, aby som vám pomohol objaviť vaše IMEI číslo pomocou USSD kódov. Chceli by ste, aby som vás previedol procesom?"
  };

  return greetings[language as keyof typeof greetings] || greetings['en'];
}

/**
 * Create multi-voice conversation with harmonizing and singing modes (template-based)
 */
export function createMultiVoiceConversation(
  baseText: string,
  voiceCount: number,
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
      text: generateGenericGreeting(language),
      voiceConfig: selectedVoices[0],
      timestamp: Date.now()
    });
  } else if (voiceCount === 2) {
    // Dual voice - question and answer
    messages.push({
      text: generateGenericGreeting(language),
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
      text: generateGenericGreeting(language),
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
      const harmonyContent = (HARMONIZING_CONTENT as any)[language] || HARMONIZING_CONTENT['en'];
      const locationGreeting = "Hello! ";
      
      // Voice 1 - Lead harmony with intro (multilingual)
      messages.push({
        text: `${locationGreeting}Let us harmonize to help you discover your IMEI! ${harmonyContent.voice1}`,
        voiceConfig: selectedVoices[0], // Lead harmony
        timestamp: Date.now(),
        isHarmonizing: true
      });
      
      // Voice 2 - Alto harmony with USSD explanation (multilingual)
      messages.push({
        text: harmonyContent.voice2,
        voiceConfig: selectedVoices[1], // Alto harmony
        timestamp: Date.now() + 1000,
        isHarmonizing: true
      });
      
      // Voice 3 - Tenor harmony with device compatibility (multilingual)
      messages.push({
        text: harmonyContent.voice3,
        voiceConfig: selectedVoices[2], // Tenor harmony
        timestamp: Date.now() + 2000,
        isHarmonizing: true
      });
      
      // Voice 4 - Bass harmony with final instructions (multilingual)
      messages.push({
        text: harmonyContent.voice4,
        voiceConfig: selectedVoices[3], // Bass harmony
        timestamp: Date.now() + 3000,
        isHarmonizing: true
      });
      
    } else {
      // Original harmonizing for non-USSD help
      messages.push({
        text: "Welcome to our harmonized IMEI discovery experience!",
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
      const rockContent = (CHRISTMAS_ROCK_CONTENT as any)[language] || CHRISTMAS_ROCK_CONTENT['en'];
      const locationGreeting = "Hello friends! ";
      
      // Voice 1 - Lead singer (multilingual)
      messages.push({
        text: `${locationGreeting}We're singing about phones! ${rockContent.voice1}`,
        voiceConfig: selectedVoices[0],
        timestamp: Date.now(),
        isSinging: true
      });
      
      // Voice 2 - About phone technology (multilingual)
      messages.push({
        text: rockContent.voice2,
        voiceConfig: selectedVoices[1],
        timestamp: Date.now() + 1000,
        isSinging: true
      });
      
      // Voice 3 - About USSD codes (multilingual)
      messages.push({
        text: rockContent.voice3,
        voiceConfig: selectedVoices[2],
        timestamp: Date.now() + 2000,
        isSinging: true
      });
      
      // Voice 4 - Rock and roll theme (multilingual)
      messages.push({
        text: rockContent.voice4,
        voiceConfig: selectedVoices[3],
        timestamp: Date.now() + 3000,
        isSinging: true
      });
      
      // Voice 5 - Final rock anthem (multilingual)
      messages.push({
        text: rockContent.voice5,
        voiceConfig: selectedVoices[4], // Rock lead singer
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
        text: "🎸 Welcome to the IMEI Rock Experience! 🎸",
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
 * Get USSD code instructions in specified language (generic template)
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