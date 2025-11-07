import { fetchFullMVNOPricing } from "./mcp-service";

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
 * Fetch carrier pricing plans
 * Currently only returns DOTM/FULL_MVNO pricing from MCP endpoint
 */
export async function getCarrierPricing(country: string, carriers?: string[]): Promise<PricingResponse> {
  try {
    // Only fetch FULL_MVNO pricing from MCP endpoint
    const fullMVNOPlan = await fetchFullMVNOPricing();

    return {
      country,
      currency: getCurrencyForCountry(country),
      plans: fullMVNOPlan ? [fullMVNOPlan] : [getStaticDOTMPlan()],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to fetch FULL_MVNO pricing from MCP:", error);
    
    // Fallback to static DOTM pricing
    return getFallbackPricing(country);
  }
}

/**
 * Determine currency based on country name
 */
function getCurrencyForCountry(country: string): string {
  const countryLower = country.toLowerCase();
  
  // Canada
  if (countryLower.includes('canada')) {
    return "CAD";
  }
  
  // Eurozone countries
  if (countryLower.includes('euro') || 
      countryLower.includes('eu') ||
      countryLower.includes('germany') ||
      countryLower.includes('france') ||
      countryLower.includes('spain') ||
      countryLower.includes('italy') ||
      countryLower.includes('netherlands') ||
      countryLower.includes('belgium') ||
      countryLower.includes('austria') ||
      countryLower.includes('ireland')) {
    return "EUR";
  }
  
  // United Kingdom
  if (countryLower.includes('uk') || 
      countryLower.includes('britain') || 
      countryLower.includes('united kingdom') ||
      countryLower.includes('england') ||
      countryLower.includes('scotland') ||
      countryLower.includes('wales')) {
    return "GBP";
  }
  
  // Australia
  if (countryLower.includes('australia')) {
    return "AUD";
  }
  
  // Default to USD
  return "USD";
}

/**
 * Get static DOTM pricing as a last resort
 */
function getStaticDOTMPlan(): PricingPlan {
  return {
    carrier: "FULL_MVNO",
    planName: "Global Data Plan",
    monthlyPrice: 20,
    data: "10GB",
    speed: "5G",
    features: [
      "Global coverage",
      "No expiry data",
      "AT&T network in US",
      "No contracts"
    ],
    contractType: "prepaid",
    additionalFees: "No additional fees",
    promotions: "Pay only for what you use",
  };
}

/**
 * Fallback pricing data for when MCP endpoint is unavailable
 * Only returns DOTM/FULL_MVNO pricing
 */
async function getFallbackPricing(country: string): Promise<PricingResponse> {
  try {
    // Try to get FULL_MVNO pricing from MCP
    const fullMVNOPlan = await fetchFullMVNOPricing();
    
    return {
      country: country,
      currency: getCurrencyForCountry(country),
      lastUpdated: new Date().toISOString(),
      plans: fullMVNOPlan ? [fullMVNOPlan] : [getStaticDOTMPlan()]
    };
  } catch (error) {
    console.error("MCP endpoint failed in fallback, using static DOTM pricing:", error);
    
    // Use static DOTM pricing as last resort
    return {
      country: country,
      currency: getCurrencyForCountry(country),
      lastUpdated: new Date().toISOString(),
      plans: [getStaticDOTMPlan()]
    };
  }
}
