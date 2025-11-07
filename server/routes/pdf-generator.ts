import { Express } from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { MVNO } from '../config/mvno';
import { storage } from '../storage';

export function registerPDFRoutes(app: Express) {
  app.get("/api/generate-policy-pdf", async (req, res) => {
    try {
      // Fetch dynamic policy content from database
      const policyData = await storage.getNetworkPolicy();
      
      const policy = policyData || {
        title: "Device Compatibility Policy",
        subtitle: "Download our comprehensive guide to ensure your device is compatible and unlocked before porting your number.",
        policyContent: {
          sectionTitle: "Device Compatibility Policy",
          sectionDescription: "Complete device compatibility guide and pre-porting checklist",
          documentTitle: "Complete Policy Document",
          documentDescription: "This comprehensive guide includes device unlock requirements, technical specifications, pre-porting checklist, and contact information to ensure a smooth transition onto this network.",
          includedItems: [
            "Device compatibility requirements and technical specifications",
            "Pre-porting checklist to avoid service interruptions",
            "Device unlock process and requirements",
            "Network band requirements and feature support",
            "Support contact information"
          ],
          footerText: "Policy version 2.0 | Updated January 2025 | Compatible with all devices"
        },
        version: "2.0"
      };
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${MVNO.name} Device Compatibility Policy</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .document {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 3px solid #3B82F6;
        }
        
        .logo {
            font-size: 2.5rem;
            font-weight: 700;
            color: #3B82F6;
            margin-bottom: 0.5rem;
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #6B7280;
            font-weight: 400;
        }
        
        h1 {
            color: #1F2937;
            font-size: 2rem;
            font-weight: 600;
            margin: 2rem 0 1rem 0;
            text-align: center;
        }
        
        h2 {
            color: #374151;
            font-size: 1.4rem;
            font-weight: 600;
            margin: 2rem 0 1rem 0;
            padding-left: 1rem;
            border-left: 4px solid #3B82F6;
        }
        
        h3 {
            color: #4B5563;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 1.5rem 0 0.5rem 0;
        }
        
        p {
            margin-bottom: 1rem;
            text-align: justify;
        }
        
        .alert-box {
            background: linear-gradient(135deg, #FEF3C7, #FCD34D);
            border: 2px solid #F59E0B;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 2rem 0;
            position: relative;
        }
        
        .alert-box::before {
            content: "⚠️";
            font-size: 1.5rem;
            position: absolute;
            top: 1rem;
            left: 1rem;
        }
        
        .alert-content {
            margin-left: 2.5rem;
        }
        
        .alert-title {
            font-weight: 600;
            font-size: 1.1rem;
            color: #92400E;
            margin-bottom: 0.5rem;
        }
        
        .alert-text {
            color: #78350F;
            font-weight: 500;
        }
        
        .checklist {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1.5rem 0;
        }
        
        .checklist-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1rem;
            padding: 0.5rem;
        }
        
        .checklist-item:last-child {
            margin-bottom: 0;
        }
        
        .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #3B82F6;
            border-radius: 4px;
            margin-right: 1rem;
            margin-top: 2px;
            flex-shrink: 0;
        }
        
        .info-box {
            background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
            border: 2px solid #3B82F6;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
        }
        
        .info-title {
            font-weight: 600;
            color: #1E40AF;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
        }
        
        .info-title::before {
            content: "ℹ️";
            margin-right: 0.5rem;
        }
        
        .compatibility-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .network-card {
            background: white;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
        }
        
        .network-card.supported {
            border-color: #10B981;
            background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
        }
        
        .network-card.limited {
            border-color: #F59E0B;
            background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
        }
        
        .network-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .network-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .contact-section {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
            text-align: center;
        }
        
        .contact-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 1rem;
        }
        
        .contact-info {
            font-weight: 500;
            color: #3B82F6;
            font-size: 1.1rem;
        }
        
        .footer {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 0.9rem;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .steps-container {
            background: white;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
        }
        
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #F8FAFC;
            border-radius: 8px;
        }
        
        .step:last-child {
            margin-bottom: 0;
        }
        
        .step-number {
            background: #3B82F6;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-right: 1rem;
            flex-shrink: 0;
        }
        
        .step-content {
            flex: 1;
        }
        
        .step-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
        }
        
        .step-description {
            color: #6B7280;
        }
    </style>
</head>
<body>
    <div class="document">
        <div class="header">
            <div class="logo">${MVNO.name}</div>
            <div class="subtitle">Connected. Simple. Reliable.</div>
        </div>
        
        <h1>${policy.title}</h1>
        
        <div class="alert-box">
            <div class="alert-content">
                <div class="alert-title">Important Notice</div>
                <div class="alert-text">
                    Before porting your number to ${MVNO.name}, please ensure your device is compatible with our network and unlocked from your current carrier to avoid service interruptions.
                </div>
            </div>
        </div>
        
        <h2>📱 Device Compatibility Overview</h2>
        
        <p>
            ${MVNO.name} operates on a modern LTE and 5G network infrastructure designed to provide exceptional coverage and performance. To ensure the best possible experience, your device must meet specific technical requirements and be properly configured for our network.
        </p>
        
        <div class="compatibility-grid">
            <div class="network-card supported">
                <div class="network-icon">📶</div>
                <div class="network-title">4G LTE</div>
                <p>Required for all devices. Ensures reliable voice, text, and data services.</p>
            </div>
            
            <div class="network-card supported">
                <div class="network-icon">🚀</div>
                <div class="network-title">5G Ready</div>
                <p>Enhanced speeds and performance in 5G coverage areas.</p>
            </div>
            
            <div class="network-card limited">
                <div class="network-icon">📞</div>
                <div class="network-title">VoLTE</div>
                <p>Voice over LTE for crystal-clear calling experience.</p>
            </div>
            
            <div class="network-card limited">
                <div class="network-icon">📡</div>
                <div class="network-title">Wi-Fi Calling</div>
                <p>Seamless calling when cellular coverage is limited.</p>
            </div>
        </div>
        
        <h2>✅ Pre-Porting Checklist</h2>
        
        <div class="checklist">
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>
                    <strong>Device Compatibility:</strong> Verify your device supports the required network bands and features using our online compatibility checker at ${MVNO.website}/compatibility
                </div>
            </div>
            
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>
                    <strong>Device Unlock Status:</strong> Ensure your device is unlocked from your current carrier. Contact your current provider if needed.
                </div>
            </div>
            
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>
                    <strong>Account Standing:</strong> Confirm your current account is in good standing with no outstanding balances or contract obligations.
                </div>
            </div>
            
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>
                    <strong>Backup Important Data:</strong> Ensure all contacts, photos, and important data are backed up before initiating the port.
                </div>
            </div>
            
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>
                    <strong>Service Timing:</strong> Plan your port during a convenient time as the process may take 2-24 hours to complete.
                </div>
            </div>
        </div>
        
        <div class="page-break"></div>
        
        <h2>🔓 Device Unlock Requirements</h2>
        
        <p>
            A locked device is tied to a specific carrier and cannot be used with other networks. To use your device with ${MVNO.name}, it must be unlocked from your current provider.
        </p>
        
        <div class="steps-container">
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <div class="step-title">Check Lock Status</div>
                    <div class="step-description">
                        Contact your current carrier or try inserting a different carrier's SIM card to determine if your device is locked.
                    </div>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <div class="step-title">Request Unlock</div>
                    <div class="step-description">
                        If locked, contact your current carrier to request an unlock. Most carriers provide free unlocking after contract completion.
                    </div>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <div class="step-title">Verify Unlock</div>
                    <div class="step-description">
                        Once unlocked, test with a different carrier's SIM card or contact ${MVNO.name} support for verification assistance.
                    </div>
                </div>
            </div>
        </div>
        
        <div class="info-box">
            <div class="info-title">Unlock Timeline</div>
            <p>
                Device unlocking typically takes 1-3 business days but can vary by carrier. We recommend initiating this process before starting your number port to ${MVNO.name}.
            </p>
        </div>
        
        <h2>🔒 Privacy & Data Collection</h2>
        
        <div class="alert-box">
            <div class="alert-content">
                <div class="alert-title">Network Connectivity Monitoring</div>
                <p class="alert-text">
                    Every time you use our IMEI checking service, we automatically perform network connectivity pings to measure your current network performance and compatibility. This helps us provide accurate device analysis and network recommendations. No other private information is collected during these pings.
                </p>
            </div>
        </div>

        <h3>📍 Location Services (Optional)</h3>
        <p>Location data is only collected with your <strong>explicit consent</strong> when you choose to enable location-based features. This enhanced service provides:</p>
        
        <div class="checklist">
            <div class="checklist-item">
                <span class="checklist-icon">📊</span>
                <div>
                    <strong>Regional Network Analysis:</strong> Detailed coverage maps and performance data for your specific area
                </div>
            </div>
            <div class="checklist-item">
                <span class="checklist-icon">📱</span>
                <div>
                    <strong>Provider Comparisons:</strong> Real-time insights comparing network performance across different carriers in your location
                </div>
            </div>
            <div class="checklist-item">
                <span class="checklist-icon">⚡</span>
                <div>
                    <strong>Service Optimization:</strong> Personalized recommendations based on your geographic area and usage patterns
                </div>
            </div>
        </div>

        <div style="background: #E0F2FE; border: 2px solid #0EA5E9; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
            <p style="color: #0C4A6E; font-weight: 500; margin: 0;">
                <strong>Your Control:</strong> You can request deletion of all collected data at any time by contacting our support team. Location services can be disabled in your browser settings, and we respect your privacy choices.
            </p>
        </div>

        <h2>🔧 Technical Requirements</h2>
        
        <h3>Minimum Network Band Support</h3>
        <p>Your device must support the following LTE bands for optimal ${MVNO.name} network performance:</p>
        
        <div class="steps-container">
            <div class="step">
                <div class="step-number">B</div>
                <div class="step-content">
                    <div class="step-title">Band 4 (1700/2100 MHz)</div>
                    <div class="step-description">Primary LTE band for data and voice services</div>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">B</div>
                <div class="step-content">
                    <div class="step-title">Band 7 (2600 MHz)</div>
                    <div class="step-description">Enhanced capacity in urban areas</div>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">B</div>
                <div class="step-content">
                    <div class="step-title">Band 12 (700 MHz)</div>
                    <div class="step-description">Extended coverage and building penetration</div>
                </div>
            </div>
        </div>
        
        <h3>Recommended Features</h3>
        <div class="checklist">
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div><strong>VoLTE Support:</strong> Enables high-quality voice calls over the LTE network</div>
            </div>
            
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div><strong>Wi-Fi Calling:</strong> Allows calls and texts over Wi-Fi when cellular signal is weak</div>
            </div>
            
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div><strong>5G Capability:</strong> Access to enhanced speeds in 5G coverage areas</div>
            </div>
            
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div><strong>eSIM Support:</strong> For convenient digital SIM activation (where available)</div>
            </div>
        </div>
        
        <h2>⚠️ Service Interruption Prevention</h2>
        
        <div class="alert-box">
            <div class="alert-content">
                <div class="alert-title">Avoid Service Interruptions</div>
                <div class="alert-text">
                    Using an incompatible or locked device may result in poor network performance, dropped calls, or complete service interruption. Always verify compatibility before porting.
                </div>
            </div>
        </div>
        
        <p>Common issues that can cause service interruptions:</p>
        
        <div class="steps-container">
            <div class="step">
                <div class="step-number">!</div>
                <div class="step-content">
                    <div class="step-title">Locked Device</div>
                    <div class="step-description">
                        Device remains locked to previous carrier, preventing network access
                    </div>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">!</div>
                <div class="step-content">
                    <div class="step-title">Incompatible Bands</div>
                    <div class="step-description">
                        Device lacks required LTE bands, causing poor coverage or no service
                    </div>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">!</div>
                <div class="step-content">
                    <div class="step-title">Outdated Software</div>
                    <div class="step-description">
                        Device software doesn't support ${MVNO.name}'s network configuration
                    </div>
                </div>
            </div>
        </div>
        
        <h2>🛠️ ${MVNO.name} Compatibility Checker</h2>
        
        <p>
            We provide a free online tool to verify your device's compatibility with the ${MVNO.name} network. This tool analyzes your device's IMEI number and provides detailed compatibility information.
        </p>
        
        <div class="info-box">
            <div class="info-title">How to Use the Compatibility Checker</div>
            <ol style="margin-left: 1.5rem; margin-top: 1rem;">
                <li>Visit <strong>${MVNO.website}/compatibility</strong></li>
                <li>Enter your device's 15-digit IMEI number (dial *#06# on your device)</li>
                <li>Review the detailed compatibility report</li>
                <li>Contact our support team if you have questions about the results</li>
            </ol>
        </div>
        
        <div class="contact-section">
            <div class="contact-title">Need Help?</div>
            <p>Our technical support team is available to assist with device compatibility questions and unlock guidance.</p>
            <div class="contact-info">
                📞 ${MVNO.phone}<br>
                📧 ${MVNO.supportEmail}<br>
                💬 Live chat at ${MVNO.website}
            </div>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: #6B7280;">
                Support hours: Monday-Friday 8AM-8PM EST, Weekend 10AM-6PM EST
            </p>
        </div>
        
        <div class="footer">
            <p>${policy.policyContent?.footerText || 'Policy version 2.0 | Updated January 2025 | Compatible with all devices'}</p>
            <p>© 2025 ${MVNO.companyName}. All rights reserved.</p>
            <p style="margin-top: 1rem;">
                This document is subject to change. Please visit ${MVNO.website} for the most current version.
            </p>
        </div>
    </div>
</body>
</html>`;

      // Find chromium executable dynamically
      let chromiumPath: string | undefined;
      try {
        chromiumPath = execSync('which chromium || ls /nix/store/*/bin/chromium 2>/dev/null | head -1', {
          encoding: 'utf-8'
        }).trim();
      } catch (error) {
        console.warn('Could not find chromium path, using Puppeteer default');
      }

      const browser = await puppeteer.launch({
        headless: true,
        ...(chromiumPath && { executablePath: chromiumPath }),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--no-first-run',
          '--no-default-browser-check',
          '--no-zygote',
          '--single-process'
        ]
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
          right: '0.5in'
        }
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${MVNO.name}_Device_Compatibility_Policy.pdf"`);
      res.send(pdf);

    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });
}