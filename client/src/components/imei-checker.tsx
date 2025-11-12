import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Smartphone, Search, Info, MapPin, AlertTriangle, Globe, Radio, ChevronDown, ChevronUp, Wifi, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import NetworkPolicy from "./network-policy";
import BlacklistDrawer from "./blacklist-drawer";
import VoiceHelper from "./voice-helper";
import { DeviceAutoDetection } from "./device-auto-detection";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

// Declare global Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface LocationSnapshot {
  lat?: number;
  lng?: number;
  address?: string;
  source: 'gps' | 'manual';
}

interface IMEICheckerProps {
  onResult: (result: any) => void;
  onLoading: (loading: boolean) => void;
  onRequestCoverage?: (location: LocationSnapshot) => void;
  onRequestIssue?: (location: LocationSnapshot) => void;
  detectedCountry?: string | null;
  onCountryDetected?: (country: string) => void;
}

interface Carrier {
  name: string;
  marketShare: string;
  description: string;
}

export default function IMEIChecker({ onResult, onLoading, onRequestCoverage, onRequestIssue, detectedCountry, onCountryDetected }: IMEICheckerProps) {
  const [imei, setImei] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [deviceResult, setDeviceResult] = useState<any>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [country, setCountry] = useState("");
  const [carriersLoading, setCarriersLoading] = useState(false);
  const [showBlacklistDrawer, setShowBlacklistDrawer] = useState(false);
  const [blacklistInfo, setBlacklistInfo] = useState<{imei?: string; reason?: string}>({});
  const [showVoiceHelper, setShowVoiceHelper] = useState(false);
  const [deviceDetected, setDeviceDetected] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot | null>(null);
  const { toast } = useToast();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const autocompleteUsedRef = useRef(false);

  // Fetch carriers when location changes
  const fetchCarriersMutation = useMutation({
    mutationFn: async (location: string) => {
      console.log("Fetching carriers for location:", location);
      const response = await apiRequest("POST", "/api/carriers", { location });
      const data = await response.json();
      console.log("Carriers API response:", data);
      return data;
    },
    onSuccess: (data) => {
      setCarriersLoading(false);
      setCarriers(data.carriers || []);
      setCountry(data.country || "Unknown");
      console.log("Carriers loaded successfully, country:", data.country);
      // Set "All providers" as default selection
      setSelectedCarrier("ALL_PROVIDERS");
    },
    onError: (error: any) => {
      setCarriersLoading(false);
      console.error("Failed to fetch carriers:", error);
      // Don't provide fallback - show error to user instead
      toast({
        title: "Carrier Fetch Failed",
        description: "Unable to load carriers for this location. Please try again.",
        variant: "destructive",
      });
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
        description: `Found ${data.device.make} ${data.device.model}${selectedCarrier ? ` (${selectedCarrier} compatibility)` : ''}`,
      });
    },
    onError: (error: any) => {
      onLoading(false);

      // Handle blacklisted IMEI specifically
      if (error.response?.status === 403 && error.response?.data?.blacklisted) {
        setBlacklistInfo({
          imei: imei,
          reason: error.response.data.reason || "Security flagged device"
        });
        setShowBlacklistDrawer(true);
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
        setShowPolicy(true);
      }
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

  // Carriers will be loaded when location is detected
  // No default carriers or selection on initial load

  // Handle location changes and carrier fetching
  useEffect(() => {
    // Don't clear carrier if it's already ALL_PROVIDERS (preserve default after carrier load)
    if (selectedCarrier !== "ALL_PROVIDERS") {
      setSelectedCarrier("");
    }
    
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
              const detectedCountry = geoData.countryName || "Unknown";
              
              console.log("GPS Geocoding result:", geoData);
              console.log("GPS Detected country:", detectedCountry);
              setCountry(detectedCountry);
              fetchCarriersMutation.mutate(detectedCountry);
            } catch (error) {
              console.error("Geocoding failed:", error);
              setCarriersLoading(false);
              toast({
                title: "Location Detection Failed",
                description: "Unable to detect your location. Please enter it manually.",
                variant: "destructive",
              });
            }
          },
          () => {
            setCarriersLoading(false);
            toast({
              title: "Location Permission Denied",
              description: "Please allow location access or enter your location manually.",
              variant: "destructive",
            });
          }
        );
      }
    }
    // Manual typing no longer triggers carrier search - only autocomplete selection does
    
    // Reset autocomplete flag when user starts typing again
    if (manualLocation.length === 0) {
      autocompleteUsedRef.current = false;
    }
  }, [manualLocation, useCurrentLocation]);

  // Initialize Google Maps Autocomplete  
  useEffect(() => {
    if (!locationInputRef.current || !window.google?.maps?.places) {
      return;
    }

    // Use detected country (from props or window global) to bias autocomplete results
    const biasCountry = detectedCountry || (window as any).__detectedCountry;
    
    // Create autocomplete instance with location biasing
    const autocompleteOptions: any = {
      types: ['(regions)'], // Cities, regions, countries
      fields: ['address_components', 'formatted_address', 'geometry']
    };
    
    // Bias results based on detected country
    if (biasCountry) {
      // Country-specific coordinate biasing for better local results
      const countryBounds: { [key: string]: any } = {
        'Canada': {
          north: 83.11, south: 41.68, east: -52.62, west: -141.00
        },
        'United States': {
          north: 49.38, south: 24.52, east: -66.95, west: -124.77
        },
        'United Kingdom': {
          north: 60.86, south: 49.96, east: 1.76, west: -8.65
        },
        'France': {
          north: 51.09, south: 41.33, east: 9.56, west: -5.14
        }
      };
      
      if (countryBounds[biasCountry]) {
        autocompleteOptions.bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(countryBounds[biasCountry].south, countryBounds[biasCountry].west),
          new window.google.maps.LatLng(countryBounds[biasCountry].north, countryBounds[biasCountry].east)
        );
        autocompleteOptions.strictBounds = false; // Allow results outside bounds but prioritize within
      }
    }
    
    autocompleteRef.current = new window.google.maps.places.Autocomplete(locationInputRef.current, autocompleteOptions);

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (place?.address_components) {
        // Extract country from address components
        const countryComponent = place.address_components.find(
          (component: any) => component.types.includes('country')
        );
        
        if (countryComponent) {
          const detectedCountry = countryComponent.long_name;
          console.log("Google Maps autocomplete detected country:", detectedCountry);
          
          // Mark that autocomplete was used to prevent manual parsing
          autocompleteUsedRef.current = true;
          
          // Clear selected carrier when location changes
          setSelectedCarrier("");
          setCountry(detectedCountry);
          setManualLocation(place.formatted_address || '');
          setCarriersLoading(true);
          fetchCarriersMutation.mutate(detectedCountry);
        }
      }
    });

    return () => {
      // Cleanup
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [detectedCountry]); // Re-initialize when detected country changes

  // Update locationSnapshot when location data changes
  useEffect(() => {
    if (useCurrentLocation) {
      // Get GPS coordinates for location snapshot
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Try to get address from reverse geocoding
            try {
              const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
              const geoData = await geoResponse.json();
              const address = geoData.city ? `${geoData.city}, ${geoData.countryName}` : geoData.countryName;
              
              setLocationSnapshot({
                lat,
                lng,
                address: address || 'Current Location',
                source: 'gps'
              });
            } catch (error) {
              // Even if geocoding fails, we have coordinates
              setLocationSnapshot({
                lat,
                lng,
                address: 'Current Location',
                source: 'gps'
              });
            }
          },
          () => {
            // GPS failed, clear location snapshot
            setLocationSnapshot(null);
          }
        );
      }
    } else if (manualLocation && manualLocation.trim().length > 0) {
      // Manual location input
      // Check if autocomplete was used (which provides coordinates)
      if (autocompleteRef.current) {
        const place = autocompleteRef.current.getPlace?.();
        if (place?.geometry?.location) {
          setLocationSnapshot({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: manualLocation,
            source: 'manual'
          });
          return;
        }
      }
      
      // No coordinates available, just address
      setLocationSnapshot({
        address: manualLocation,
        source: 'manual'
      });
    } else {
      // No location data
      setLocationSnapshot(null);
    }
  }, [useCurrentLocation, manualLocation]);

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

  const handleQuickCheck = (detectedImei: string) => {
    // Set the IMEI
    setImei(detectedImei);
    
    // Trigger the check after a short delay to allow state to update
    setTimeout(() => {
      onLoading(true);
      
      // Use current location if available, otherwise use detected country
      if (useCurrentLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = `${position.coords.latitude},${position.coords.longitude}`;
            checkIMEIMutation.mutate({ imei: detectedImei, location, network: selectedCarrier });
          },
          () => {
            const finalLocation = manualLocation || country || 'unknown';
            checkIMEIMutation.mutate({ imei: detectedImei, location: finalLocation, network: selectedCarrier });
          }
        );
      } else {
        const finalLocation = manualLocation || country || 'unknown';
        checkIMEIMutation.mutate({ imei: detectedImei, location: finalLocation, network: selectedCarrier });
      }
    }, 100);
  };

  const handleDeviceDetected = (detected: boolean) => {
    setDeviceDetected(detected);
    if (!detected) {
      setIsAdvancedOpen(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary to-secondary text-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Pretty Good Network Services Discovery Tool
        </h1>
        <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
          Enter your device's IMEI number to instantly discover its 4G, 5G, VoLTE, and Wi-Fi calling capabilities on any network.
        </p>

        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto">
          {/* Auto-Detection Component */}
          <DeviceAutoDetection 
            onQuickCheck={handleQuickCheck} 
            onDeviceDetected={handleDeviceDetected}
            onCountryDetected={(country) => {
              // Pass country up to Home component and store globally for fallback
              if (onCountryDetected) {
                onCountryDetected(country);
              }
              (window as any).__detectedCountry = country;
            }}
          />
          
          <form onSubmit={handleSubmit}>
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

                <div className="relative hidden">
                  <Input
                    ref={locationInputRef}
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
                    data-testid="input-location"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Location helps us provide more accurate network coverage information for your area.
                </p>

                {/* Coverage Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button
                    type="button"
                    onClick={() => onRequestCoverage?.(locationSnapshot!)}
                    disabled={!locationSnapshot || !locationSnapshot.lat || !locationSnapshot.lng}
                    variant="default"
                    className="flex-1"
                    data-testid="button-analyze-coverage"
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Analyze Coverage
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onRequestIssue?.(locationSnapshot!)}
                    disabled={!locationSnapshot || !locationSnapshot.lat || !locationSnapshot.lng}
                    variant="secondary"
                    className="flex-1 bg-sky-400 hover:bg-sky-500 text-white"
                    data-testid="button-report-issue"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Report an Issue
                  </Button>
                </div>
              </div>
            </div>

            {deviceDetected ? (
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="mb-6">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-between text-left text-gray-700 hover:bg-gray-50"
                    data-testid="button-advanced-search"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Advanced search
                    </span>
                    {isAdvancedOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="text-left">
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
                        data-testid="input-imei"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Smartphone className="text-gray-400 w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <Info className="w-4 h-4 mr-1 text-accent" />
                      To find your IMEI, dial{" "}
                      <code 
                        className="bg-gray-100 px-2 py-1 rounded text-gray-800 mx-1 cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
                        onClick={() => setShowVoiceHelper(true)}
                        data-testid="code-imei-help"
                      >
                        *#06#
                      </code>{" "}
                      on your device
                    </p>
                    {showVoiceHelper && <VoiceHelper trigger={null} autoOpen={true} deviceInfo={deviceResult?.device} />}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
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
                    data-testid="input-imei"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Smartphone className="text-gray-400 w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 flex items-center">
                  <Info className="w-4 h-4 mr-1 text-accent" />
                  To find your IMEI, dial{" "}
                  <code 
                    className="bg-gray-100 px-2 py-1 rounded text-gray-800 mx-1 cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
                    onClick={() => setShowVoiceHelper(true)}
                    data-testid="code-imei-help"
                  >
                    *#06#
                  </code>{" "}
                  on your device
                </p>
                {showVoiceHelper && <VoiceHelper trigger={null} autoOpen={true} deviceInfo={deviceResult?.device} />}
              </div>
            )}

            {/* Carrier Selection Section - Only show when we have location */}
            {(country || carriers.length > 0) && (
              <div className="text-left mb-6">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 mr-1 inline text-primary" />
                  Network Carrier{country ? ` for ${country}` : ''}
                </Label>

                {carriersLoading ? (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-blue-600">Finding top carriers in your area...</span>
                  </div>
                ) : carriers.length > 0 ? (
                  <div className="space-y-3">
                    <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                      <SelectTrigger className="w-full text-gray-700 dark:text-gray-200">
                        <SelectValue placeholder="Select a carrier" className="text-gray-700 dark:text-gray-200" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        <SelectItem value="ALL_PROVIDERS" className="text-gray-700 dark:text-gray-200 focus:text-gray-900 dark:focus:text-white">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-primary" />
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-100">All providers</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Check compatibility with all carriers</div>
                            </div>
                          </div>
                        </SelectItem>
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

                    {selectedCarrier && selectedCarrier === "ALL_PROVIDERS" && (
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                          <strong className="text-blue-800 dark:text-blue-100">All providers:</strong> Analyzes compatibility across all major carriers in {country}.
                        </p>
                      </div>
                    )}
                    {selectedCarrier && selectedCarrier !== "ALL_PROVIDERS" && carriers.find(c => c.name === selectedCarrier) && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          <strong className="text-gray-800 dark:text-gray-100">{selectedCarrier}:</strong> {carriers.find(c => c.name === selectedCarrier)?.description}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Select "All providers" for comprehensive compatibility across carriers, or choose a specific carrier for detailed analysis.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            <Button 
              type="submit"
              disabled={checkIMEIMutation.isPending || imei.length !== 15}
              className="w-full bg-primary text-white py-3 px-6 text-lg hover:bg-blue-700 disabled:opacity-50"
              data-testid="button-check-compatibility"
            >
              <Search className="w-5 h-5 mr-2" />
              {checkIMEIMutation.isPending ? "Analyzing..." : selectedCarrier === "ALL_PROVIDERS" ? "Check Network Compatibility" : `Check ${selectedCarrier} Compatibility`}
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

      {/* Blacklist Drawer */}
      <BlacklistDrawer
        open={showBlacklistDrawer}
        onOpenChange={(open) => {
          setShowBlacklistDrawer(open);
          if (!open) {
            // Reset form when drawer is closed
            setImei("");
            setBlacklistInfo({});
          }
        }}
        imei={blacklistInfo.imei}
        reason={blacklistInfo.reason}
      />
    </section>
  );
}