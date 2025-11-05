import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PricingPlan {
  carrier: string;
  planName: string;
  monthlyPrice: number;
  data: string;
  speed: string;
  features: string[];
  contractType: "prepaid" | "postpaid";
  additionalFees?: string;
  promotions?: string;
}

export interface PricingResponse {
  country: string;
  currency: string;
  plans: PricingPlan[];
  lastUpdated: string;
}

/**
 * Fetch carrier pricing plans using Gemini AI
 */
export async function getCarrierPricing(country: string, carriers?: string[]): Promise<PricingResponse> {
  try {
    const carrierList = carriers && carriers.length > 0 
      ? carriers.join(", ") 
      : "the top 3-5 carriers";

    const prompt = `You are a mobile carrier pricing analyst. Provide current pricing information for ${carrierList} in ${country}.

For each carrier, list 2-3 popular plans (including at least one budget and one premium option) with:
- Plan name
- Monthly price (in local currency)
- Data allowance
- Network speed (4G/5G)
- Key features (unlimited talk/text, hotspot, international, etc.)
- Contract type (prepaid/postpaid)
- Any additional fees or promotions

Format as JSON:
{
  "country": "${country}",
  "currency": "USD",
  "plans": [
    {
      "carrier": "Carrier Name",
      "planName": "Plan Name",
      "monthlyPrice": 50,
      "data": "Unlimited",
      "speed": "5G",
      "features": ["Unlimited talk & text", "Mobile hotspot", "International calling"],
      "contractType": "postpaid",
      "additionalFees": "Taxes and fees extra",
      "promotions": "First 3 months free"
    }
  ]
}

Provide realistic, current pricing. If exact prices aren't available, use typical market rates.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: "You are a mobile carrier pricing analyst providing accurate, current pricing data.",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    const text = response.text();

    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

    const pricingData: PricingResponse = JSON.parse(jsonStr.trim());
    pricingData.lastUpdated = new Date().toISOString();

    return pricingData;
  } catch (error) {
    console.error("Gemini pricing fetch failed:", error);
    
    // Fallback to basic US pricing if Gemini fails
    return getFallbackPricing(country);
  }
}

/**
 * Fallback pricing data for when AI is unavailable
 */
function getFallbackPricing(country: string): PricingResponse {
  const isUS = country.toLowerCase().includes('us') || country.toLowerCase().includes('united states') || country.toLowerCase().includes('america');
  
  if (isUS) {
    return {
      country: "United States",
      currency: "USD",
      lastUpdated: new Date().toISOString(),
      plans: [
        {
          carrier: "AT&T",
          planName: "Unlimited Starter",
          monthlyPrice: 65,
          data: "Unlimited",
          speed: "5G",
          features: ["Unlimited talk & text", "Talk/text to Mexico & Canada"],
          contractType: "postpaid",
          additionalFees: "Taxes and fees extra ($10-15/month)"
        },
        {
          carrier: "AT&T",
          planName: "Unlimited Premium",
          monthlyPrice: 85,
          data: "Unlimited Premium",
          speed: "5G+",
          features: ["Unlimited talk & text", "50GB hotspot", "4K streaming", "International calling"],
          contractType: "postpaid",
          additionalFees: "Taxes and fees extra"
        },
        {
          carrier: "Verizon",
          planName: "5G Start",
          monthlyPrice: 70,
          data: "Unlimited",
          speed: "5G",
          features: ["Unlimited talk & text", "Apple Music (6 months)"],
          contractType: "postpaid",
          additionalFees: "Taxes and fees extra"
        },
        {
          carrier: "Verizon",
          planName: "5G Get More",
          monthlyPrice: 90,
          data: "Unlimited Premium",
          speed: "5G UW",
          features: ["Unlimited talk & text", "50GB hotspot", "Disney Bundle", "International"],
          contractType: "postpaid",
          additionalFees: "Taxes and fees extra"
        },
        {
          carrier: "T-Mobile",
          planName: "Essentials",
          monthlyPrice: 60,
          data: "Unlimited",
          speed: "5G",
          features: ["Unlimited talk & text", "Talk/text to Mexico & Canada"],
          contractType: "postpaid",
          additionalFees: "Taxes and fees included"
        },
        {
          carrier: "T-Mobile",
          planName: "Magenta MAX",
          monthlyPrice: 85,
          data: "Unlimited Premium",
          speed: "5G UC",
          features: ["Unlimited talk & text", "40GB hotspot", "4K streaming", "Netflix included"],
          contractType: "postpaid",
          additionalFees: "Taxes and fees included"
        },
      ]
    };
  }
  
  // Generic fallback for other countries
  return {
    country: country,
    currency: "USD",
    lastUpdated: new Date().toISOString(),
    plans: [
      {
        carrier: "Local Carrier",
        planName: "Basic Plan",
        monthlyPrice: 30,
        data: "10GB",
        speed: "4G",
        features: ["Unlimited talk & text"],
        contractType: "prepaid"
      },
      {
        carrier: "Local Carrier",
        planName: "Premium Plan",
        monthlyPrice: 60,
        data: "Unlimited",
        speed: "5G",
        features: ["Unlimited talk & text", "International roaming"],
        contractType: "postpaid"
      }
    ]
  };
}
