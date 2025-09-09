import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Info, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NetworkPolicyProps {
  onAccept: (accepted: boolean) => void;
  isSuccess?: boolean;
  deviceInfo?: {
    make: string;
    model: string;
    capabilities?: {
      fourG: boolean;
      fiveG: boolean;
      volte: boolean;
      wifiCalling: string;
    };
  };
}

export default function NetworkPolicy({ onAccept, isSuccess, deviceInfo }: NetworkPolicyProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    onAccept(true);
  };

  const handleDecline = () => {
    onAccept(false);
  };

  const getNetworkStatusMessage = () => {
    if (!deviceInfo) return null;
    
    if (isSuccess) {
      return (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              Device Compatible with DOTM Network
            </p>
            <p className="text-sm text-green-600 dark:text-green-300">
              Your {deviceInfo.make} {deviceInfo.model} supports DOTM's network features
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Limited Network Compatibility
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              Your device may have reduced functionality on DOTM network
            </p>
          </div>
        </div>
      );
    }
  };

  const getCapabilityBadges = () => {
    if (!deviceInfo?.capabilities) return null;

    const capabilities = deviceInfo.capabilities;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        <Badge variant={capabilities.fourG ? "default" : "secondary"}>
          4G LTE: {capabilities.fourG ? "Supported" : "Not Supported"}
        </Badge>
        <Badge variant={capabilities.fiveG ? "default" : "secondary"}>
          5G: {capabilities.fiveG ? "Supported" : "Not Supported"}
        </Badge>
        <Badge variant={capabilities.volte ? "default" : "secondary"}>
          VoLTE: {capabilities.volte ? "Supported" : "Not Supported"}
        </Badge>
        <Badge variant={capabilities.wifiCalling === "supported" ? "default" : "secondary"}>
          WiFi Calling: {capabilities.wifiCalling}
        </Badge>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <CardTitle>DOTM Network Policy & Terms</CardTitle>
        </div>
        <CardDescription>
          Please review our network usage policy and device compatibility information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Alpha Service Warning */}
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200 text-sm">
                ⚠️ ALPHA SERVICE NOTICE
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                This service is in early testing phase. All results are tentative and experimental. 
                Device compatibility information may not be 100% accurate. Use at your own discretion.
              </p>
            </div>
          </div>
        </div>

        {getNetworkStatusMessage()}
        {getCapabilityBadges()}
        
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Data Collection & Usage</h4>
              <p className="text-sm text-muted-foreground mt-1">
                We collect device IMEI information solely for network compatibility analysis. 
                This data helps us provide accurate service recommendations and improve our network coverage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Privacy Protection</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Your device information is encrypted and stored securely. We do not share IMEI data 
                with third parties and use it exclusively for network optimization purposes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Network Compatibility Notice</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Device compatibility results are based on technical specifications. Actual network 
                performance may vary depending on location, network traffic, and device condition. 
                DOTM does not guarantee specific service levels for all devices.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Data Retention</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Device analysis data is retained for 12 months for service improvement purposes. 
                You may request data deletion by contacting DOTM customer support at any time.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="policy-accept" 
              checked={accepted} 
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <label 
              htmlFor="policy-accept" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I acknowledge this is an Alpha service and agree to the DOTM Network Policy and Terms of Service
            </label>
          </div>
          
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={handleAccept} 
              disabled={!accepted}
              className="flex-1"
            >
              Accept & Continue
            </Button>
            <Button 
              onClick={handleDecline} 
              variant="outline"
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p>
            Last updated: January 2025. Alpha version - Use with caution. For questions about this policy, contact DOTM support at support@dotm.ca
          </p>
        </div>
      </CardContent>
    </Card>
  );
}