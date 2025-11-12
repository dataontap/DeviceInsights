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
  onDeviceDetected?: (detected: boolean) => void;
}

export function DeviceAutoDetection({ onQuickCheck, onDeviceDetected }: DeviceAutoDetectionProps) {
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-detect device on mount
    detectDevice();
  }, []);

  useEffect(() => {
    // Notify parent when device detection status changes
    if (onDeviceDetected) {
      const hasValidDevice = detectionData?.device?.exampleImei && !isDismissed;
      onDeviceDetected(!!hasValidDevice);
    }
  }, [detectionData, isDismissed, onDeviceDetected]);

  const detectDevice = async () => {
    try {
      setIsLoading(true);
      
      // Get device info from browser
      const browserData = await getDeviceDetectionData();
      
      // Build device model string
      const deviceModel = browserData.device.make && browserData.device.model 
        ? `${browserData.device.make} ${browserData.device.model}`
        : browserData.device.model || '';
      
      console.log('Device detection - User Agent:', navigator.userAgent);
      console.log('Device detection - Parsed device:', deviceModel);
      console.log('Device detection - Full data:', browserData.device);
      
      // Send to backend for enrichment
      const response = await fetch('/api/detect-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceModel,
          userAgent: navigator.userAgent,
          location: browserData.location,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Device detection API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to detect device: ${response.status} ${response.statusText}`);
      }
      
      const data: DetectionData = await response.json();
      console.log('Device detection API success:', data);
      
      // Add connection info from browser
      const enrichedData = {
        ...data,
        connectionType: browserData.connection.type,
        effectiveType: browserData.connection.effectiveType,
      };
      
      setDetectionData(enrichedData);
    } catch (error) {
      console.error('Device detection failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      // Fail silently - user can still use manual IMEI entry
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
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

  // Check if we have useful information to display
  const hasDevice = detectionData.device;
  const hasValidIsp = detectionData.isp && detectionData.isp !== 'Unknown ISP';
  const hasLocation = detectionData.city && detectionData.country;
  
  // Check if IP is public (not private/local)
  const isPublicIP = detectionData.ipAddress && 
    detectionData.ipAddress !== 'unknown' &&
    !detectionData.ipAddress.startsWith('127.') &&
    !detectionData.ipAddress.startsWith('192.168.') &&
    !detectionData.ipAddress.startsWith('10.') &&
    !detectionData.ipAddress.startsWith('172.16.') &&
    !detectionData.ipAddress.startsWith('172.17.') &&
    !detectionData.ipAddress.startsWith('172.18.') &&
    !detectionData.ipAddress.startsWith('172.19.') &&
    !detectionData.ipAddress.startsWith('172.20.') &&
    !detectionData.ipAddress.startsWith('172.21.') &&
    !detectionData.ipAddress.startsWith('172.22.') &&
    !detectionData.ipAddress.startsWith('172.23.') &&
    !detectionData.ipAddress.startsWith('172.24.') &&
    !detectionData.ipAddress.startsWith('172.25.') &&
    !detectionData.ipAddress.startsWith('172.26.') &&
    !detectionData.ipAddress.startsWith('172.27.') &&
    !detectionData.ipAddress.startsWith('172.28.') &&
    !detectionData.ipAddress.startsWith('172.29.') &&
    !detectionData.ipAddress.startsWith('172.30.') &&
    !detectionData.ipAddress.startsWith('172.31.') &&
    !detectionData.ipAddress.startsWith('169.254.');
  
  // Only show card if we have at least one useful piece of information
  if (!hasDevice && !hasValidIsp && !hasLocation && !isPublicIP) {
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
            {detectionData.device && (
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2" data-testid="text-detected-device">
                {detectionData.device.make} {detectionData.device.model}
              </h3>
            )}
            
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
              {detectionData.isp && detectionData.isp !== 'Unknown ISP' && (
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
              
              {isPublicIP && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500" data-testid="text-detected-ip">
                    {detectionData.ipAddress}
                  </span>
                </div>
              )}
            </div>
            
            {detectionData.device?.exampleImei && (
              <Button 
                onClick={handleCheckDevice}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-check-this-device"
              >
                Check This Device
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
