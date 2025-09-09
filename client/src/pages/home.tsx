import { useState } from "react";
import Navigation from "@/components/navigation";
import IMEIChecker from "@/components/imei-checker";
import DeviceResults from "@/components/device-results";

import PolicyPDFDownload from "@/components/policy-pdf-download";
import LiveWorldMap from "@/components/live-world-map";
import APIDocs from "@/components/api-docs";
import { ProviderCoverageMaps } from "@/components/provider-coverage-maps";
import { Loader2, Wifi } from "lucide-react";

export default function Home() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResult = (data: any) => {
    setResult(data);
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Privacy Notice */}
      <section className="py-8 bg-blue-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 bg-white rounded-lg border border-blue-200 p-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Wifi className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Privacy & Data Collection Notice</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Network Connectivity Pings:</strong> Every time you use our IMEI checking service, we automatically perform network connectivity pings to measure your current network performance and compatibility. This helps us provide accurate device analysis and network recommendations. No other private information is collected during these pings.
                </p>
                <p>
                  <strong>Location Services (Optional):</strong> Location data is only collected with your explicit consent when you choose to enable location-based features for enhanced coverage analysis. You can request data deletion at any time by contacting support@dotm.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <IMEIChecker onResult={handleResult} onLoading={handleLoading} />
      
      {isLoading && (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Device...</h3>
              <p className="text-gray-600">Using AI to identify your device and check AT&T compatibility</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div className="bg-primary h-2 rounded-full transition-all duration-1000 w-3/5"></div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {result && !isLoading && (result as any)?.success !== false && <DeviceResults result={result} />}
      
      {/* Coverage Maps Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Network Coverage Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Analyze network coverage and performance in your area. Get real-time insights on provider reliability, recent issues, and coverage quality.
            </p>
          </div>
          <ProviderCoverageMaps />
        </div>
      </section>
      
      {/* API Documentation Section */}
      <APIDocs />
      
      {/* Policy PDF Download Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Device Compatibility Policy
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Download our comprehensive guide to ensure your device is compatible and unlocked before porting your number to DOTM.
            </p>
          </div>
          <PolicyPDFDownload />
        </div>
      </section>
      
      {/* Live World Map - Temporarily Hidden */}
      {/* <LiveWorldMap /> */}
      
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📱</span>
                </div>
                <span className="text-xl font-semibold text-white">Network Services</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Comprehensive network services including IMEI compatibility checking and coverage analysis. 
                Powered by AI for instant insights.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#api" className="text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="/admin" className="text-gray-400 hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2025 Data On Tap Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
