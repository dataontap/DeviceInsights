import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, Search, Info, MapPin, AlertTriangle, Globe, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import NetworkPolicy from "./network-policy";

interface IMEICheckerProps {
  onResult: (result: any) => void;
  onLoading: (loading: boolean) => void;
}

interface Carrier {
  name: string;
  marketShare: string;
  description: string;
}

export default function IMEIChecker({ onResult, onLoading }: IMEICheckerProps) {
  const [imei, setImei] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [deviceResult, setDeviceResult] = useState<any>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState("AT&T");
  const [country, setCountry] = useState("United States");
  const [carriersLoading, setCarriersLoading] = useState(false);
  const { toast } = useToast();

  // Fetch carriers when location changes
  const fetchCarriersMutation = useMutation({
    mutationFn: async (location: string) => {
      const response = await apiRequest("POST", "/api/carriers", { location });
      return response.json();
    },
    onSuccess: (data) => {
      setCarriersLoading(false);
      setCarriers(data.carriers || []);
      setCountry(data.country || "Unknown");
      
      // Auto-select appropriate default carrier
      if (data.carriers && data.carriers.length > 0) {
        const isUS = data.country === "United States" || data.country === "US";
        
        if (isUS) {
          // For US, prefer AT&T if available, otherwise use largest
          const attCarrier = data.carriers.find((c: Carrier) => c.name === "AT&T");
          setSelectedCarrier(attCarrier ? "AT&T" : data.carriers[0].name);
        } else {
          // For other countries, use the largest carrier (first in list)
          setSelectedCarrier(data.carriers[0].name);
        }
      }
    },
    onError: (error: any) => {
      setCarriersLoading(false);
      console.error("Failed to fetch carriers:", error);
      // Keep default US/AT&T on error
      setCarriers([{ name: "AT&T", marketShare: "45.4%", description: "Default carrier for compatibility testing" }]);
      setCountry("United States");
      setSelectedCarrier("AT&T");
    },
  });

  const checkIMEIMutation = useMutation({
    mutationFn: async (data: { imei: string; location?: string; network?: string }) => {
      const response = await apiRequest("POST", "/api/check", data);
      return response.json();
    },
    onSuccess: (data) => {
      onLoading(false);
      setDeviceResult(data);
      setShowPolicy(true);
      toast({
        title: "Device Analyzed Successfully",
        description: `Found ${data.device.make} ${data.device.model} (${selectedCarrier} compatibility)`,
      });
    },
    onError: (error: any) => {
      onLoading(false);
      
      // Handle blacklisted IMEI specifically
      if (error.response?.status === 403 && error.response?.data?.blacklisted) {
        toast({
          title: "Blacklisted Device",
          description: "It looks like the device IMEI you provided is on the 'naughty list'. Please contact support.",
          variant: "destructive",
        });
        setDeviceResult({ 
          success: false, 
          error: error.response.data.message,
          blacklisted: true 
        });
      } else {
        setDeviceResult({ success: false, error: error.message });
        toast({
          title: "Analysis Failed",
          description: error.message || "Failed to analyze device. Please try again.",
          variant: "destructive",
        });
      }
      
      setShowPolicy(true);
    },
  });

  const policyAcceptanceMutation = useMutation({
    mutationFn: async (data: { accepted: boolean; searchId?: number; deviceInfo?: any }) => {
      const response = await apiRequest("POST", "/api/policy/accept", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Policy Recorded",
        description: "Your preference has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Recording Failed",
        description: "Failed to record policy acceptance.",
        variant: "destructive",
      });
    },
  });

  // Initialize carriers with US defaults
  useEffect(() => {
    setCarriers([{ name: "AT&T", marketShare: "45.4%", description: "Largest US carrier with nationwide 5G coverage" }]);
  }, []);

  // Handle location changes and carrier fetching
  useEffect(() => {
    if (useCurrentLocation) {
      // When using current location, get GPS coordinates first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Use reverse geocoding to determine country
            try {
              setCarriersLoading(true);
              const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
              const geoData = await geoResponse.json();
              const detectedCountry = geoData.countryName || "United States";
              
              setCountry(detectedCountry);
              fetchCarriersMutation.mutate(detectedCountry);
            } catch (error) {
              // Fallback to US if geolocation fails
              setCountry("United States");
              fetchCarriersMutation.mutate("United States");
            }
          },
          () => {
            // Fallback to US if geolocation permission denied
            setCountry("United States");
            setCarriersLoading(true);
            fetchCarriersMutation.mutate("United States");
          }
        );
      }
    } else if (manualLocation && manualLocation.length > 2) {
      // For manual location, extract/detect country and fetch carriers
      const timer = setTimeout(() => {
        setCarriersLoading(true);
        // Update country based on manual location
        const locationParts = manualLocation.split(',');
        const potentialCountry = locationParts[locationParts.length - 1].trim();
        
        // If it looks like a country name or if location contains specific countries
        if (manualLocation.toLowerCase().includes('lithuania')) {
          setCountry('Lithuania');
          fetchCarriersMutation.mutate('Lithuania');
        } else if (manualLocation.toLowerCase().includes('canada')) {
          setCountry('Canada');
          fetchCarriersMutation.mutate('Canada');
        } else if (manualLocation.toLowerCase().includes('uk') || manualLocation.toLowerCase().includes('united kingdom') || manualLocation.toLowerCase().includes('england')) {
          setCountry('United Kingdom');
          fetchCarriersMutation.mutate('United Kingdom');
        } else {
          // Default to extracting country or assume US
          const country = potentialCountry.length > 15 ? "United States" : potentialCountry;
          setCountry(country);
          fetchCarriersMutation.mutate(country);
        }
      }, 1000); // 1 second delay to avoid too many API calls

      return () => clearTimeout(timer);
    }
  }, [manualLocation, useCurrentLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imei.trim()) {
      toast({
        title: "IMEI Required",
        description: "Please enter a valid IMEI number",
        variant: "destructive",
      });
      return;
    }

    if (imei.length !== 15) {
      toast({
        title: "Invalid IMEI",
        description: "IMEI must be exactly 15 digits",
        variant: "destructive",
      });
      return;
    }

    onLoading(true);
    
    // Determine final location for IMEI check
    let finalLocation = "";
    
    if (useCurrentLocation && navigator.geolocation) {
      // Use GPS coordinates for current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          checkIMEIMutation.mutate({ imei, location, network: selectedCarrier });
        },
        () => {
          // Fallback to manual location or country name
          finalLocation = manualLocation || country || 'unknown';
          checkIMEIMutation.mutate({ imei, location: finalLocation, network: selectedCarrier });
        }
      );
    } else {
      // Use manual location or detected country
      finalLocation = manualLocation || country || 'unknown';
      checkIMEIMutation.mutate({ imei, location: finalLocation, network: selectedCarrier });
    }
  };

  const handleIMEIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
    setImei(value);
  };

  return (
    <section className="bg-gradient-to-br from-primary to-secondary text-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Check Your Device's Network Compatibility
        </h1>
        <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
          Enter your device's IMEI number to instantly discover its 4G, 5G, VoLTE, and Wi-Fi calling capabilities on any network.
        </p>
        
        {/* Alpha Service Banner */}
        <div className="mb-8 p-3 bg-orange-50 border border-orange-200 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center gap-2 justify-center">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-medium text-orange-800">
              Alpha Service - Results are tentative and experimental. Use with caution.
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="text-left mb-6">
              <Label htmlFor="imei" className="block text-sm font-medium text-gray-700 mb-2">
                Device IMEI Number
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  id="imei"
                  value={imei}
                  onChange={handleIMEIChange}
                  placeholder="Enter 15-digit IMEI number"
                  className={`w-full text-lg pr-10 ${
                    imei.length === 15 ? 'border-success' : 'border-gray-300'
                  }`}
                  maxLength={15}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Smartphone className="text-gray-400 w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <Info className="w-4 h-4 mr-1 text-accent" />
                To find your IMEI, dial <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 mx-1">*#06#</code> on your device
              </p>
            </div>

            {/* Location Section */}
            <div className="text-left mb-6 space-y-4">
              <Label className="block text-sm font-medium text-gray-700">
                Location (Optional)
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useCurrentLocation"
                    checked={useCurrentLocation}
                    onChange={(e) => {
                      setUseCurrentLocation(e.target.checked);
                      if (e.target.checked) {
                        setManualLocation(""); // Clear manual location if using current
                      }
                    }}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="useCurrentLocation" className="text-sm text-gray-700 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-primary" />
                    Use my current location
                  </label>
                </div>
                
                <div className="relative">
                  <Input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => {
                      setManualLocation(e.target.value);
                      if (e.target.value) {
                        setUseCurrentLocation(false); // Clear current location if typing manually
                      }
                    }}
                    placeholder="Or enter your location (e.g., New York, NY)"
                    className="w-full text-sm"
                    disabled={useCurrentLocation}
                  />
                </div>
                
                <p className="text-xs text-gray-500">
                  Location helps us provide more accurate network coverage information for your area.
                </p>
              </div>
            </div>

            {/* Carrier Selection Section */}
            <div className="text-left mb-6">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 mr-1 inline text-primary" />
                Network Carrier for {country}
              </Label>
              
              {carriersLoading ? (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-blue-600">Finding top carriers in your area...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                    <SelectTrigger className="w-full text-gray-700 dark:text-gray-200">
                      <SelectValue placeholder="Select a carrier" className="text-gray-700 dark:text-gray-200" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      {carriers.map((carrier) => (
                        <SelectItem key={carrier.name} value={carrier.name} className="text-gray-700 dark:text-gray-200 focus:text-gray-900 dark:focus:text-white">
                          <div className="flex items-center space-x-2">
                            <Radio className="w-4 h-4 text-primary" />
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-100">{carrier.name}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{carrier.marketShare} market share</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedCarrier && carriers.find(c => c.name === selectedCarrier) && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        <strong className="text-gray-800 dark:text-gray-100">{selectedCarrier}:</strong> {carriers.find(c => c.name === selectedCarrier)?.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Defaults to AT&T (US). Carriers automatically detected based on your location.
              </p>
            </div>
            
            <Button 
              type="submit"
              disabled={checkIMEIMutation.isPending || imei.length !== 15}
              className="w-full bg-primary text-white py-3 px-6 text-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Search className="w-5 h-5 mr-2" />
{checkIMEIMutation.isPending ? "Analyzing..." : `Check ${selectedCarrier || 'Network'} Compatibility`}
            </Button>
          </form>
        </div>
      </div>

      {/* Network Policy Modal */}
      {showPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <NetworkPolicy
              onAccept={(accepted) => {
                const isSuccess = deviceResult?.success !== false;
                const deviceInfo = deviceResult?.device ? {
                  make: deviceResult.device.make,
                  model: deviceResult.device.model,
                  compatible: isSuccess
                } : undefined;

                policyAcceptanceMutation.mutate({
                  accepted,
                  searchId: deviceResult?.searchId,
                  deviceInfo
                });

                setShowPolicy(false);
                
                if (accepted) {
                  onResult(deviceResult);
                } else {
                  toast({
                    title: "Analysis Declined",
                    description: "You must accept the policy to view results.",
                    variant: "destructive",
                  });
                }
              }}
              isSuccess={deviceResult?.success !== false}
              deviceInfo={deviceResult?.device}
            />
          </div>
        </div>
      )}
    </section>
  );
}
