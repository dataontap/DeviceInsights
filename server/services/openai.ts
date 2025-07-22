import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

// Fallback device database for demo purposes when OpenAI is not available
const DEMO_DEVICES: Record<string, DeviceInfo> = {
  // iPhone devices (TAC starting with 01)
  "013456789012345": {
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
      releaseYear: 2022
    }
  },
  // Samsung devices (TAC starting with 35)
  "358456789012345": {
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
      releaseYear: 2023
    }
  },
  // Google Pixel (TAC starting with 35)
  "357456789012345": {
    make: "Google",
    model: "Pixel 8 Pro",
    year: 2023,
    modelNumber: "GP-GAD",
    networkCapabilities: {
      fourG: true,
      fiveG: true,
      volte: true,
      wifiCalling: "supported"
    },
    specifications: {
      networkBands: "LTE: 1, 2, 3, 4, 5, 7, 8, 12, 13, 14, 17, 18, 19, 20, 25, 26, 28, 29, 30, 38, 39, 40, 41, 42, 46, 48, 66, 71; 5G: n1, n2, n3, n5, n7, n8, n12, n20, n25, n28, n30, n38, n40, n41, n66, n71, n77, n78",
      releaseYear: 2023
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
  networkCapabilities: {
    fourG: boolean;
    fiveG: boolean;
    volte: boolean;
    wifiCalling: "supported" | "limited" | "not_supported";
  };
  specifications?: {
    networkBands?: string;
    releaseYear?: number;
  };
}

export async function analyzeIMEI(imei: string, network: string = "AT&T"): Promise<DeviceInfo> {
  try {
    // Check if OpenAI API key is available, otherwise use fallback
    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API key not available, using fallback device database");
      return getFallbackDeviceInfo(imei);
    }

    const prompt = `You are a device identification expert with comprehensive knowledge of mobile devices and their network capabilities. 

Analyze the IMEI number: ${imei}

Based on this IMEI, identify the device and provide detailed information about its ${network} network compatibility in the US. Consider the TAC (Type Allocation Code) which is typically the first 8 digits of the IMEI.

Provide a JSON response with the following structure:
{
  "make": "Device manufacturer (e.g., Apple, Samsung, Google)",
  "model": "Specific model name (e.g., iPhone 14 Pro, Galaxy S23 Ultra)",
  "year": 2023,
  "modelNumber": "Internal model number if known",
  "networkCapabilities": {
    "fourG": true/false,
    "fiveG": true/false,
    "volte": true/false,
    "wifiCalling": "supported"/"limited"/"not_supported"
  },
  "specifications": {
    "networkBands": "List of supported LTE/5G bands",
    "releaseYear": 2023
  }
}

Focus specifically on ${network} network compatibility in the United States. Be accurate about network capabilities - VoLTE and WiFi Calling support can vary even within the same device family based on carrier provisioning.

If the IMEI cannot be identified or appears invalid, still provide your best analysis based on the TAC portion.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert mobile device analyst specializing in network compatibility and IMEI analysis. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Lower temperature for more consistent results
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and ensure required fields
    const deviceInfo: DeviceInfo = {
      make: result.make || "Unknown",
      model: result.model || "Unknown Device",
      year: result.year || new Date().getFullYear(),
      modelNumber: result.modelNumber,
      networkCapabilities: {
        fourG: result.networkCapabilities?.fourG ?? false,
        fiveG: result.networkCapabilities?.fiveG ?? false,
        volte: result.networkCapabilities?.volte ?? false,
        wifiCalling: result.networkCapabilities?.wifiCalling || "not_supported"
      },
      specifications: result.specifications
    };

    return deviceInfo;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to analyze IMEI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getFallbackDeviceInfo(imei: string): DeviceInfo {
  // Try to match exact IMEI first
  if (DEMO_DEVICES[imei]) {
    return DEMO_DEVICES[imei];
  }
  
  // Try to match by TAC (first 8 digits)
  const tac = imei.substring(0, 8);
  const tacKey = Object.keys(DEMO_DEVICES).find(key => key.startsWith(tac.substring(0, 6)));
  
  if (tacKey && DEMO_DEVICES[tacKey]) {
    return DEMO_DEVICES[tacKey];
  }
  
  // Return default for unknown devices
  return DEMO_DEVICES["default"];
}

export function validateIMEI(imei: string): boolean {
  // Remove any spaces or dashes
  const cleanImei = imei.replace(/[\s-]/g, '');
  
  // Check if it's exactly 15 digits
  if (!/^\d{15}$/.test(cleanImei)) {
    return false;
  }
  
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
}
