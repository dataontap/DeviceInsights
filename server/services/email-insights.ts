import { storage } from '../storage';
import { sendEmail } from './firebase-admin.js';

interface MonthlyInsightData {
  period: {
    startDate: Date;
    endDate: Date;
    month: string;
  };
  stats: {
    averageDownloadSpeed: number;
    averageUploadSpeed: number;
    averageLatency: number;
    totalInterruptions: number;
    totalDowntime: number;
    connectionQualityScore: number;
  };
  comparison?: {
    previousMonth: {
      averageDownloadSpeed: number;
      averageLatency: number;
      totalInterruptions: number;
      qualityScore: number;
    };
    improvement: {
      speed: number;
      latency: number;
      interruptions: number;
      quality: number;
    };
  };
  recommendations: string[];
  topIssues: Array<{
    issue: string;
    frequency: number;
    impact: string;
  }>;
}

export async function generateMonthlyInsightReport(userId: number): Promise<MonthlyInsightData> {
  // Get current month stats
  const endDate = new Date();
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
  endDate.setDate(0); // Last day of previous month

  const stats = await storage.getAverageConnectivityStats(userId, 30);
  const currentMetrics = await storage.getConnectivityMetricsByDateRange(userId, startDate, endDate);
  const interruptions = await storage.getConnectivityInterruptions(userId, 50);

  // Get previous month for comparison
  const prevMonthStart = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
  const prevMonthEnd = new Date(startDate);
  prevMonthEnd.setDate(0);

  const prevStats = await storage.getAverageConnectivityStats(userId, 60); // Get 60 days then filter
  
  // Analyze top issues
  const topIssues = [];
  const latencyIssues = interruptions.filter(i => i.latency && i.latency > 3000);
  const packetLossIssues = interruptions.filter(i => i.packetLoss && i.packetLoss > 5);
  const speedIssues = interruptions.filter(i => i.downloadSpeed && i.downloadSpeed < 1000);

  if (latencyIssues.length > 0) {
    topIssues.push({
      issue: "High Latency",
      frequency: latencyIssues.length,
      impact: latencyIssues.length > 10 ? "High" : latencyIssues.length > 5 ? "Medium" : "Low"
    });
  }

  if (packetLossIssues.length > 0) {
    topIssues.push({
      issue: "Packet Loss",
      frequency: packetLossIssues.length,
      impact: packetLossIssues.length > 5 ? "High" : "Medium"
    });
  }

  if (speedIssues.length > 0) {
    topIssues.push({
      issue: "Slow Connection Speed",
      frequency: speedIssues.length,
      impact: speedIssues.length > 15 ? "High" : speedIssues.length > 8 ? "Medium" : "Low"
    });
  }

  // Generate recommendations
  const recommendations = [];
  
  if (stats.averageLatency > 200) {
    recommendations.push("Your connection latency is higher than optimal. Consider switching to a wired connection when possible for better response times.");
  }

  if (stats.averageDownloadSpeed < 10000) {
    recommendations.push("Your average download speed is below 10 Mbps. Contact your ISP to discuss upgrading your plan for better performance.");
  }

  if (stats.totalInterruptions > 20) {
    recommendations.push("You experienced frequent connectivity interruptions. Check your router placement and consider moving closer to your access point.");
  }

  if (stats.connectionQualityScore < 60) {
    recommendations.push("Your overall connection quality could be improved. Consider contacting technical support to diagnose potential issues.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Your connectivity is performing well! Keep monitoring your connection for any changes.");
  }

  // Calculate comparison with previous month
  let comparison;
  if (prevStats && prevStats.averageDownloadSpeed > 0) {
    comparison = {
      previousMonth: {
        averageDownloadSpeed: prevStats.averageDownloadSpeed,
        averageLatency: prevStats.averageLatency,
        totalInterruptions: prevStats.totalInterruptions,
        qualityScore: prevStats.connectionQualityScore
      },
      improvement: {
        speed: ((stats.averageDownloadSpeed - prevStats.averageDownloadSpeed) / prevStats.averageDownloadSpeed) * 100,
        latency: ((prevStats.averageLatency - stats.averageLatency) / prevStats.averageLatency) * 100,
        interruptions: ((prevStats.totalInterruptions - stats.totalInterruptions) / Math.max(prevStats.totalInterruptions, 1)) * 100,
        quality: stats.connectionQualityScore - prevStats.connectionQualityScore
      }
    };
  }

  return {
    period: {
      startDate,
      endDate,
      month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    },
    stats,
    comparison,
    recommendations,
    topIssues
  };
}

export function generateInsightEmailHTML(userName: string, data: MonthlyInsightData): string {
  const formatSpeed = (kbps: number) => {
    if (kbps > 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
    return `${kbps.toFixed(0)} kbps`;
  };

  const formatLatency = (ms: number) => `${ms.toFixed(0)}ms`;

  const formatDuration = (seconds: number) => {
    if (seconds > 3600) return `${(seconds / 3600).toFixed(1)} hours`;
    if (seconds > 60) return `${(seconds / 60).toFixed(0)} minutes`;
    return `${seconds} seconds`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981"; // Green
    if (score >= 60) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monthly Connectivity Insights - ${data.period.month}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #3B82F6, #1E40AF);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        .metric {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #3B82F6;
        }
        .metric-label {
          font-size: 12px;
          color: #6B7280;
          margin-top: 5px;
          text-transform: uppercase;
        }
        .quality-score {
          background: linear-gradient(135deg, #f8f9fa, #e5e7eb);
          padding: 25px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: white;
        }
        .recommendations {
          background: #FEF3C7;
          border-left: 4px solid #F59E0B;
          padding: 20px;
          margin: 20px 0;
        }
        .recommendations h3 {
          color: #92400E;
          margin-top: 0;
        }
        .recommendation {
          margin-bottom: 10px;
          color: #78350F;
        }
        .comparison {
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .improvement {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .improvement.positive {
          background: #DEF7EC;
          color: #03543F;
        }
        .improvement.negative {
          background: #FDE8E8;
          color: #9B1C1C;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6B7280;
        }
        .unsubscribe {
          margin-top: 15px;
        }
        .unsubscribe a {
          color: #3B82F6;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Monthly Connectivity Report</h1>
          <p>Your ${data.period.month} Connection Insights</p>
        </div>
        
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Here's your monthly connectivity summary for ${data.period.month}. We've been monitoring your connection to provide you with personalized insights.</p>
          
          <div class="quality-score">
            <div class="score-circle" style="background-color: ${getScoreColor(data.stats.connectionQualityScore)}">
              ${data.stats.connectionQualityScore}
            </div>
            <h3>Overall Connection Quality: ${getScoreLabel(data.stats.connectionQualityScore)}</h3>
          </div>
          
          <div class="metric-grid">
            <div class="metric">
              <div class="metric-value">${formatSpeed(data.stats.averageDownloadSpeed)}</div>
              <div class="metric-label">Average Download Speed</div>
            </div>
            <div class="metric">
              <div class="metric-value">${formatSpeed(data.stats.averageUploadSpeed)}</div>
              <div class="metric-label">Average Upload Speed</div>
            </div>
            <div class="metric">
              <div class="metric-value">${formatLatency(data.stats.averageLatency)}</div>
              <div class="metric-label">Average Latency</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.stats.totalInterruptions}</div>
              <div class="metric-label">Connection Issues</div>
            </div>
          </div>
          
          ${data.comparison ? `
          <div class="comparison">
            <h3>📈 Compared to Last Month</h3>
            <p>
              Speed: <span class="improvement ${data.comparison.improvement.speed >= 0 ? 'positive' : 'negative'}">
                ${data.comparison.improvement.speed >= 0 ? '+' : ''}${data.comparison.improvement.speed.toFixed(1)}%
              </span> |
              Latency: <span class="improvement ${data.comparison.improvement.latency >= 0 ? 'positive' : 'negative'}">
                ${data.comparison.improvement.latency >= 0 ? '' : '+'}${data.comparison.improvement.latency.toFixed(1)}%
              </span> |
              Issues: <span class="improvement ${data.comparison.improvement.interruptions >= 0 ? 'positive' : 'negative'}">
                ${data.comparison.improvement.interruptions >= 0 ? '' : '+'}${data.comparison.improvement.interruptions.toFixed(0)}
              </span>
            </p>
          </div>
          ` : ''}
          
          ${data.topIssues.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>🔍 Top Issues This Month</h3>
            ${data.topIssues.map(issue => `
              <div style="background: #FEF2F2; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #EF4444;">
                <strong>${issue.issue}</strong> - ${issue.frequency} occurrences (${issue.impact} impact)
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div class="recommendations">
            <h3>💡 Personalized Recommendations</h3>
            ${data.recommendations.map(rec => `<div class="recommendation">• ${rec}</div>`).join('')}
          </div>
          
          <p>Keep monitoring your connection for optimal performance. If you notice persistent issues, don't hesitate to contact your internet service provider.</p>
          
          <p>Best regards,<br>The DOTM Team</p>
        </div>
        
        <div class="footer">
          <p>This report was automatically generated based on your registered email preferences.</p>
          <div class="unsubscribe">
            <a href="#">Update your email preferences</a> | 
            <a href="mailto:support@dotm.com?subject=Unsubscribe Monthly Reports">Unsubscribe</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendMonthlyInsights(): Promise<void> {
  try {
    console.log("Starting monthly insights email job...");
    
    const pendingReports = await storage.getPendingMonthlyReports();
    
    if (pendingReports.length === 0) {
      console.log("No users need monthly reports at this time");
      return;
    }
    
    console.log(`Sending monthly insights to ${pendingReports.length} users`);
    
    for (const { user } of pendingReports) {
      try {
        // Generate insight data for this user
        const insightData = await generateMonthlyInsightReport(user.id);
        
        // Create email report record
        const emailReport = await storage.createEmailReport({
          userId: user.id,
          reportType: "monthly",
          reportData: {
            averageDownloadSpeed: insightData.stats.averageDownloadSpeed,
            averageUploadSpeed: insightData.stats.averageUploadSpeed,
            averageLatency: insightData.stats.averageLatency,
            totalInterruptions: insightData.stats.totalInterruptions,
            totalDowntime: insightData.stats.totalDowntime,
            connectionQualityScore: insightData.stats.connectionQualityScore,
            recommendations: insightData.recommendations,
            comparisonData: insightData.comparison
          },
          emailSubject: `Your ${insightData.period.month} Connectivity Report - DOTM Insights`,
          emailTemplate: "monthly_insights"
        });
        
        // Generate email content
        const userName = user.firstName || user.email.split('@')[0];
        const emailHTML = generateInsightEmailHTML(userName, insightData);
        
        // Send email
        const emailSent = await sendEmail(
          user.email,
          `Your ${insightData.period.month} Connectivity Report - DOTM Insights`,
          emailHTML
        );
        
        if (emailSent) {
          // Mark as sent
          await storage.markEmailReportSent(emailReport.id);
          console.log(`Monthly insight email sent successfully to ${user.email}`);
        } else {
          console.error(`Failed to send monthly insight email to ${user.email}`);
        }
        
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (userError) {
        console.error(`Failed to send monthly insight for user ${user.email}:`, userError);
      }
    }
    
    console.log("Monthly insights email job completed");
  } catch (error) {
    console.error("Monthly insights email job failed:", error);
    throw error;
  }
}

// Schedule monthly insights to run on the 1st of each month
export function scheduleMonthlyInsights(): void {
  const checkAndSend = async () => {
    try {
      await sendMonthlyInsights();
    } catch (error) {
      console.error("Scheduled monthly insights failed:", error);
    }
  };
  
  // Check every hour if we need to send monthly reports
  setInterval(checkAndSend, 60 * 60 * 1000); // 1 hour
  
  // Also run on startup in case we missed any
  setTimeout(checkAndSend, 5000); // 5 seconds after startup
}