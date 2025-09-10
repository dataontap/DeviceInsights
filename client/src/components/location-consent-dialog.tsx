import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, MapPin, Shield, Eye, Trash2, Settings } from "lucide-react";

interface LocationConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (granted: boolean) => void;
}

export function LocationConsentDialog({ isOpen, onClose, onConsent }: LocationConsentDialogProps) {
  const handleAccept = () => {
    onConsent(true);
    onClose();
  };

  const handleDecline = () => {
    onConsent(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Enable Location Services</CardTitle>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            We'd like to use your location to provide enhanced network analysis and coverage insights. Here's what you need to know:
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* What We Collect */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                What We Collect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  Your approximate location (city/region level)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  Network performance data in your area
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  Carrier coverage information for your region
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Enhanced Services You'll Get
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <strong>Regional Coverage Maps:</strong> Detailed network coverage for your specific area
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <strong>Provider Comparisons:</strong> Real-time performance data comparing carriers in your location
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <strong>Personalized Recommendations:</strong> Device and plan suggestions optimized for your area
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Your Privacy & Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  Location access is <strong>completely optional</strong> - you can use our service without it
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  You can disable location services anytime in your browser settings
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  We automatically perform network connectivity pings to measure performance
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <strong>Data deletion:</strong> Contact rbm@dotmobile.app to request all data deletion
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Data Retention</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  All location and network data can be deleted at any time upon request. We respect your privacy choices and make it easy to control your data.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleDecline} variant="outline" className="flex-1">
              No Thanks - Use Basic Service
            </Button>
            <Button onClick={handleAccept} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Enable Location Services
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}