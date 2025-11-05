import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Smartphone, Wifi, MapPin, Globe } from "lucide-react";
import { getDeviceDetectionData } from "@/lib/device-detection";
import { apiRequest } from "@/lib/queryClient";

interface DetectionData {
  success: boolean;
  ipAddress?: string;
  isp?: string;
  city?: string;
  region?: string;
  country?: string;
  userAgent?: string;
  location?: { latitude: number; longitude: number };
  deviceDetected: boolean;
  device?: {
    make: string;
    model: string;
    tac: string;
    exampleImei: string;
  };
  connectionType?: string;
  effectiveType?: string;
}

interface DeviceAutoDetectionProps {
  onQuickCheck?: (imei: string) => void;
}

export function DeviceAutoDetection({ onQuickCheck }: DeviceAutoDetectionProps) {
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user previously dismissed
    const dismissed = localStorage.getItem('device-detection-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }

    // Auto-detect device on mount
    detectDevice();
  }, []);

  const detectDevice = async () => {
    try {
      setIsLoading(true);
      
      // Get device info from browser
      const browserData = await getDeviceDetectionData();
      
      // Build device model string
      const deviceModel = browserData.device.make && browserData.device.model 
        ? `${browserData.device.make} ${browserData.device.model}`
        : browserData.device.model || '';
      
      // Send to backend for enrichment
      const response = await apiRequest<DetectionData>('/api/detect-device', {
        method: 'POST',
        body: JSON.stringify({
          deviceModel,
          userAgent: navigator.userAgent,
          location: browserData.location,
        }),
      });
      
      // Add connection info from browser
      const enrichedData = {
        ...response,
        connectionType: browserData.connection.type,
        effectiveType: browserData.connection.effectiveType,
      };
      
      setDetectionData(enrichedData);
    } catch (error) {
      console.error('Device detection failed:', error);
      // Fail silently - user can still use manual IMEI entry
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('device-detection-dismissed', 'true');
  };

  const handleCheckDevice = () => {
    if (detectionData?.device?.exampleImei && onQuickCheck) {
      onQuickCheck(detectionData.device.exampleImei);
      handleDismiss();
    }
  };

  // Don't show if dismissed, loading, or no data
  if (isDismissed || isLoading || !detectionData) {
    return null;
  }

  // Only show if device was detected
  if (!detectionData.deviceDetected || !detectionData.device) {
    return null;
  }

  return (
    <Card 
      className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 relative"
      data-testid="card-auto-detection"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={handleDismiss}
        data-testid="button-dismiss-detection"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <CardContent className="pt-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
            <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
              Device Detected
            </h3>
            
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <span data-testid="text-detected-device">
                  <strong>{detectionData.device.make} {detectionData.device.model}</strong>
                </span>
              </div>
              
              {detectionData.isp && (
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-gray-500" />
                  <span data-testid="text-detected-isp">
                    {detectionData.isp}
                    {detectionData.connectionType && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({detectionData.connectionType === 'cellular' ? 'Mobile' : 'WiFi'}
                        {detectionData.effectiveType && ` - ${detectionData.effectiveType.toUpperCase()}`})
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              {detectionData.city && detectionData.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span data-testid="text-detected-location">
                    {detectionData.city}, {detectionData.region && `${detectionData.region}, `}{detectionData.country}
                  </span>
                </div>
              )}
              
              {detectionData.ipAddress && detectionData.ipAddress !== 'unknown' && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500" data-testid="text-detected-ip">
                    {detectionData.ipAddress}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCheckDevice}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-check-this-device"
              >
                Check This Device
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDismiss}
                data-testid="button-enter-different-imei"
              >
                Enter Different IMEI
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
