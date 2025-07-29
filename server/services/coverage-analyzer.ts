import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface DowndetectorReport {
  id: string;
  provider: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  issue_type: string;
  severity: string;
  timestamp: string;
  user_reports: number;
  description: string;
}

interface CoverageAnalysis {
  provider: string;
  coverage_score: number;
  reliability_rating: number;
  recent_issues: number;
  issue_summary: string;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  last_major_outage?: string;
  confidence_score: number;
}

interface LocationCoverage {
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  providers: CoverageAnalysis[];
  analysis_timestamp: string;
  data_period: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Simulate fetching Downdetector reports for a specific area and time period
 * In production, this would integrate with Downdetector's API or web scraping
 */
async function fetchDowndetectorReports(
  lat: number, 
  lng: number, 
  radiusKm: number = 10, 
  daysBack: number = 30
): Promise<DowndetectorReport[]> {
  // This would be replaced with actual Downdetector API integration
  // For now, we'll simulate realistic data based on location
  
  const providers = ['Verizon', 'AT&T', 'T-Mobile', 'OXIO', 'Rogers', 'Bell', 'Telus', 'Freedom Mobile'];
  const issueTypes = ['network_outage', 'slow_data', 'no_signal', 'dropped_calls', 'billing_issues'];
  const mockReports: DowndetectorReport[] = [];
  
  // Generate realistic mock data based on location and time
  const reportCount = Math.floor(Math.random() * 20) + 5; // 5-25 reports
  
  for (let i = 0; i < reportCount; i++) {
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    const daysAgo = Math.floor(Math.random() * daysBack);
    const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    // Generate coordinates within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    const deltaLat = distance * Math.cos(angle) / 111; // roughly 111km per degree
    const deltaLng = distance * Math.sin(angle) / (111 * Math.cos(lat * Math.PI / 180));
    
    mockReports.push({
      id: `report_${i}_${Date.now()}`,
      provider,
      location: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      coordinates: {
        lat: lat + deltaLat,
        lng: lng + deltaLng
      },
      issue_type: issueType,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      timestamp,
      user_reports: Math.floor(Math.random() * 100) + 1,
      description: `${provider} ${issueType.replace('_', ' ')} reported by users in the area`
    });
  }
  
  return mockReports;
}

/**
 * Analyze coverage using Gemini AI based on Downdetector reports
 */
async function analyzeCoverageWithAI(
  provider: string,
  reports: DowndetectorReport[],
  location: { lat: number; lng: number }
): Promise<CoverageAnalysis> {
  const providerReports = reports.filter(r => 
    r.provider.toLowerCase().includes(provider.toLowerCase()) ||
    provider.toLowerCase().includes(r.provider.toLowerCase())
  );
  
  const systemPrompt = `You are an expert telecommunications network analyst specializing in coverage assessment and network reliability evaluation. 

Your task is to analyze Downdetector reports for ${provider} in the specified geographic area and provide a comprehensive coverage analysis.

Analysis Guidelines:
1. Coverage Score (0-100): Based on frequency and severity of outages
2. Reliability Rating (1-5): Overall network dependability 
3. Recent Issues Count: Number of significant problems in the area
4. Issue Summary: Brief description of main problems
5. Recommendation: excellent (90-100), good (70-89), fair (50-69), poor (<50)
6. Confidence Score (0-1): How reliable this analysis is based on data quality

Consider these factors:
- Frequency of reports (more reports = lower score)
- Severity of issues (network outages worse than billing)
- Geographic concentration (issues closer to target location are more relevant)
- Recent trends (recent issues weighted more heavily)
- User report volume (more users reporting = more significant issue)

Response must be valid JSON matching this schema:
{
  "provider": string,
  "coverage_score": number (0-100),
  "reliability_rating": number (1-5),
  "recent_issues": number,
  "issue_summary": string,
  "recommendation": "excellent" | "good" | "fair" | "poor",
  "last_major_outage": string (optional),
  "confidence_score": number (0-1)
}`;

  const analysisPrompt = `Analyze ${provider} network coverage based on these Downdetector reports near location ${location.lat}, ${location.lng}:

Reports Data:
${JSON.stringify(providerReports, null, 2)}

Total reports in area: ${providerReports.length}
Analysis period: Last 30 days
Geographic radius: 10km

Provide comprehensive coverage analysis in the specified JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            provider: { type: "string" },
            coverage_score: { type: "number" },
            reliability_rating: { type: "number" },
            recent_issues: { type: "number" },
            issue_summary: { type: "string" },
            recommendation: { 
              type: "string",
              enum: ["excellent", "good", "fair", "poor"]
            },
            last_major_outage: { type: "string" },
            confidence_score: { type: "number" }
          },
          required: ["provider", "coverage_score", "reliability_rating", "recent_issues", "issue_summary", "recommendation", "confidence_score"]
        }
      },
      contents: analysisPrompt,
    });

    const rawJson = response.text;
    console.log(`Coverage analysis for ${provider}:`, rawJson);

    if (rawJson) {
      const analysis: CoverageAnalysis = JSON.parse(rawJson);
      return analysis;
    } else {
      throw new Error("No response from Gemini AI");
    }
  } catch (error) {
    console.error(`Error analyzing coverage for ${provider}:`, error);
    
    // Fallback analysis based on simple report counting
    const severityWeight = { high: 3, medium: 2, low: 1 };
    const totalSeverity = providerReports.reduce((sum, report) => 
      sum + (severityWeight[report.severity as keyof typeof severityWeight] || 1), 0
    );
    
    const coverageScore = Math.max(0, 100 - (totalSeverity * 5));
    const reliabilityRating = Math.max(1, 5 - Math.floor(totalSeverity / 5));
    
    let recommendation: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (coverageScore >= 90) recommendation = 'excellent';
    else if (coverageScore >= 70) recommendation = 'good';
    else if (coverageScore >= 50) recommendation = 'fair';
    else recommendation = 'poor';
    
    return {
      provider,
      coverage_score: coverageScore,
      reliability_rating: reliabilityRating,
      recent_issues: providerReports.length,
      issue_summary: `${providerReports.length} reports in the last 30 days. Main issues: ${Array.from(new Set(providerReports.map(r => r.issue_type))).join(', ')}`,
      recommendation,
      confidence_score: 0.6 // Lower confidence for fallback analysis
    };
  }
}

/**
 * Get comprehensive coverage analysis for a location
 */
export async function getCoverageAnalysis(
  lat: number,
  lng: number,
  address?: string
): Promise<LocationCoverage> {
  try {
    // Fetch Downdetector reports for the area
    console.log(`Fetching coverage data for location: ${lat}, ${lng}`);
    const reports = await fetchDowndetectorReports(lat, lng, 10, 30);
    
    // List of major providers to analyze
    const providers = ['Verizon', 'AT&T', 'T-Mobile', 'OXIO', 'Rogers', 'Bell', 'Telus'];
    
    // Analyze each provider using AI
    const providerAnalyses = await Promise.all(
      providers.map(provider => analyzeCoverageWithAI(provider, reports, { lat, lng }))
    );
    
    // Sort by coverage score (best first)
    providerAnalyses.sort((a, b) => b.coverage_score - a.coverage_score);
    
    return {
      location: {
        lat,
        lng,
        address
      },
      providers: providerAnalyses,
      analysis_timestamp: new Date().toISOString(),
      data_period: "Last 30 days"
    };
    
  } catch (error) {
    console.error('Error in coverage analysis:', error);
    throw new Error('Failed to analyze coverage for location');
  }
}

/**
 * Get coverage analysis for a specific provider at a location
 */
export async function getProviderCoverage(
  provider: string,
  lat: number,
  lng: number
): Promise<CoverageAnalysis> {
  const reports = await fetchDowndetectorReports(lat, lng, 10, 30);
  return await analyzeCoverageWithAI(provider, reports, { lat, lng });
}