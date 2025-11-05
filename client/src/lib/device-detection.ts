// Device detection utilities for parsing User Agent and browser capabilities

export interface DeviceInfo {
  make?: string;
  model?: string;
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  connectionType?: string;
  effectiveType?: string;
}

/**
 * Parse User Agent string to extract device information
 */
export function parseUserAgent(userAgent: string = navigator.userAgent): DeviceInfo {
  const info: DeviceInfo = {};

  // Detect device make and model
  // iPhone patterns
  if (/iPhone/.test(userAgent)) {
    info.make = 'Apple';
    info.deviceType = 'mobile';
    
    // Try to extract iPhone model
    if (/iPhone\s*(\d+(?:[,\s]\d+)?)\s*Pro\s*Max/i.test(userAgent)) {
      const match = userAgent.match(/iPhone\s*(\d+(?:[,\s]\d+)?)\s*Pro\s*Max/i);
      info.model = `iPhone ${match?.[1]?.replace(',', '.')} Pro Max`;
    } else if (/iPhone\s*(\d+(?:[,\s]\d+)?)\s*Pro/i.test(userAgent)) {
      const match = userAgent.match(/iPhone\s*(\d+(?:[,\s]\d+)?)\s*Pro/i);
      info.model = `iPhone ${match?.[1]?.replace(',', '.')} Pro`;
    } else if (/iPhone\s*(\d+(?:[,\s]\d+)?)/i.test(userAgent)) {
      const match = userAgent.match(/iPhone\s*(\d+(?:[,\s]\d+)?)/i);
      info.model = `iPhone ${match?.[1]?.replace(',', '.')}`;
    } else {
      info.model = 'iPhone';
    }
  }
  // iPad patterns
  else if (/iPad/.test(userAgent)) {
    info.make = 'Apple';
    info.model = 'iPad';
    info.deviceType = 'tablet';
  }
  // Samsung Galaxy patterns
  else if (/Samsung|SM-/i.test(userAgent)) {
    info.make = 'Samsung';
    info.deviceType = 'mobile';
    
    // Try to extract Samsung model
    if (/SM-S(\d{3})/i.test(userAgent)) {
      const match = userAgent.match(/SM-S(\d{3})/i);
      info.model = `Galaxy S${match?.[1]?.substring(0, 2)}`;
    } else if (/Galaxy\s*(S\d+|Note\d+|A\d+)/i.test(userAgent)) {
      const match = userAgent.match(/Galaxy\s*(S\d+|Note\d+|A\d+)/i);
      info.model = `Galaxy ${match?.[1]}`;
    } else {
      info.model = 'Galaxy';
    }
  }
  // Google Pixel patterns
  else if (/Pixel/i.test(userAgent)) {
    info.make = 'Google';
    info.deviceType = 'mobile';
    
    if (/Pixel\s*(\d+)\s*Pro/i.test(userAgent)) {
      const match = userAgent.match(/Pixel\s*(\d+)\s*Pro/i);
      info.model = `Pixel ${match?.[1]} Pro`;
    } else if (/Pixel\s*(\d+)/i.test(userAgent)) {
      const match = userAgent.match(/Pixel\s*(\d+)/i);
      info.model = `Pixel ${match?.[1]}`;
    } else {
      info.model = 'Pixel';
    }
  }
  // OnePlus patterns
  else if (/OnePlus/i.test(userAgent)) {
    info.make = 'OnePlus';
    info.deviceType = 'mobile';
    
    if (/OnePlus\s*(\d+[T]?)/i.test(userAgent)) {
      const match = userAgent.match(/OnePlus\s*(\d+[T]?)/i);
      info.model = `OnePlus ${match?.[1]}`;
    } else {
      info.model = 'OnePlus';
    }
  }
  // Generic Android
  else if (/Android/i.test(userAgent)) {
    info.make = 'Android';
    info.deviceType = 'mobile';
    info.model = 'Device';
  }
  // Desktop/laptop detection
  else if (/Windows|Macintosh|Mac OS X|Linux/i.test(userAgent)) {
    info.deviceType = 'desktop';
    if (/Macintosh|Mac OS X/i.test(userAgent)) {
      info.make = 'Apple';
      info.model = 'Mac';
    } else if (/Windows/i.test(userAgent)) {
      info.make = 'Microsoft';
      info.model = 'Windows PC';
    } else {
      info.make = 'PC';
      info.model = 'Desktop';
    }
  }

  // Detect OS
  if (/Windows NT (\d+\.\d+)/i.test(userAgent)) {
    const match = userAgent.match(/Windows NT (\d+\.\d+)/i);
    info.osName = 'Windows';
    info.osVersion = match?.[1] || '';
  } else if (/Mac OS X (\d+[._]\d+[._]?\d*)/i.test(userAgent)) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/i);
    info.osName = 'macOS';
    info.osVersion = match?.[1]?.replace(/_/g, '.') || '';
  } else if (/Android (\d+\.\d+)/i.test(userAgent)) {
    const match = userAgent.match(/Android (\d+\.\d+)/i);
    info.osName = 'Android';
    info.osVersion = match?.[1] || '';
  } else if (/iPhone OS (\d+[._]\d+[._]?\d*)/i.test(userAgent)) {
    const match = userAgent.match(/iPhone OS (\d+[._]\d+[._]?\d*)/i);
    info.osName = 'iOS';
    info.osVersion = match?.[1]?.replace(/_/g, '.') || '';
  }

  // Detect browser
  if (/Chrome\/(\d+)/i.test(userAgent) && !/Edg/i.test(userAgent)) {
    const match = userAgent.match(/Chrome\/(\d+)/i);
    info.browserName = 'Chrome';
    info.browserVersion = match?.[1] || '';
  } else if (/Safari\/(\d+)/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    info.browserName = 'Safari';
  } else if (/Firefox\/(\d+)/i.test(userAgent)) {
    const match = userAgent.match(/Firefox\/(\d+)/i);
    info.browserName = 'Firefox';
    info.browserVersion = match?.[1] || '';
  } else if (/Edg\/(\d+)/i.test(userAgent)) {
    const match = userAgent.match(/Edg\/(\d+)/i);
    info.browserName = 'Edge';
    info.browserVersion = match?.[1] || '';
  }

  return info;
}

/**
 * Get network connection information
 */
export function getConnectionInfo(): { type?: string; effectiveType?: string; downlink?: number } {
  // @ts-ignore - NetworkInformation is experimental
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    return {};
  }

  return {
    type: connection.type, // 'wifi', 'cellular', 'ethernet', etc.
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Mbps
  };
}

/**
 * Get device info using User-Agent Client Hints API (more accurate than parsing)
 */
async function getDeviceFromClientHints(): Promise<DeviceInfo | null> {
  try {
    // Check if User-Agent Client Hints API is available
    // @ts-ignore - userAgentData is experimental
    if (!navigator.userAgentData || !navigator.userAgentData.getHighEntropyValues) {
      return null;
    }

    // Request high entropy values for detailed device info
    // @ts-ignore
    const hints = await navigator.userAgentData.getHighEntropyValues([
      'model',
      'platform',
      'platformVersion',
      'architecture',
      'bitness',
      'brands',
      'mobile'
    ]);

    console.log('Client Hints data:', hints);

    const info: DeviceInfo = {};

    // Get device type
    info.deviceType = hints.mobile ? 'mobile' : 'desktop';

    // Get make and model
    if (hints.model && hints.model !== '') {
      // Model is available (mainly on Chromium-based browsers)
      info.model = hints.model;
      
      // Try to determine make from model or platform
      if (hints.model.toLowerCase().includes('pixel')) {
        info.make = 'Google';
      } else if (hints.model.toLowerCase().includes('galaxy') || hints.model.toLowerCase().includes('sm-')) {
        info.make = 'Samsung';
      } else if (hints.model.toLowerCase().includes('iphone')) {
        info.make = 'Apple';
      } else if (hints.model.toLowerCase().includes('oneplus')) {
        info.make = 'OnePlus';
      } else if (hints.platform === 'Android') {
        info.make = 'Android';
      }
    } else if (hints.platform) {
      // Model not available, use platform info
      info.osName = hints.platform;
      if (hints.platform === 'Android') {
        info.make = 'Android';
        info.model = 'Device';
      } else if (hints.platform === 'iOS') {
        info.make = 'Apple';
        info.model = 'iPhone';
      } else if (hints.platform === 'macOS') {
        info.make = 'Apple';
        info.model = 'Mac';
      } else if (hints.platform === 'Windows') {
        info.make = 'Microsoft';
        info.model = 'Windows PC';
      }
    }

    // Get OS version
    if (hints.platformVersion) {
      info.osVersion = hints.platformVersion;
    }

    // Get browser info from brands
    if (hints.brands && Array.isArray(hints.brands)) {
      for (const brand of hints.brands) {
        if (brand.brand === 'Google Chrome') {
          info.browserName = 'Chrome';
          info.browserVersion = brand.version;
          break;
        } else if (brand.brand === 'Microsoft Edge') {
          info.browserName = 'Edge';
          info.browserVersion = brand.version;
          break;
        }
      }
    }

    console.log('Parsed device from Client Hints:', info);
    return info;
  } catch (error) {
    console.log('Client Hints not available or failed:', error);
    return null;
  }
}

/**
 * Get comprehensive device detection data
 */
export async function getDeviceDetectionData(): Promise<{
  device: DeviceInfo;
  connection: ReturnType<typeof getConnectionInfo>;
  location?: { latitude: number; longitude: number };
}> {
  // Try Client Hints API first (more accurate)
  let device = await getDeviceFromClientHints();
  
  // Fall back to user agent parsing if Client Hints not available
  if (!device || (!device.make && !device.model)) {
    device = parseUserAgent();
  }
  
  const connection = getConnectionInfo();
  
  // Try to get location if permission granted
  let location: { latitude: number; longitude: number } | undefined;
  
  try {
    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 60000,
        });
      });
      
      location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }
  } catch (error) {
    // Location permission denied or not available - that's okay
    console.log('Location not available:', error);
  }

  return {
    device,
    connection,
    location,
  };
}
