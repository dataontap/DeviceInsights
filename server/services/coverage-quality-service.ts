import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CoverageQualityMetrics {
  carrier: string;
  location: string;
  technologies: {
    threeG?: {
      available: boolean;
      signalStrength: number;
      downloadSpeed: string;
      uploadSpeed: string;
      latency: string;
      quality: "excellent" | "good" | "fair" | "poor" | "no_coverage";
    };
    fourG?: {
      available: boolean;
      signalStrength: number;
      downloadSpeed: string;
      uploadSpeed: string;
      latency: string;
      quality: "excellent" | "good" | "fair" | "poor" | "no_coverage";
    };
    fiveG?: {
      available: boolean;
      signalStrength: number;
      downloadSpeed: string;
      uploadSpeed: string;
      latency: string;
      quality: "excellent" | "good" | "fair" | "poor" | "no_coverage";
    };
  };
  overallQuality: "excellent" | "good" | "fair" | "poor" | "no_coverage";
  lastUpdated: string;
}

export interface CarrierQualityMap {
  [carrier: string]: CoverageQualityMetrics;
}

export async function getCoverageQualityForCarriers(
  carriers: string[],
  location: string,
  coordinates?: { lat: number; lng: number }
): Promise<CarrierQualityMap> {
  try {
    const locationDesc = coordinates 
      ? `${location} (lat: ${coordinates.lat}, lng: ${coordinates.lng})`
      : location;

    const prompt = `You are a network coverage analyst. Provide realistic network quality metrics for the following carriers in ${locationDesc}.

For each carrier (${carriers.join(", ")}), provide:
1. 3G availability and quality metrics (if available in the area)
2. 4G/LTE availability and quality metrics
3. 5G availability and quality metrics (if available)

For each technology, include:
- Signal strength (0-100, where 100 is excellent)
- Download speed (e.g., "5-10 Mbps", "50-100 Mbps")
- Upload speed (e.g., "2-5 Mbps", "20-40 Mbps")
- Latency (e.g., "50-80ms", "20-30ms")
- Quality rating: "excellent", "good", "fair", "poor", or "no_coverage"

Base your estimates on:
- Known carrier coverage patterns in the region
- Typical performance for each technology (3G, 4G, 5G)
- Urban vs rural locations
- Carrier infrastructure investments

Format as JSON:
{
  "CarrierName": {
    "carrier": "CarrierName",
    "location": "${locationDesc}",
    "technologies": {
      "threeG": {
        "available": true,
        "signalStrength": 75,
        "downloadSpeed": "5-10 Mbps",
        "uploadSpeed": "2-5 Mbps",
        "latency": "80-120ms",
        "quality": "fair"
      },
      "fourG": {
        "available": true,
        "signalStrength": 85,
        "downloadSpeed": "30-50 Mbps",
        "uploadSpeed": "10-20 Mbps",
        "latency": "30-50ms",
        "quality": "good"
      },
      "fiveG": {
        "available": true,
        "signalStrength": 70,
        "downloadSpeed": "200-500 Mbps",
        "uploadSpeed": "50-100 Mbps",
        "latency": "15-25ms",
        "quality": "excellent"
      }
    },
    "overallQuality": "good"
  }
}

Provide realistic data based on actual carrier performance in the region.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: "You are a network coverage analyst providing realistic quality metrics based on carrier performance data.",
      },
      contents: prompt,
    });

    const text = await result.response.text();

    if (!text || text.trim() === '') {
      console.error("Empty response from Gemini API");
      return getFallbackQualityMetrics(carriers, location);
    }

    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

    const qualityData: CarrierQualityMap = JSON.parse(jsonStr.trim());
    
    const currentTime = new Date().toISOString();
    for (const carrier in qualityData) {
      qualityData[carrier].lastUpdated = currentTime;
    }

    return qualityData;
  } catch (error) {
    console.error("Failed to fetch coverage quality metrics:", error);
    return getFallbackQualityMetrics(carriers, location);
  }
}

function getFallbackQualityMetrics(carriers: string[], location: string): CarrierQualityMap {
  const result: CarrierQualityMap = {};
  
  carriers.forEach(carrier => {
    result[carrier] = {
      carrier,
      location,
      technologies: {
        fourG: {
          available: true,
          signalStrength: 75,
          downloadSpeed: "20-50 Mbps",
          uploadSpeed: "5-15 Mbps",
          latency: "40-60ms",
          quality: "good"
        },
        fiveG: {
          available: false,
          signalStrength: 0,
          downloadSpeed: "N/A",
          uploadSpeed: "N/A",
          latency: "N/A",
          quality: "no_coverage"
        }
      },
      overallQuality: "good",
      lastUpdated: new Date().toISOString()
    };
  });
  
  return result;
}
