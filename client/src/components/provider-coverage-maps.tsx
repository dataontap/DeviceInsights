import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Wifi, AlertTriangle, CheckCircle, XCircle, Smartphone, Monitor } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface CoverageAnalysis {
  provider: string;
  service_type: 'mobile' | 'broadband';
  coverage_score: number;
  reliability_rating: number;
  recent_issues: number;
  issue_summary: string;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  last_major_outage?: string;
  confidence_score: number;
}

interface LocationCoverage {
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  mobile_providers: CoverageAnalysis[];
  broadband_providers: CoverageAnalysis[];
  analysis_timestamp: string;
  data_period: string;
}

interface ProviderCoverageMapsProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

export function ProviderCoverageMaps({ 
  initialLat = 0, 
  initialLng = 0, 
  initialAddress = '' 
}: ProviderCoverageMapsProps) {
  const [coordinates, setCoordinates] = useState({
    lat: initialLat,
    lng: initialLng,
    address: initialAddress
  });
  const [locationInput, setLocationInput] = useState({
    lat: initialLat.toString(),
    lng: initialLng.toString(),
    address: initialAddress
  });
  const [hasValidLocation, setHasValidLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Check if we have a valid location
  useEffect(() => {
    const lat = parseFloat(locationInput.lat);
    const lng = parseFloat(locationInput.lng);
    setHasValidLocation(!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0);
  }, [locationInput]);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocationInput({
            lat: lat.toString(),
            lng: lng.toString(),
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enter coordinates manually.');
          setIsGettingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
    }
  };

  // Analyze coverage for the current location
  const analyzeCoverage = () => {
    const lat = parseFloat(locationInput.lat);
    const lng = parseFloat(locationInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates({
        lat,
        lng,
        address: locationInput.address
      });
    }
  };

  // Coverage analysis query
  const { data: coverageData, isLoading, error, refetch } = useQuery<LocationCoverage>({
    queryKey: ['coverage-analysis', coordinates.lat, coordinates.lng],
    queryFn: async () => {
      if (coordinates.lat === 0 && coordinates.lng === 0) {
        throw new Error('No valid location set');
      }

      // First, generate a temporary API key for the demo
      const keyResponse = await fetch('/api/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'coverage-demo@example.com',
          name: 'Coverage Maps Demo'
        }),
      });

      if (!keyResponse.ok) {
        throw new Error('Failed to generate API key for coverage analysis');
      }

      const keyData = await keyResponse.json();
      const apiKey = keyData.apiKey;

      // Now perform the coverage analysis
      const response = await fetch('/api/coverage/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: coordinates.address
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to analyze coverage');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: coordinates.lat !== 0 && coordinates.lng !== 0,
  });

  // Get recommendation color and icon
  const getRecommendationDisplay = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent':
        return { color: 'bg-green-500', icon: CheckCircle, text: 'Excellent' };
      case 'good':
        return { color: 'bg-blue-500', icon: CheckCircle, text: 'Good' };
      case 'fair':
        return { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Fair' };
      case 'poor':
        return { color: 'bg-red-500', icon: XCircle, text: 'Poor' };
      default:
        return { color: 'bg-gray-500', icon: AlertTriangle, text: 'Unknown' };
    }
  };

  // Generate stars for reliability rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Provider Coverage Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Check network coverage and reliability using real Downdetector data within 10km of your location
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g., 40.7128"
                value={locationInput.lat}
                onChange={(e) => setLocationInput({ ...locationInput, lat: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g., -74.0060"
                value={locationInput.lng}
                onChange={(e) => setLocationInput({ ...locationInput, lng: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                placeholder="e.g., New York, NY"
                value={locationInput.address}
                onChange={(e) => setLocationInput({ ...locationInput, address: e.target.value })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              variant="outline"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Use My Location
                </>
              )}
            </Button>
            <Button
              onClick={analyzeCoverage}
              disabled={!hasValidLocation}
            >
              <Wifi className="h-4 w-4 mr-2" />
              Analyze Coverage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Results */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Generating API key and analyzing coverage using AI and Downdetector data...</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8">
            <p className="text-red-600 text-center">
              Error analyzing coverage: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {coverageData && (
        <div className="space-y-4">
          {/* Analysis Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">
                  Coverage Analysis for{' '}
                  {coverageData.location.address || 
                   `${coverageData.location.lat.toFixed(4)}, ${coverageData.location.lng.toFixed(4)}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Based on {coverageData.data_period} of Downdetector reports within 10km radius
                </p>
                <p className="text-xs text-muted-foreground">
                  Analysis completed: {new Date(coverageData.analysis_timestamp).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Providers Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold">Mobile Carriers</h4>
              <Badge variant="outline">{coverageData.mobile_providers.length} providers</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coverageData.mobile_providers.map((provider) => {
                const display = getRecommendationDisplay(provider.recommendation);
                const IconComponent = display.icon;
                
                return (
                  <Card key={`mobile-${provider.provider}`} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{provider.provider}</CardTitle>
                        <Badge className={`${display.color} text-white`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {display.text}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        <Smartphone className="h-3 w-3 mr-1" />
                        Mobile Network
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Coverage Score */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Coverage Score</span>
                          <span className="font-medium">{provider.coverage_score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              provider.coverage_score >= 80 ? 'bg-green-500' :
                              provider.coverage_score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${provider.coverage_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Reliability Rating */}
                      <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span>Reliability</span>
                          <div className="flex">
                            {renderStars(provider.reliability_rating)}
                          </div>
                        </div>
                      </div>

                      {/* Recent Issues */}
                      <div className="text-sm">
                        <span className="font-medium">Recent Issues: </span>
                        <span className={`${provider.recent_issues === 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {provider.recent_issues}
                        </span>
                      </div>

                      {/* Issue Summary */}
                      <div className="text-xs text-muted-foreground">
                        {provider.issue_summary}
                      </div>

                      {/* Last Major Outage */}
                      {provider.last_major_outage && (
                        <div className="text-xs text-red-600">
                          Last major outage: {provider.last_major_outage}
                        </div>
                      )}

                      {/* Confidence Score */}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Confidence</span>
                        <span>{Math.round(provider.confidence_score * 100)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Broadband Providers Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-green-600" />
              <h4 className="text-lg font-semibold">Fixed Broadband Internet</h4>
              <Badge variant="outline">{coverageData.broadband_providers.length} providers</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coverageData.broadband_providers.map((provider) => {
                const display = getRecommendationDisplay(provider.recommendation);
                const IconComponent = display.icon;
                
                return (
                  <Card key={`broadband-${provider.provider}`} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{provider.provider}</CardTitle>
                        <Badge className={`${display.color} text-white`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {display.text}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        <Monitor className="h-3 w-3 mr-1" />
                        Fixed Internet
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Coverage Score */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Coverage Score</span>
                          <span className="font-medium">{provider.coverage_score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              provider.coverage_score >= 80 ? 'bg-green-500' :
                              provider.coverage_score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${provider.coverage_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Reliability Rating */}
                      <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span>Reliability</span>
                          <div className="flex">
                            {renderStars(provider.reliability_rating)}
                          </div>
                        </div>
                      </div>

                      {/* Recent Issues */}
                      <div className="text-sm">
                        <span className="font-medium">Recent Issues: </span>
                        <span className={`${provider.recent_issues === 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {provider.recent_issues}
                        </span>
                      </div>

                      {/* Issue Summary */}
                      <div className="text-xs text-muted-foreground">
                        {provider.issue_summary}
                      </div>

                      {/* Last Major Outage */}
                      {provider.last_major_outage && (
                        <div className="text-xs text-red-600">
                          Last major outage: {provider.last_major_outage}
                        </div>
                      )}

                      {/* Confidence Score */}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Confidence</span>
                        <span>{Math.round(provider.confidence_score * 100)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}