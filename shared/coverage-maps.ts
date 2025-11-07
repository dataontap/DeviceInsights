export const COVERAGE_MAP_URLS: Record<string, string> = {
  "AT&T": "https://www.att.com/maps/wireless-coverage.html",
  "Verizon": "https://www.verizon.com/coverage-map/",
  "T-Mobile": "https://www.t-mobile.com/coverage/coverage-map",
  "Rogers": "https://www.rogers.com/mobility/network-coverage-map",
  "Bell": "https://www.bell.ca/Mobility/Our_network_coverage",
  "Telus": "https://www.telus.com/en/mobility/network/coverage-map",
};

export function getCoverageMapUrl(carrier: string): string | null {
  const normalizedCarrier = carrier.trim();
  
  // Direct match
  if (COVERAGE_MAP_URLS[normalizedCarrier]) {
    return COVERAGE_MAP_URLS[normalizedCarrier];
  }
  
  // FULL_MVNO uses AT&T network
  if (normalizedCarrier === "FULL_MVNO" || normalizedCarrier.toLowerCase().includes("dotm")) {
    return COVERAGE_MAP_URLS["AT&T"];
  }
  
  // Fuzzy match for carrier names
  const lowerCarrier = normalizedCarrier.toLowerCase();
  for (const [key, url] of Object.entries(COVERAGE_MAP_URLS)) {
    if (lowerCarrier.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCarrier)) {
      return url;
    }
  }
  
  return null;
}
