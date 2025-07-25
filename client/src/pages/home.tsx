import { useState } from "react";
import Navigation from "@/components/navigation";
import IMEIChecker from "@/components/imei-checker";
import DeviceResults from "@/components/device-results";
import AdminDashboard from "@/components/admin-dashboard";
import PolicyPDFDownload from "@/components/policy-pdf-download";
import { Loader2 } from "lucide-react";

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
      
      {result && !isLoading && result.success !== false && <DeviceResults result={result} />}
      
      {/* Policy PDF Download Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Device Compatibility Policy
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Download our comprehensive guide to ensure your device is compatible and unlocked before porting your number to OXIO.
            </p>
          </div>
          <PolicyPDFDownload />
        </div>
      </section>
      
      <div id="admin">
        <AdminDashboard />
      </div>
      
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📱</span>
                </div>
                <span className="text-xl font-semibold text-white">IMEI Checker</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The most accurate IMEI checker for AT&T network compatibility. 
                Powered by AI for instant device identification.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#api" className="text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#admin" className="text-gray-400 hover:text-white transition-colors">Analytics</a></li>
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
            <p className="text-gray-400">© 2024 IMEI Checker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
