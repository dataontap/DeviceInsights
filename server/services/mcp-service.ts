import { PricingPlan } from "./pricing-service";

export interface MCPPricingData {
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

export async function fetchFullMVNOPricing(): Promise<PricingPlan | null> {
  try {
    const response = await fetch('https://gorse.dotmobile.app/mcp', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`MCP endpoint returned ${response.status}, using fallback FULL_MVNO pricing`);
      return getFullMVNOFallback();
    }

    const data = await response.json();
    
    // Parse the MCP response and convert to PricingPlan format
    return {
      carrier: data.carrier || "FULL_MVNO",
      planName: data.planName || "Global Data Plan",
      monthlyPrice: data.monthlyPrice || 20,
      data: data.data || "10GB",
      speed: data.speed || "5G",
      features: data.features || [
        "Global coverage",
        "No expiry data",
        "AT&T network in US",
        "No contracts"
      ],
      contractType: data.contractType || "prepaid",
      additionalFees: data.additionalFees,
      promotions: data.promotions,
    };
  } catch (error) {
    console.error("Failed to fetch FULL_MVNO pricing from MCP:", error);
    return getFullMVNOFallback();
  }
}

function getFullMVNOFallback(): PricingPlan {
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
