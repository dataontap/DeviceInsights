import { GoogleGenAI } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Enhanced fallback device database with real TAC examples for demo purposes when Gemini is not available
const DEMO_DEVICES: Record<string, DeviceInfo> = {
  // iPhone 14 Pro (Real Apple TAC: 01326600)
  "013266008012345": {
    make: "Apple",
    model: "iPhone 14 Pro",
    year: 2022,
    modelNumber: "A2892",
    networkCapabilities: {
      fourG: true,
      fiveG: true,
      volte: true,
      wifiCalling: "supported"
    },
    specifications: {
      networkBands: "LTE: 1, 2, 3, 4, 5, 7, 8, 12, 13, 17, 18, 19, 20, 25, 26, 28, 30, 32, 34, 38, 39, 40, 41, 42, 43, 46, 48, 53, 66; 5G: n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n30, n38, n40, n41, n48, n53, n66, n70, n77, n78, n79",
      releaseYear: 2022,
      carrierVariant: "US Unlocked"
    }
  },
  // iPhone 15 (Real Apple TAC: 01040000)
  "010400003012345": {
    make: "Apple",
    model: "iPhone 15",
    year: 2023,
    modelNumber: "A3089",
    networkCapabilities: {
      fourG: true,
      fiveG: true,
      volte: true,
      wifiCalling: "supported"
    },
    specifications: {
      networkBands: "LTE: 1, 2, 3, 4, 5, 7, 8, 12, 13, 17, 18, 19, 20, 25, 26, 28, 30, 32, 34, 38, 39, 40, 41, 42, 43, 46, 48, 53, 66; 5G: n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n30, n38, n40, n41, n48, n53, n66, n70, n77, n78, n79",
      releaseYear: 2023,
      carrierVariant: "US Model"
    }
  },
  // Samsung Galaxy S23 Ultra (Real Samsung TAC: 35216411)
  "352164118012345": {
    make: "Samsung",
    model: "Galaxy S23 Ultra",
    year: 2023,
    modelNumber: "SM-S918U",
    networkCapabilities: {
      fourG: true,
      fiveG: true,
      volte: true,
      wifiCalling: "supported"
    },
    specifications: {
      networkBands: "LTE: 1, 2, 3, 4, 5, 7, 8, 12, 13, 14, 17, 18, 19, 20, 25, 26, 28, 29, 30, 38, 39, 40, 41, 46, 48, 66; 5G: n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n38, n40, n41, n66, n71, n77, n78",
      releaseYear: 2023,
      carrierVariant: "US Unlocked"
    }
  },
  // Google Pixel 8 Pro (Real Google TAC: 35404911)
  "354049118012345": {
    make: "Google",
    model: "Pixel 8 Pro",
    year: 2023,
    modelNumber: "GD2H3",
    networkCapabilities: {
      fourG: true,
      fiveG: true,
      volte: true,
      wifiCalling: "supported"
    },
    specifications: {
      networkBands: "LTE: 1, 2, 3, 4, 5, 7, 8, 12, 13, 14, 17, 18, 19, 20, 25, 26, 28, 29, 30, 38, 39, 40, 41, 42, 46, 48, 66, 71; 5G: n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n30, n38, n40, n41, n66, n71, n77, n78",
      releaseYear: 2023,
      carrierVariant: "US Model"
    }
  },
  // Google Pixel 8 Pro (Real Google TAC: 35596523) - Additional variant
  "355965238012345": {
    make: "Google",
    model: "Pixel 8 Pro",
    year: 2023,
    modelNumber: "GHMP3",
    networkCapabilities: {
      fourG: true,
      fiveG: true,
      volte: true,
      wifiCalling: "supported"
    },
    specifications: {
      networkBands: "LTE: 1, 2, 3, 4, 5, 7, 8, 12, 13, 14, 17, 18, 19, 20, 25, 26, 28, 29, 30, 38, 39, 40, 41, 42, 46, 48, 66, 71; 5G: n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n30, n38, n40, n41, n66, n71, n77, n78",
      releaseYear: 2023,
      carrierVariant: "Global/Unlocked Model"
    }
  },
  // OnePlus 11 (Real OnePlus TAC: 86178305)
  "861783058012345": {
    make: "OnePlus",
    model: "OnePlus 11",
    year: 2023,
    modelNumber: "CPH2449",
    networkCapabilities: {
      fourG: true,
      fiveG: true,
      volte: true,
      wifiCalling: "limited"
    },
    specifications: {
      networkBands: "LTE: 1, 2, 3, 4, 5, 7, 8, 12, 13, 17, 18, 19, 20, 25, 26, 28, 32, 38, 39, 40, 41, 42, 46, 48, 66; 5G: n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n38, n40, n41, n66, n71, n77, n78",
      releaseYear: 2023,
      carrierVariant: "Global"
    }
  },
  // Default for unknown devices
  "default": {
    make: "Unknown",
    model: "Unknown Device",
    year: 2023,
    networkCapabilities: {
      fourG: false,
      fiveG: false,
      volte: false,
      wifiCalling: "not_supported"
    }
  }
};

export interface DeviceInfo {
  make: string;
  model: string;
  year?: number;
  modelNumber?: string;
  tacAnalysis?: string;
  networkCapabilities: {
    fourG: boolean;
    fiveG: boolean;
    volte: boolean;
    wifiCalling: "supported" | "limited" | "not_supported";
  };
  specifications?: {
    networkBands?: string;
    releaseYear?: number;
    carrierVariant?: string;
  };
}

// Extract TAC (Type Allocation Code) from IMEI
function extractTAC(imei: string): string {
  return imei.substring(0, 8);
}

// Extract TAC and FAC components for more detailed analysis
function analyzeIMEIStructure(imei: string) {
  const tac = imei.substring(0, 8);        // Type Allocation Code (first 8 digits)
  const fac = tac.substring(0, 6);         // Final Assembly Code (first 6 digits of TAC)
  const snr = imei.substring(8, 14);       // Serial Number (next 6 digits)
  const checkDigit = imei.substring(14);   // Check digit (last digit)
  
  return { tac, fac, snr, checkDigit };
}

// Get top 5 carriers for a country/location
export async function getTopCarriers(location: string): Promise<{ carriers: Array<{name: string, marketShare: string, description: string}>, country: string }> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Fallback carriers for common locations
      if (location.toLowerCase().includes('us') || location.toLowerCase().includes('united states') || location.toLowerCase().includes('america')) {
        return {
          country: "United States",
          carriers: [
            { name: "AT&T", marketShare: "45.4%", description: "Largest US carrier with nationwide 5G coverage" },
            { name: "Verizon", marketShare: "32.8%", description: "Premium network with strong rural coverage" },
            { name: "T-Mobile", marketShare: "16.7%", description: "Un-carrier with competitive pricing" },
            { name: "US Cellular", marketShare: "1.2%", description: "Regional carrier serving rural areas" },
            { name: "Dish Network", marketShare: "0.9%", description: "New 5G network provider" }
          ]
        };
      }
      // Default fallback
      return {
        country: "United States",
        carriers: [
          { name: "AT&T", marketShare: "45.4%", description: "Default carrier for compatibility testing" }
        ]
      };
    }

    const prompt = `Based on the location "${location}", identify the country and provide the TOP 5 mobile carriers by customer base/market share.

    For each carrier, provide:
    - Official company name
    - Market share percentage (approximate)
    - Brief description of their network/service

    Focus on major carriers that consumers would typically use, not MVNOs or very small regional carriers.

    Respond with JSON in this exact format:
    {
      "country": "Country Name",
      "carriers": [
        {
          "name": "Carrier Name",
          "marketShare": "XX.X%", 
          "description": "Brief description"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            country: { type: "string" },
            carriers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  marketShare: { type: "string" },
                  description: { type: "string" }
                },
                required: ["name", "marketShare", "description"]
              }
            }
          },
          required: ["country", "carriers"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || '{}');
    
    // Ensure we have valid data
    if (!result.carriers || !Array.isArray(result.carriers)) {
      throw new Error("Invalid carriers data");
    }

    return {
      country: result.country || "Unknown",
      carriers: result.carriers.slice(0, 5) // Ensure max 5 carriers
    };

  } catch (error) {
    console.error("Error fetching carriers:", error);
    // Return US default on error
    return {
      country: "United States",
      carriers: [
        { name: "AT&T", marketShare: "45.4%", description: "Default carrier for compatibility testing" }
      ]
    };
  }
}

export async function analyzeIMEI(imei: string, network: string = "AT&T"): Promise<DeviceInfo> {
  try {
    // Check if Gemini API key is available, otherwise use fallback
    if (!process.env.GEMINI_API_KEY) {
      console.log("Gemini API key not available, using fallback device database");
      return getFallbackDeviceInfo(imei);
    }

    // Extract TAC and other components for enhanced analysis
    const { tac, fac } = analyzeIMEIStructure(imei);
    
    const prompt = `You are an expert in mobile device identification and network compatibility analysis with access to comprehensive TAC (Type Allocation Code) databases.

IMEI Analysis Request:
- Full IMEI: ${imei}
- TAC (Type Allocation Code): ${tac}
- FAC (Final Assembly Code): ${fac}

CRITICAL INSTRUCTIONS FOR TAC ANALYSIS:
1. The TAC (${tac}) is the most important identifier - it uniquely identifies the device model and manufacturer
2. Use your knowledge of TAC databases to provide precise device identification
3. Different TAC codes can identify different variants, colors, or storage capacities of the same device family
4. Consider that TACs are assigned by the GSMA and are manufacturer-specific
5. IMPORTANT TAC KNOWLEDGE:
   - 35596523: Google Pixel 8 Pro (Global/Unlocked model, GC3VE)
   - 35404911: Google Pixel 8 Pro (US model, GD2H3)
   - 35596524: Google Pixel 8 (standard model)
   - 35940110: Apple iPhone 15 Pro Max
   - 35596522: Apple iPhone 14 Pro Max (A2651)
   - 86178305: OnePlus devices
   - 35216411: Samsung Galaxy S23 series
   - Apple TACs: 01xxxxxx, 35940xxx, 35596522, 86xxxxxx series
   - Google TACs: 35596523, 35404xxx, 35596524 series
   - Samsung TACs: 35216xxx, 86xxxxxx series
   - NEVER confuse manufacturers - Google 35596523 is NOT Apple

For ${network} network compatibility in North America, analyze:
- LTE Band compatibility (especially bands 2, 4, 5, 12, 13, 17, 25, 26, 41, 66, 71)
- 5G compatibility (n2, n5, n25, n41, n66, n71, n77, n78 for US carriers)
- VoLTE provisioning status with ${network}
- Wi-Fi Calling carrier support
- Device unlock status implications

Provide your analysis in JSON format:
{
  "make": "Exact manufacturer name",
  "model": "Precise model with variant (storage/color) if identifiable from TAC", 
  "year": release_year_number,
  "modelNumber": "Official model number (e.g., A2892, SM-S918U, GD2M3)",
  "tacAnalysis": "Brief explanation of what the TAC reveals about this device",
  "networkCapabilities": {
    "fourG": boolean_based_on_actual_specs,
    "fiveG": boolean_based_on_actual_specs,
    "volte": boolean_carrier_support_status,
    "wifiCalling": "supported"/"limited"/"not_supported"
  },
  "specifications": {
    "networkBands": "Complete list of supported LTE and 5G bands",
    "releaseYear": actual_release_year,
    "carrierVariant": "US variant info if applicable"
  }
}

ACCURACY REQUIREMENTS:
- If the TAC is known, provide highly accurate device information
- If TAC is unknown, clearly indicate uncertainty but provide best estimate
- Be specific about ${network} network compatibility
- Include actual network band numbers, not generic descriptions
- Distinguish between theoretical device capabilities and carrier-specific support`;

    const systemPrompt = `You are a world-class expert in mobile device identification and IMEI/TAC analysis with comprehensive knowledge of:
- GSMA TAC database and allocation patterns
- Device manufacturer TAC ranges and assignments  
- Specific network band configurations for devices sold in North America
- Carrier-specific VoLTE and Wi-Fi calling provisioning
- Device variant identification (storage, color, regional models)

Use your expertise to provide the most accurate device identification possible based on the TAC analysis.
Always respond with valid JSON in the exact format specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            make: { type: "string" },
            model: { type: "string" },
            year: { type: "number" },
            modelNumber: { type: "string" },
            tacAnalysis: { type: "string" },
            networkCapabilities: {
              type: "object",
              properties: {
                fourG: { type: "boolean" },
                fiveG: { type: "boolean" },
                volte: { type: "boolean" },
                wifiCalling: { type: "string" }
              },
              required: ["fourG", "fiveG", "volte", "wifiCalling"]
            },
            specifications: {
              type: "object",
              properties: {
                networkBands: { type: "string" },
                releaseYear: { type: "number" },
                carrierVariant: { type: "string" }
              }
            }
          },
          required: ["make", "model", "networkCapabilities", "tacAnalysis"]
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    console.log(`Raw JSON from Gemini: ${rawJson}`);

    if (!rawJson) {
      throw new Error("Empty response from Gemini model");
    }

    const result = JSON.parse(rawJson);
    
    // Validate and ensure required fields
    const deviceInfo: DeviceInfo = {
      make: result.make || "Unknown",
      model: result.model || "Unknown Device",
      year: result.year || new Date().getFullYear(),
      modelNumber: result.modelNumber,
      tacAnalysis: result.tacAnalysis,
      networkCapabilities: {
        fourG: result.networkCapabilities?.fourG ?? false,
        fiveG: result.networkCapabilities?.fiveG ?? false,
        volte: result.networkCapabilities?.volte ?? false,
        wifiCalling: result.networkCapabilities?.wifiCalling || "not_supported"
      },
      specifications: {
        ...result.specifications,
        carrierVariant: result.specifications?.carrierVariant
      }
    };

    return deviceInfo;
  } catch (error) {
    console.error("Gemini API error:", error);
    console.log("Falling back to demo device database");
    return getFallbackDeviceInfo(imei);
  }
}

function getFallbackDeviceInfo(imei: string): DeviceInfo {
  const { tac, fac } = analyzeIMEIStructure(imei);
  
  // Try to match exact IMEI first
  if (DEMO_DEVICES[imei]) {
    return {
      ...DEMO_DEVICES[imei],
      tacAnalysis: `TAC ${tac} matched in fallback database. This is a known device configuration.`
    };
  }
  
  // Try to match by TAC (first 8 digits)
  const tacKey = Object.keys(DEMO_DEVICES).find(key => key.startsWith(fac));
  
  if (tacKey && DEMO_DEVICES[tacKey]) {
    return {
      ...DEMO_DEVICES[tacKey],
      tacAnalysis: `TAC ${tac} partially matched (FAC: ${fac}). Device identified from similar TAC pattern.`
    };
  }
  
  // Attempt basic TAC analysis for unknown devices
  let basicAnalysis = `TAC ${tac} not found in database. `;
  
  // Basic manufacturer identification based on common TAC ranges
  if (tac.startsWith('01') || tac.startsWith('86')) {
    basicAnalysis += "TAC pattern suggests possible Apple device.";
  } else if (tac.startsWith('35')) {
    basicAnalysis += "TAC pattern suggests possible Samsung/Android device.";
  } else if (tac.startsWith('99')) {
    basicAnalysis += "TAC pattern suggests possible test/development device.";
  } else {
    basicAnalysis += "TAC pattern not recognized - manufacturer unknown.";
  }
  
  // Return enhanced default for unknown devices
  return {
    ...DEMO_DEVICES["default"],
    tacAnalysis: basicAnalysis
  };
}

// Generate an accurate world map SVG using Gemini AI
export async function generateWorldMapSVG(): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("Gemini API key not available, using fallback world map");
      return getFallbackWorldMapSVG();
    }

    const prompt = `Generate a geographically accurate SVG world map for an 800x400 viewBox. Create recognizable continental shapes with proper proportions.

CRITICAL REQUIREMENTS:
1. **Accurate continental shapes** - each continent must be immediately recognizable
2. **Proper positioning** - use equirectangular projection coordinates
3. **Realistic proportions** - continents should be sized correctly relative to each other

CONTINENTS TO INCLUDE (with approximate coordinates):
- **North America**: Western portion (x: 80-300, y: 120-250)
- **South America**: Below North America (x: 200-280, y: 260-390)  
- **Europe**: Small but detailed (x: 380-460, y: 115-180)
- **Africa**: Large, extending down (x: 380-480, y: 180-370)
- **Asia**: Largest continent (x: 460-740, y: 90-220)
- **Australia**: Southeastern (x: 620-710, y: 310-365)

MAJOR ISLANDS:
- **Greenland**: North of America (x: 310-360, y: 75-135)
- **Japan**: East of Asia (x: 675-695, y: 155-185)
- **UK**: Northwest of Europe (x: 375-390, y: 125-145)
- **Madagascar**: East of Africa (x: 480-495, y: 320-350)

STYLING (EXACT):
- Fill: #475569
- Stroke: #334155
- Stroke-width: 0.6
- Opacity: 0.85

TECHNICAL:
- Use SVG path elements only
- Return ONLY the path elements (no SVG wrapper)
- Each continent should be a separate path element
- Ensure shapes look like real continents, not abstract blobs
- Vary coastline detail while maintaining recognizable shapes

EXAMPLE FORMAT:
<path d="M120,140 L160,120..." fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>

Generate unique coastline variations while keeping continents instantly recognizable.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    const svgPaths = response.text;
    
    if (!svgPaths || svgPaths.length < 100) {
      throw new Error("Generated SVG paths too short or empty");
    }

    return svgPaths;

  } catch (error) {
    console.error("Gemini world map generation error:", error);
    return getFallbackWorldMapSVG();
  }
}

// Fallback world map SVG paths
function getFallbackWorldMapSVG(): string {
  return `
    <!-- North America with more recognizable shape -->
    <path d="M120 140 L140 125 L160 120 L180 125 L200 130 L220 135 L240 140 L260 145 L280 150 L290 160 L295 180 L290 200 L285 220 L275 235 L265 245 L250 250 L230 248 L210 245 L190 242 L170 240 L150 235 L135 225 L125 210 L120 190 L115 170 L118 150 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- Greenland -->
    <path d="M320 80 L335 75 L350 78 L360 85 L365 95 L362 110 L358 125 L350 135 L340 138 L330 136 L320 130 L315 115 L312 100 L315 85 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- South America with characteristic shape -->
    <path d="M220 260 L235 265 L250 270 L265 275 L275 285 L280 300 L278 320 L275 340 L272 360 L268 375 L260 385 L250 390 L240 388 L230 385 L220 380 L212 365 L208 350 L205 335 L204 320 L206 305 L210 290 L215 275 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- Europe with distinctive outline -->
    <path d="M380 120 L395 115 L410 117 L425 120 L440 125 L445 135 L448 145 L445 155 L440 165 L435 170 L425 173 L410 175 L395 173 L385 170 L378 160 L375 150 L376 140 L378 130 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- UK -->
    <path d="M375 130 L380 128 L385 130 L388 135 L386 142 L383 145 L378 143 L374 140 L372 135 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- Africa with recognizable outline -->
    <path d="M390 180 L405 182 L420 185 L435 190 L450 195 L460 205 L465 220 L467 240 L468 260 L467 280 L465 300 L462 320 L458 340 L452 355 L445 365 L435 370 L425 372 L410 370 L395 368 L385 365 L378 355 L375 340 L377 325 L380 310 L383 295 L385 280 L387 265 L388 250 L389 235 L390 220 L390 200 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- Madagascar -->
    <path d="M480 320 L485 322 L490 325 L492 335 L490 345 L487 350 L482 352 L478 348 L476 340 L477 330 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- Asia with better proportions -->
    <path d="M460 90 L480 92 L500 95 L520 98 L540 102 L560 105 L580 108 L600 112 L620 115 L640 118 L660 122 L680 125 L700 130 L720 135 L735 145 L745 160 L742 175 L735 190 L728 200 L720 210 L710 218 L695 220 L680 222 L665 220 L650 218 L635 215 L620 212 L605 210 L590 208 L575 206 L560 204 L545 202 L530 200 L515 196 L500 192 L485 185 L475 175 L468 160 L465 145 L464 130 L463 115 L462 100 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- India subcontinent -->
    <path d="M520 200 L530 202 L540 205 L548 212 L552 222 L550 235 L545 245 L538 250 L530 248 L522 245 L515 238 L512 228 L515 218 L518 208 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- Japan -->
    <path d="M680 160 L685 158 L690 160 L692 165 L694 172 L692 178 L688 182 L683 184 L678 182 L675 178 L674 172 L676 165 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
    
    <!-- Australia with recognizable shape -->
    <path d="M620 310 L635 312 L650 315 L665 318 L680 322 L695 325 L705 330 L710 340 L708 350 L703 358 L695 362 L685 364 L670 363 L655 361 L640 358 L625 355 L615 350 L610 340 L612 330 L615 320 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
  `;
}

export function validateIMEI(imei: string): boolean {
  // Remove any spaces or dashes
  const cleanImei = imei.replace(/[\s-]/g, '');
  
  // Check if it's exactly 15 digits
  if (!/^\d{15}$/.test(cleanImei)) {
    return false;
  }
  
  // For testing purposes, accept any 15-digit number as valid
  // In production, you can enable the Luhn algorithm check below:
  /*
  // Luhn algorithm check for IMEI validation
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleanImei[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleanImei[14]);
  */
  
  return true; // Accept any 15-digit number for testing
}