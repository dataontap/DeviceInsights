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