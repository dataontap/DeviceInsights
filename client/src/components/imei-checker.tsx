import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Search, Info, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface IMEICheckerProps {
  onResult: (result: any) => void;
  onLoading: (loading: boolean) => void;
}

export default function IMEIChecker({ onResult, onLoading }: IMEICheckerProps) {
  const [imei, setImei] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const { toast } = useToast();

  const checkIMEIMutation = useMutation({
    mutationFn: async (data: { imei: string; location?: string; network?: string }) => {
      const response = await apiRequest("POST", "/api/v1/check", data);
      return response.json();
    },
    onSuccess: (data) => {
      onLoading(false);
      onResult(data);
      toast({
        title: "Device Analyzed Successfully",
        description: `Found ${data.device.make} ${data.device.model}`,
      });
    },
    onError: (error: any) => {
      onLoading(false);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze device. Please try again.",
        variant: "destructive",
      });
    },
  });

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
    
    const finalLocation = manualLocation || (useCurrentLocation ? undefined : 'unknown');
    
    // Get user's location if they want to use current location
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          checkIMEIMutation.mutate({ imei, location, network: "AT&T" });
        },
        () => {
          // Fallback to manual location or unknown
          checkIMEIMutation.mutate({ imei, location: finalLocation, network: "AT&T" });
        }
      );
    } else {
      checkIMEIMutation.mutate({ imei, location: finalLocation, network: "AT&T" });
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
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Enter your device's IMEI number to instantly discover its 4G, 5G, VoLTE, and Wi-Fi calling capabilities on any network.
        </p>
        
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
            
            <Button 
              type="submit"
              disabled={checkIMEIMutation.isPending || imei.length !== 15}
              className="w-full bg-primary text-white py-3 px-6 text-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Search className="w-5 h-5 mr-2" />
              {checkIMEIMutation.isPending ? "Analyzing..." : "Check Device Compatibility"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
