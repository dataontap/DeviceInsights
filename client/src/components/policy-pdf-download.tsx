import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, ChevronDown, ChevronUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PolicyPDFDownload() {
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-policy-pdf');

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DOTM_Device_Compatibility_Policy.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded Successfully",
        description: "The DOTM Device Compatibility Policy has been downloaded to your device.",
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePolicy = () => {
    setShowFullPolicy(!showFullPolicy);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <CardTitle>Device Compatibility Policy</CardTitle>
        </div>
        <CardDescription>
          Complete device compatibility guide and pre-porting checklist
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary action - View Policy inline */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Complete Policy Document</h3>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            This comprehensive guide includes device unlock requirements, technical specifications, pre-porting checklist, and contact information to ensure a smooth transition onto this network.
          </p>
          <div className="flex gap-3">
            <Button onClick={togglePolicy} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{showFullPolicy ? 'Hide Policy' : 'View Full Policy Online'}</span>
              <span className="sm:hidden">{showFullPolicy ? 'Hide' : 'View Policy'}</span>
              {showFullPolicy ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 px-3 sm:px-4">
              <Download className="w-4 h-4" />
              <span className="ml-1 sm:ml-2">
                <span className="hidden sm:inline">Download </span>PDF
              </span>
            </Button>
          </div>
        </div>

        {showFullPolicy && (
          <div className="mt-6 p-6 bg-white dark:bg-gray-900 border rounded-lg shadow-inner max-h-[80vh] overflow-y-auto">
            <div className="prose prose-blue dark:prose-invert max-w-none">
              {/* Header */}
              <div className="text-center mb-8 pb-4 border-b-2 border-blue-600">
                <div className="text-3xl font-bold text-blue-600 mb-2">DOTM</div>
                <div className="text-lg text-gray-600 dark:text-gray-400">Connected. Simple. Reliable.</div>
              </div>

              <h1 className="text-center text-3xl font-bold mb-6">Device Compatibility Policy</h1>

              {/* Important Notice */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Important Notice</h3>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Before porting your number to DOTM, please ensure your device is compatible with our network and unlocked from your current carrier to avoid service interruptions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Device Compatibility Overview */}
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-l-4 border-blue-600 pl-4">📱 Device Compatibility Overview</h2>

              <p className="mb-6">
                DOTM operates on a modern LTE and 5G network infrastructure designed to provide exceptional coverage and performance. To ensure the best possible experience, your device must meet specific technical requirements and be properly configured for our network.
              </p>

              {/* Network Capabilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-600 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📶</div>
                  <h3 className="font-semibold mb-2">4G LTE</h3>
                  <p className="text-sm">Required for all devices. Ensures reliable voice, text, and data services.</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-600 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🚀</div>
                  <h3 className="font-semibold mb-2">5G Ready</h3>
                  <p className="text-sm">Enhanced speeds and performance in 5G coverage areas.</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📞</div>
                  <h3 className="font-semibold mb-2">VoLTE</h3>
                  <p className="text-sm">Voice over LTE for crystal-clear calling experience.</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📡</div>
                  <h3 className="font-semibold mb-2">Wi-Fi Calling</h3>
                  <p className="text-sm">Seamless calling when cellular coverage is limited.</p>
                </div>
              </div>

              {/* Pre-Porting Checklist */}
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-l-4 border-blue-600 pl-4">✅ Pre-Porting Checklist</h2>

              <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-4 mb-6">
                <div className="space-y-4">
                  {[
                    {
                      title: "Device Compatibility",
                      description: "Verify your device supports the required network bands and features using our online compatibility checker at dotm.ca/compatibility"
                    },
                    {
                      title: "Device Unlock Status", 
                      description: "Ensure your device is unlocked from your current carrier. Contact your current provider if needed."
                    },
                    {
                      title: "Account Standing",
                      description: "Confirm your current account is in good standing with no outstanding balances or contract obligations."
                    },
                    {
                      title: "Backup Important Data",
                      description: "Ensure all contacts, photos, and important data are backed up before initiating the port."
                    },
                    {
                      title: "Service Timing",
                      description: "Plan your port during a convenient time as the process may take 2-24 hours to complete."
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-2">
                      <div className="w-5 h-5 border-2 border-blue-600 rounded mt-1 flex-shrink-0"></div>
                      <div>
                        <strong>{item.title}:</strong> {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Unlock Requirements */}
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-l-4 border-blue-600 pl-4">🔓 Device Unlock Requirements</h2>

              <p className="mb-4">
                A locked device is tied to a specific carrier and cannot be used with other networks. To use your device with DOTM, it must be unlocked from your current provider.
              </p>

              <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 mb-6">
                <div className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Check Lock Status",
                      description: "Contact your current carrier or try inserting a different carrier's SIM card to determine if your device is locked."
                    },
                    {
                      step: "2", 
                      title: "Request Unlock",
                      description: "If locked, contact your current carrier to request an unlock. Most carriers provide free unlocking after contract completion."
                    },
                    {
                      step: "3",
                      title: "Verify Unlock", 
                      description: "Once unlocked, test with a different carrier's SIM card or contact DOTM support for verification assistance."
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">{item.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy & Data Collection */}
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-l-4 border-blue-600 pl-4">🔒 Privacy & Data Collection</h2>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Network Connectivity Monitoring</h3>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Every time you use our IMEI checking service, we automatically perform network connectivity pings to measure your current network performance and compatibility. This helps us provide accurate device analysis and network recommendations. No other private information is collected during these pings.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3">📍 Location Services (Optional)</h3>
              <p className="mb-4">Location data is only collected with your <strong>explicit consent</strong> when you choose to enable location-based features. This enhanced service provides:</p>

              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📊</span>
                    <div>
                      <h4 className="font-semibold mb-2">Regional Network Analysis</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Detailed coverage maps and performance data for your specific area</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📱</span>
                    <div>
                      <h4 className="font-semibold mb-2">Provider Comparisons</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Real-time insights comparing network performance across different carriers in your location</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚡</span>
                    <div>
                      <h4 className="font-semibold mb-2">Service Optimization</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Personalized recommendations based on your geographic area and usage patterns</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-300 dark:border-cyan-600 rounded-lg p-4 mb-6">
                <p className="text-cyan-800 dark:text-cyan-200 font-medium">
                  <strong>Your Control:</strong> You can request deletion of all collected data at any time by contacting our support team. Location services can be disabled in your browser settings, and we respect your privacy choices.
                </p>
              </div>

              {/* Technical Requirements */}
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-l-4 border-blue-600 pl-4">🔧 Technical Requirements</h2>

              <h3 className="text-xl font-semibold mb-3">Minimum Network Band Support</h3>
              <p className="mb-4">Your device must support the following LTE bands for optimal DOTM network performance:</p>

              <div className="space-y-3 mb-6">
                {[
                  { band: "Band 4 (1700/2100 MHz)", description: "Primary LTE band for data and voice services" },
                  { band: "Band 7 (2600 MHz)", description: "Enhanced capacity in urban areas" },
                  { band: "Band 12 (700 MHz)", description: "Extended coverage and building penetration" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      B
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.band}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-6 text-center mb-6">
                <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
                <div className="space-y-2 text-blue-600 dark:text-blue-400 font-medium">
                  <div>📞 1-800-DOTM-HELP</div>
                  <div>📧 rbm@dotmobile.app</div>
                  <div>💬 Live chat at dotm.com</div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Support hours: Monday-Friday 8AM-8PM EST, Weekend 10AM-6PM EST
                </p>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>DOTM Device Compatibility Policy</strong></p>
                <p>Version 2.0 | Effective September 2025</p>
                <p>© 2025 DOTM Inc. All rights reserved.</p>
                <p className="mt-2">
                  This document is subject to change. Please visit dotm.com for the most current version.
                </p>
              </div>
            </div>
          </div>
        )}

        {!showFullPolicy && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">What's Included:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Device compatibility requirements and technical specifications
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Pre-porting checklist to avoid service interruptions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Device unlock process and requirements
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Network band requirements and feature support
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Support contact information
              </li>
            </ul>

            <p className="text-xs text-muted-foreground text-center">
              Policy version 2.0 | Updated January 2025 | Compatible with all devices
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}