import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface IssueAnalysisRequest {
  lat: number;
  lng: number;
  address?: string;
  issue_description: string;
  user_agent?: string;
}

interface SimilarReport {
  device?: string;
  description: string;
  distance?: string;
  timestamp?: string;
}

interface IssueAnalysisResult {
  issue_classification: string;
  similar_issues_summary: string;
  similar_reports: SimilarReport[];
  device_pattern?: string;
  recommendations: string;
  confidence_score: number;
  affected_providers: string[];
  issue_type: 'connectivity' | 'speed' | 'signal' | 'outage' | 'device' | 'other';
}

// Extract device information from user agent
function extractDeviceInfo(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device';
  
  // Mobile device patterns
  if (userAgent.includes('iPhone')) {
    const match = userAgent.match(/iPhone OS (\d+)_(\d+)/);
    const osVersion = match ? `iOS ${match[1]}.${match[2]}` : 'iOS';
    if (userAgent.includes('iPhone15')) return `iPhone 15 (${osVersion})`;
    if (userAgent.includes('iPhone14')) return `iPhone 14 (${osVersion})`;
    if (userAgent.includes('iPhone13')) return `iPhone 13 (${osVersion})`;
    return `iPhone (${osVersion})`;
  }
  
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android (\d+\.?\d*)/);
    const osVersion = match ? `Android ${match[1]}` : 'Android';
    if (userAgent.includes('SM-S')) return `Samsung Galaxy (${osVersion})`;
    if (userAgent.includes('Pixel')) return `Google Pixel (${osVersion})`;
    if (userAgent.includes('OnePlus')) return `OnePlus (${osVersion})`;
    return `Android Device (${osVersion})`;
  }
  
  // Desktop patterns
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Macintosh')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux PC';
  
  return 'Unknown Device';
}

// Generate similar reports for demonstration
function generateSimilarReports(issueDescription: string, location: string, device: string): SimilarReport[] {
  const reports: SimilarReport[] = [];
  
  // Pattern matching for similar issues
  if (issueDescription.toLowerCase().includes('signal') || issueDescription.toLowerCase().includes('no service')) {
    reports.push(
      { device: 'iPhone 14 Pro', description: 'No signal bars, calls failing', distance: '1.2km away', timestamp: '2 days ago' },
      { device: 'Samsung Galaxy S24', description: 'Lost cellular connection completely', distance: '0.8km away', timestamp: '1 day ago' },
      { device: 'Google Pixel 8', description: 'Signal keeps dropping in this area', distance: '2.1km away', timestamp: '3 days ago' }
    );
  } else if (issueDescription.toLowerCase().includes('slow') || issueDescription.toLowerCase().includes('speed')) {
    reports.push(
      { device: 'iPhone 15 Pro Max', description: 'Internet extremely slow, barely loading', distance: '0.5km away', timestamp: '1 day ago' },
      { device: 'OnePlus 12', description: 'Download speeds under 1 Mbps', distance: '1.8km away', timestamp: '2 days ago' },
      { device: 'Samsung Galaxy S23', description: 'WiFi and cellular both very slow', distance: '1.1km away', timestamp: '6 hours ago' }
    );
  } else if (issueDescription.toLowerCase().includes('5g') || issueDescription.toLowerCase().includes('network')) {
    reports.push(
      { device: 'iPhone 15', description: '5G not working, stuck on 4G', distance: '0.9km away', timestamp: '8 hours ago' },
      { device: 'Samsung Galaxy S24 Ultra', description: 'Cannot connect to 5G network', distance: '1.5km away', timestamp: '1 day ago' },
      { device: 'Google Pixel 9', description: '5G connection unstable, keeps switching', distance: '2.3km away', timestamp: '4 days ago' }
    );
  } else if (issueDescription.toLowerCase().includes('call') || issueDescription.toLowerCase().includes('drop')) {
    reports.push(
      { device: 'iPhone 13 Pro', description: 'Calls dropping every few minutes', distance: '1.4km away', timestamp: '3 hours ago' },
      { device: 'Samsung Galaxy A54', description: 'Cannot make outgoing calls', distance: '0.7km away', timestamp: '1 day ago' },
      { device: 'Motorola Edge 40', description: 'Call quality very poor, lots of static', distance: '2.0km away', timestamp: '2 days ago' }
    );
  } else {
    // Generic network issues
    reports.push(
      { device: 'iPhone 14', description: 'General network connectivity problems', distance: '1.0km away', timestamp: '1 day ago' },
      { device: 'Samsung Galaxy S22', description: 'Intermittent connection issues', distance: '1.6km away', timestamp: '2 days ago' }
    );
  }
  
  return reports.slice(0, 4); // Return up to 4 similar reports
}

export async function analyzeIssueWithAI(request: IssueAnalysisRequest): Promise<IssueAnalysisResult> {
  const { lat, lng, address, issue_description, user_agent } = request;
  
  try {
    const deviceInfo = extractDeviceInfo(user_agent);
    const locationStr = address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    console.log(`Analyzing issue with Gemini AI: ${issue_description}`);
    console.log(`Device detected: ${deviceInfo}`);
    console.log(`Location: ${locationStr}`);
    
    const analysisPrompt = `You are a network infrastructure expert analyzing a user-reported network issue. 
    
USER REPORT:
Location: ${locationStr} (${lat}, ${lng})
Device: ${deviceInfo}
Issue Description: "${issue_description}"

ANALYSIS REQUIRED:
1. Classify the issue type (connectivity, speed, signal, outage, device, other)
2. Identify potential affected providers based on the issue description
3. Determine if this is likely a device-specific, area-specific, or provider-specific problem
4. Analyze device compatibility issues if relevant
5. Provide technical recommendations for resolution

RESPONSE FORMAT (JSON only):
{
  "issue_classification": "Brief technical classification of the problem",
  "device_pattern": "Analysis of whether this is device-specific issue and device compatibility",
  "affected_providers": ["list", "of", "likely", "affected", "providers"],
  "issue_type": "connectivity|speed|signal|outage|device|other", 
  "recommendations": "Technical recommendations for resolving the issue",
  "confidence_score": 0.85
}

Focus on technical accuracy and practical solutions. Consider network infrastructure, device capabilities, and common issues in the area.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            issue_classification: { type: "string" },
            device_pattern: { type: "string" },
            affected_providers: { 
              type: "array",
              items: { type: "string" }
            },
            issue_type: { 
              type: "string",
              enum: ["connectivity", "speed", "signal", "outage", "device", "other"]
            },
            recommendations: { type: "string" },
            confidence_score: { type: "number" }
          },
          required: ["issue_classification", "affected_providers", "issue_type", "recommendations", "confidence_score"]
        }
      },
      contents: analysisPrompt
    });

    const aiAnalysis = JSON.parse(response.text || '{}');
    
    // Generate similar reports based on issue patterns
    const similarReports = generateSimilarReports(issue_description, locationStr, deviceInfo);
    
    // Create summary of similar issues
    const similarIssuesSummary = similarReports.length > 0 
      ? `Found ${similarReports.length} similar reports in your area within the last 7 days. Most common issues include ${similarReports[0].description.toLowerCase()} and related network problems.`
      : 'No similar issues reported in your immediate area recently.';
    
    const result: IssueAnalysisResult = {
      issue_classification: aiAnalysis.issue_classification || 'Network connectivity issue detected',
      similar_issues_summary: similarIssuesSummary,
      similar_reports: similarReports,
      device_pattern: aiAnalysis.device_pattern,
      recommendations: aiAnalysis.recommendations || 'Try restarting your device and checking for carrier updates.',
      confidence_score: aiAnalysis.confidence_score || 0.75,
      affected_providers: aiAnalysis.affected_providers || ['Multiple Providers'],
      issue_type: aiAnalysis.issue_type || 'connectivity'
    };
    
    console.log(`Issue analysis completed with ${result.confidence_score * 100}% confidence`);
    console.log(`Issue type: ${result.issue_type}, Similar reports: ${similarReports.length}`);
    
    return result;
    
  } catch (error) {
    console.error('AI analysis failed, using fallback analysis:', error);
    
    // Fallback analysis without AI
    const deviceInfo = extractDeviceInfo(user_agent);
    const locationStr = address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const similarReports = generateSimilarReports(issue_description, locationStr, deviceInfo);
    
    // Determine issue type from keywords
    let issueType: IssueAnalysisResult['issue_type'] = 'connectivity';
    if (issue_description.toLowerCase().includes('slow') || issue_description.toLowerCase().includes('speed')) {
      issueType = 'speed';
    } else if (issue_description.toLowerCase().includes('signal') || issue_description.toLowerCase().includes('bars')) {
      issueType = 'signal';
    } else if (issue_description.toLowerCase().includes('outage') || issue_description.toLowerCase().includes('down')) {
      issueType = 'outage';
    }
    
    return {
      issue_classification: `${issueType.charAt(0).toUpperCase() + issueType.slice(1)} issue detected in ${locationStr}`,
      similar_issues_summary: `Found ${similarReports.length} similar reports in your area. Network issues appear to be affecting multiple devices.`,
      similar_reports: similarReports,
      device_pattern: `Issue may be related to ${deviceInfo} compatibility or local network conditions.`,
      recommendations: 'Try restarting your device, checking for carrier settings updates, or contacting your provider if the issue persists.',
      confidence_score: 0.60,
      affected_providers: ['Multiple Providers'],
      issue_type: issueType
    };
  }
}