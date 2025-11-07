import { Signal, Radio, Phone, Wifi, CheckCircle, AlertTriangle, XCircle, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingComparison } from "./pricing-comparison";

interface DeviceResultsProps {
  result: {
    device: {
      make: string;
      model: string;
      year?: number;
      modelNumber?: string;
      imei: string;
    };
    networkCompatibility?: {
      fourG: boolean;
      fiveG: boolean;
      volte: boolean;
      wifiCalling: string;
    };
    capabilities?: {
      fourG: boolean;
      fiveG: boolean;
      volte: boolean;
      wifiCalling: string;
    };
    specifications?: {
      networkBands?: string;
      releaseYear?: number;
      carrierVariant?: string;
    };
    analysis?: string;
    tacAnalysis?: string;
    location?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export default function DeviceResults({ result }: DeviceResultsProps) {
  // Use networkCompatibility if available, fallback to capabilities
  const deviceCapabilities = result.networkCompatibility || result.capabilities || {
    fourG: false,
    fiveG: false,
    volte: false,
    wifiCalling: 'not_supported'
  };

  const handleCoverageAnalysis = () => {
    // Build URL with location parameters
    let url = '/coverage-maps';
    const params = new URLSearchParams();
    
    if (result.coordinates) {
      params.set('lat', result.coordinates.lat.toString());
      params.set('lng', result.coordinates.lng.toString());
    }
    if (result.location) {
      params.set('address', result.location);
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    window.location.href = url;
  };

  const getCapabilityStatus = (capability: boolean | string) => {
    if (typeof capability === 'boolean') {
      return capability ? 'supported' : 'not_supported';
    }
    return capability;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'supported':
      case 'true':
        return {
          icon: CheckCircle,
          text: 'Supported',
          bgColor: 'bg-success/5',
          borderColor: 'border-success/20',
          iconBg: 'bg-success/10',
          iconColor: 'text-success',
          badgeColor: 'bg-success'
        };
      case 'limited':
        return {
          icon: AlertTriangle,
          text: 'Limited',
          bgColor: 'bg-warning/5',
          borderColor: 'border-warning/20',
          iconBg: 'bg-warning/10',
          iconColor: 'text-warning',
          badgeColor: 'bg-warning'
        };
      default:
        return {
          icon: XCircle,
          text: 'Not Supported',
          bgColor: 'bg-destructive/5',
          borderColor: 'border-destructive/20',
          iconBg: 'bg-destructive/10',
          iconColor: 'text-destructive',
          badgeColor: 'bg-destructive'
        };
    }
  };

  const capabilityList = [
    {
      title: '4G LTE Data',
      description: 'Full compatibility with DOTM\'s 4G LTE network',
      icon: Signal,
      status: getCapabilityStatus(deviceCapabilities.fourG),
      details: 'Up to 150 Mbps'
    },
    {
      title: '5G Data',
      description: 'Compatible with DOTM\'s 5G network',
      icon: Radio,
      status: getCapabilityStatus(deviceCapabilities.fiveG),
      details: 'Up to 1 Gbps'
    },
    {
      title: 'VoLTE',
      description: 'Voice over LTE for HD calling',
      icon: Phone,
      status: getCapabilityStatus(deviceCapabilities.volte),
      details: 'HD Voice'
    },
    {
      title: 'Wi-Fi Calling',
      description: deviceCapabilities.wifiCalling === 'limited' 
        ? 'Requires carrier provisioning' 
        : 'Make calls over Wi-Fi',
      icon: Wifi,
      status: getCapabilityStatus(deviceCapabilities.wifiCalling),
      details: deviceCapabilities.wifiCalling === 'limited' ? 'Contact Carrier' : 'Available'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{result.device.make} {result.device.model}</h2>
                <p className="text-blue-100">{result.device.make} Inc.</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">IMEI</p>
                <p className="text-lg font-mono">{result.device.imei}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">DOTM Network Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {capabilityList.map((capability, index) => {
                const status = getStatusBadge(capability.status);
                const IconComponent = capability.icon;
                const StatusIcon = status.icon;
                
                return (
                  <div key={index} className={`${status.bgColor} border ${status.borderColor} rounded-lg p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 ${status.iconBg} rounded-lg flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${status.iconColor}`} />
                      </div>
                      <span className={`${status.badgeColor} text-white text-xs px-2 py-1 rounded-full`}>
                        {status.text}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{capability.title}</h4>
                    <p className="text-sm text-gray-600">{capability.description}</p>
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Speed Estimate</div>
                      <div className="text-sm font-medium text-gray-900">{capability.details}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TAC Analysis Section */}
            {result.tacAnalysis && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Device Identification Analysis</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-semibold">TAC</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-sm font-medium text-blue-900 mb-1">TAC (Type Allocation Code) Analysis</h5>
                      <p className="text-sm text-blue-800">{result.tacAnalysis}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.specifications && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Device Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Model</dt>
                    <dd className="text-sm text-gray-900 mt-1">{result.device.modelNumber || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Release Year</dt>
                    <dd className="text-sm text-gray-900 mt-1">{result.device.year || result.specifications.releaseYear || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Network Bands</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {result.specifications.networkBands || 'Information not available'}
                    </dd>
                  </div>
                  {result.specifications.carrierVariant && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Carrier Variant</dt>
                      <dd className="text-sm text-gray-900 mt-1">{result.specifications.carrierVariant}</dd>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Comparison Section */}
          <div className="mt-12">
            <PricingComparison 
              country={extractCountry(result.location || '')}
              compatibleCarriers={getCompatibleCarriers(deviceCapabilities)}
              location={result.location}
              coordinates={result.coordinates}
            />
          </div>

          {/* Coverage Analysis Banner */}
          {(result.location || result.coordinates) && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1">
                      Coverage Analysis Available in Your Area
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Get real-time network coverage insights and provider comparisons for your location
                      {result.location && ` in ${result.location}`}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleCoverageAnalysis}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                >
                  <span>Check Coverage</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Helper function to extract country from location string
function extractCountry(location: string): string {
  if (!location) return 'United States';
  
  // Check for common country names
  if (location.toLowerCase().includes('lithuania')) return 'Lithuania';
  if (location.toLowerCase().includes('canada')) return 'Canada';
  if (location.toLowerCase().includes('uk') || location.toLowerCase().includes('united kingdom')) return 'United Kingdom';
  if (location.toLowerCase().includes('australia')) return 'Australia';
  
  // Extract last part after comma (usually country)
  const parts = location.split(',');
  const lastPart = parts[parts.length - 1].trim();
  
  // If last part looks like a country (not a number, reasonable length)
  if (lastPart.length > 2 && lastPart.length < 50 && !/\d/.test(lastPart)) {
    return lastPart;
  }
  
  return 'United States';
}

// Helper function to determine compatible carriers based on device capabilities
function getCompatibleCarriers(capabilities: any): string[] {
  const compatible: string[] = [];
  
  // If device has good 5G/4G support, all major carriers are compatible
  if (capabilities.fiveG && capabilities.fourG && capabilities.volte) {
    compatible.push('AT&T', 'Verizon', 'T-Mobile');
  } else if (capabilities.fourG && capabilities.volte) {
    // Good 4G support - most carriers
    compatible.push('AT&T', 'T-Mobile');
  } else if (capabilities.fourG) {
    // Basic 4G - T-Mobile tends to be more forgiving
    compatible.push('T-Mobile');
  }
  
  return compatible;
}
