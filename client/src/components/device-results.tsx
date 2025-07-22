import { Signal, Radio, Phone, Wifi, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface DeviceResultsProps {
  result: {
    device: {
      make: string;
      model: string;
      year?: number;
      modelNumber?: string;
      imei: string;
    };
    capabilities: {
      fourG: boolean;
      fiveG: boolean;
      volte: boolean;
      wifiCalling: string;
    };
    specifications?: {
      networkBands?: string;
      releaseYear?: number;
    };
  };
}

export default function DeviceResults({ result }: DeviceResultsProps) {
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

  const capabilities = [
    {
      title: '4G LTE Data',
      description: 'Full compatibility with AT&T\'s 4G LTE network',
      icon: Signal,
      status: getCapabilityStatus(result.capabilities.fourG),
      details: 'Up to 150 Mbps'
    },
    {
      title: '5G Data',
      description: 'Compatible with AT&T\'s 5G network',
      icon: Radio,
      status: getCapabilityStatus(result.capabilities.fiveG),
      details: 'Up to 1 Gbps'
    },
    {
      title: 'VoLTE',
      description: 'Voice over LTE for HD calling',
      icon: Phone,
      status: getCapabilityStatus(result.capabilities.volte),
      details: 'HD Voice'
    },
    {
      title: 'Wi-Fi Calling',
      description: result.capabilities.wifiCalling === 'limited' 
        ? 'Requires carrier provisioning' 
        : 'Make calls over Wi-Fi',
      icon: Wifi,
      status: getCapabilityStatus(result.capabilities.wifiCalling),
      details: result.capabilities.wifiCalling === 'limited' ? 'Contact Carrier' : 'Available'
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
            <h3 className="text-xl font-semibold text-gray-900 mb-6">AT&T Network Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {capabilities.map((capability, index) => {
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
