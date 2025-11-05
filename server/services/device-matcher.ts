// Device model to TAC matching service

export interface DeviceMatch {
  found: boolean;
  tac?: string;
  deviceInfo?: {
    make: string;
    model: string;
    year?: number;
    modelNumber?: string;
  };
}

// Known device models and their TACs
const DEVICE_MODEL_TO_TAC: Record<string, string> = {
  // Apple iPhones
  "iPhone 14 Pro": "01326600",
  "iPhone 15": "01040000",
  "iPhone 15 Pro": "35940110",
  "iPhone 16 Pro": "35940210",
  
  // Samsung Galaxy
  "Galaxy S23": "35216411",
  "Galaxy S23 Ultra": "35216411",
  "Galaxy S24": "35932811",
  "Galaxy S24 Ultra": "35932811",
  
  // Google Pixel
  "Pixel 8": "35596524",
  "Pixel 8 Pro": "35596523",
  "Pixel 10": "35448766",
  "Pixel 10 Pro": "35448766",
  
  // OnePlus
  "OnePlus 11": "86178305",
  "OnePlus 11 Pro": "86178305",
};

// Fuzzy matching for device models
const DEVICE_MODEL_PATTERNS: Array<{ pattern: RegExp, tac: string, make: string, model: string }> = [
  // iPhone patterns
  { pattern: /iPhone\s*16\s*Pro/i, tac: "35940210", make: "Apple", model: "iPhone 16 Pro" },
  { pattern: /iPhone\s*15\s*Pro/i, tac: "35940110", make: "Apple", model: "iPhone 15 Pro" },
  { pattern: /iPhone\s*15/i, tac: "01040000", make: "Apple", model: "iPhone 15" },
  { pattern: /iPhone\s*14\s*Pro/i, tac: "01326600", make: "Apple", model: "iPhone 14 Pro" },
  
  // Samsung patterns
  { pattern: /Galaxy\s*S24\s*Ultra/i, tac: "35932811", make: "Samsung", model: "Galaxy S24 Ultra" },
  { pattern: /Galaxy\s*S24/i, tac: "35932811", make: "Samsung", model: "Galaxy S24" },
  { pattern: /Galaxy\s*S23\s*Ultra/i, tac: "35216411", make: "Samsung", model: "Galaxy S23 Ultra" },
  { pattern: /Galaxy\s*S23/i, tac: "35216411", make: "Samsung", model: "Galaxy S23" },
  
  // Google Pixel patterns
  { pattern: /Pixel\s*10\s*Pro/i, tac: "35448766", make: "Google", model: "Pixel 10 Pro" },
  { pattern: /Pixel\s*10/i, tac: "35448766", make: "Google", model: "Pixel 10" },
  { pattern: /Pixel\s*8\s*Pro/i, tac: "35596523", make: "Google", model: "Pixel 8 Pro" },
  { pattern: /Pixel\s*8/i, tac: "35596524", make: "Google", model: "Pixel 8" },
  
  // OnePlus patterns
  { pattern: /OnePlus\s*11/i, tac: "86178305", make: "OnePlus", model: "OnePlus 11" },
];

/**
 * Match device model string to TAC
 * @param deviceModel - Device model string from user agent or manual input
 * @returns DeviceMatch with TAC and device info if found
 */
export function matchDeviceToTAC(deviceModel: string): DeviceMatch {
  if (!deviceModel) {
    return { found: false };
  }

  // Try exact match first
  const exactTac = DEVICE_MODEL_TO_TAC[deviceModel];
  if (exactTac) {
    return {
      found: true,
      tac: exactTac,
      deviceInfo: {
        make: deviceModel.includes("iPhone") || deviceModel.includes("iPad") ? "Apple" 
          : deviceModel.includes("Galaxy") ? "Samsung"
          : deviceModel.includes("Pixel") ? "Google"
          : deviceModel.includes("OnePlus") ? "OnePlus"
          : "Unknown",
        model: deviceModel,
      }
    };
  }

  // Try pattern matching
  for (const { pattern, tac, make, model } of DEVICE_MODEL_PATTERNS) {
    if (pattern.test(deviceModel)) {
      return {
        found: true,
        tac,
        deviceInfo: {
          make,
          model,
        }
      };
    }
  }

  return { found: false };
}

/**
 * Get example IMEI from TAC (for testing purposes)
 * @param tac - 8-digit TAC code
 * @returns Full 15-digit IMEI example
 */
export function getExampleIMEIFromTAC(tac: string): string {
  // Generate a valid IMEI from TAC by adding serial number and check digit
  // Format: TAC (8) + Serial (6) + Check (1) = 15 digits
  const serial = "801234"; // Example serial number
  const imeiWithoutCheck = tac + serial;
  
  // Calculate Luhn check digit
  let sum = 0;
  for (let i = imeiWithoutCheck.length - 1; i >= 0; i--) {
    let digit = parseInt(imeiWithoutCheck[i]);
    if ((imeiWithoutCheck.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return imeiWithoutCheck + checkDigit;
}
