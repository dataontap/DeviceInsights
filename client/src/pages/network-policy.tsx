import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, ChevronDown, ChevronUp, Download, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function NetworkPolicy() {
  const [showFullPolicy, setShowFullPolicy] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const { data: policyData, isLoading } = useQuery<{
    success: boolean;
    policy: {
      title: string;
      subtitle: string;
      policyContent: {
        sectionTitle: string;
        sectionDescription: string;
        documentTitle: string;
        documentDescription: string;
        includedItems: string[];
        footerText: string;
      };
      version: string;
    };
  }>({
    queryKey: ['/api/network-policy'],
  });

  const policy = policyData?.policy || {
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
      footerText: "Policy version 3.0 | Updated November 11, 2025 | Compatible with all devices"
    },
    version: "3.0"
  };

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
      a.download = 'Device_Compatibility_Policy.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded Successfully",
        description: "The Device Compatibility Policy has been downloaded to your device.",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading policy...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white dark:bg-gray-800 shadow-lg"
          data-testid="button-mobile-menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-4 mt-12">
              <Link href="/">
                <a className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" data-testid="link-home">
                  Home
                </a>
              </Link>
              <Link href="/coverage-maps">
                <a className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" data-testid="link-coverage">
                  Coverage Maps
                </a>
              </Link>
              <Link href="/network-policy">
                <a className="block px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-lg font-medium" data-testid="link-network-policy">
                  Network Policy
                </a>
              </Link>
              <Link href="/integration-guide">
                <a className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" data-testid="link-integration">
                  Integration Guide
                </a>
              </Link>
              <Link href="/admin">
                <a className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" data-testid="link-admin">
                  Admin
                </a>
              </Link>
            </nav>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {policy.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {policy.subtitle}
          </p>
        </div>

        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <CardTitle>{policy.policyContent.sectionTitle}</CardTitle>
            </div>
            <CardDescription>
              {policy.policyContent.sectionDescription}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Primary action - View Policy inline */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">{policy.policyContent.documentTitle}</h3>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                {policy.policyContent.documentDescription}
              </p>
              <div className="flex gap-3">
                <Button onClick={togglePolicy} className="flex-1 bg-blue-600 hover:bg-blue-700" data-testid="button-toggle-policy">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{showFullPolicy ? 'Hide Policy' : 'View Full Policy Online'}</span>
                  <span className="sm:hidden">{showFullPolicy ? 'Hide' : 'View Policy'}</span>
                  {showFullPolicy ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
                <Button onClick={handleDownloadPDF} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 px-3 sm:px-4" data-testid="button-download-pdf">
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
                  <h1 className="text-center text-3xl font-bold mb-6 mt-4">{policy.title}</h1>

                  {/* Important Notice */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Important Notice</h3>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Before porting your number to our network, please ensure your device is compatible with our network and unlocked from your current carrier to avoid service interruptions.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Device Compatibility Overview */}
                  <h2 className="text-2xl font-semibold mb-4 pb-2 border-l-4 border-blue-600 pl-4">📱 Device Compatibility Overview</h2>

                  <p className="mb-6">
                    Our network operates on a modern LTE and 5G network infrastructure designed to provide exceptional coverage and performance. To ensure the best possible experience, your device must meet specific technical requirements and be properly configured for our network.
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
                          description: "Verify your device supports the required network bands and features using our online compatibility checker"
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
                    A locked device is tied to a specific carrier and cannot be used with other networks. To use your device with our network, it must be unlocked from your current provider.
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
                          description: "Once unlocked, test with a different carrier's SIM card or contact support for verification assistance."
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

                  {/* Contact Information */}
                  <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-6 text-center mb-6">
                    <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
                    <div className="space-y-2 text-blue-600 dark:text-blue-400 font-medium">
                      <div>📞 +1-647-550-0007</div>
                      <div>📧 rbm@dotmobile.app</div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                      Support hours: Monday-Friday 8AM-8PM EST, Weekend 10AM-6PM EST
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-2">{policy.policyContent.footerText}</p>
                  </div>
                </div>
              </div>
            )}

            {!showFullPolicy && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">What's Included:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {policy.policyContent.includedItems.map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-muted-foreground text-center">
                  {policy.policyContent.footerText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
