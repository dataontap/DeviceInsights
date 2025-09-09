import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Wifi, AlertTriangle, CheckCircle, XCircle, Smartphone, Monitor, ZoomIn, ZoomOut, Globe, Map, MessageSquare, Send, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { GoogleCoverageMap } from './google-coverage-map';
import { LocationConsentDialog } from './location-consent-dialog';

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
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [hasValidLocation, setHasValidLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapRadius, setMapRadius] = useState(10); // km radius for analysis
  const [showMap, setShowMap] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [issueAnalysis, setIssueAnalysis] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');
  const [showExpandedMap, setShowExpandedMap] = useState(false);
  const [showLocationConsent, setShowLocationConsent] = useState(false);
  const [locationConsentGranted, setLocationConsentGranted] = useState(false);

  // Read URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const latParam = urlParams.get('lat');
    const lngParam = urlParams.get('lng');
    const addressParam = urlParams.get('address');

    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);

      if (!isNaN(lat) && !isNaN(lng)) {
        setLocationInput({
          lat: lat.toString(),
          lng: lng.toString(),
          address: addressParam || ''
        });
        setCoordinates({
          lat,
          lng,
          address: addressParam || ''
        });
      }
    }
  }, []);

  // Check if we have a valid location
  useEffect(() => {
    const lat = parseFloat(locationInput.lat);
    const lng = parseFloat(locationInput.lng);
    setHasValidLocation(!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0);
  }, [locationInput]);

  // Handle location consent
  const handleLocationConsent = (granted: boolean) => {
    setLocationConsentGranted(granted);
    if (granted) {
      // Proceed with getting location
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
    }
  };

  // Get user's current location with consent
  const getCurrentLocation = () => {
    if (!locationConsentGranted) {
      setShowLocationConsent(true);
    } else {
      // Already have consent, proceed directly
      handleLocationConsent(true);
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
      setLocationConfirmed(true);
    }
  };

  // Report issue function
  const reportIssue = async () => {
    if (!issueDescription.trim()) return;

    setIsReportingIssue(true);
    try {
      // Generate API key for issue analysis
      const keyResponse = await fetch('/api/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'issue-report@example.com',
          name: 'Issue Reporter'
        }),
      });

      const keyData = await keyResponse.json();
      const apiKey = keyData.apiKey;

      // Analyze the reported issue
      const response = await fetch('/api/coverage/analyze-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: coordinates.address,
          issue_description: issueDescription,
          user_agent: navigator.userAgent // For device detection
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIssueAnalysis(result.data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to analyze issue');
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Failed to analyze issue. Please try again.');
    } finally {
      setIsReportingIssue(false);
    }
  };

  // Coverage analysis query
  const { data: coverageData, isLoading, error, refetch } = useQuery<LocationCoverage>({
    queryKey: ['coverage-analysis', coordinates.lat, coordinates.lng, selectedProvider],
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
          address: coordinates.address,
          provider: selectedProvider !== 'auto' ? selectedProvider : undefined
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

          {/* Provider Selection */}
          <div>
            <Label htmlFor="provider-select">Network Provider (Optional)</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger id="provider-select">
                <SelectValue placeholder="Auto-detect largest provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect (Largest in Country)</SelectItem>
                <SelectItem value="Verizon">Verizon</SelectItem>
                <SelectItem value="AT&T">AT&T</SelectItem>
                <SelectItem value="T-Mobile">T-Mobile</SelectItem>
                <SelectItem value="Rogers">Rogers (Canada)</SelectItem>
                <SelectItem value="Bell">Bell (Canada)</SelectItem>
                <SelectItem value="Telus">Telus (Canada)</SelectItem>
                <SelectItem value="DOTM">DOTM</SelectItem>
                <SelectItem value="Verizon Fios">Verizon Fios (Internet)</SelectItem>
                <SelectItem value="AT&T Internet">AT&T Internet</SelectItem>
                <SelectItem value="Comcast">Comcast/Xfinity</SelectItem>
                <SelectItem value="Spectrum">Spectrum</SelectItem>
                <SelectItem value="Rogers Internet">Rogers Internet</SelectItem>
                <SelectItem value="Bell Internet">Bell Internet</SelectItem>
                <SelectItem value="Telus Internet">Telus Internet</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Leave on auto-detect to analyze the largest provider in your country
            </p>
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
            <Button
              variant="outline"
              onClick={() => setShowReportIssue(!showReportIssue)}
              disabled={!hasValidLocation}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Report an Issue
            </Button>
          </div>

          {/* Location Confirmation */}
          {locationConfirmed && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg mt-4">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Location confirmed: {coordinates.address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`}
              </span>
            </div>
          )}

          {/* Coverage Analysis Prompt */}
          {locationConfirmed && !coverageData && !isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Wifi className="h-5 w-5" />
                <h4 className="font-semibold">Ready to Analyze Coverage</h4>
              </div>
              <p className="text-blue-600 text-sm mb-3">
                Would you like to analyze network coverage and performance for this location? 
                We'll check provider reliability, recent issues, and coverage quality using real-time data.
              </p>
              <Button 
                onClick={() => refetch()} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Wifi className="h-4 w-4 mr-2" />
                Yes, Analyze Coverage
              </Button>
            </div>
          )}
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

      {/* Issue Reporting Section */}
      {showReportIssue && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Report Network Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="issue-description">Describe your network issue</Label>
              <Textarea
                id="issue-description"
                placeholder="Describe the network problem you're experiencing... e.g., 'No signal on my iPhone 15 Pro in downtown area, calls keep dropping, slow internet speeds, can't connect to 5G network, etc.'"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="min-h-24 mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={reportIssue}
                disabled={!issueDescription.trim() || isReportingIssue}
                className="flex-1"
              >
                {isReportingIssue ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing Issue...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Analyze Issue
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportIssue(false);
                  setIssueDescription('');
                  setIssueAnalysis(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issue Analysis Results */}
      {issueAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Issue Analysis & Similar Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Issue Classification */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Issue Classification</h4>
              <p className="text-sm text-blue-800">{issueAnalysis.issue_classification}</p>
            </div>

            {/* Similar Issues in Area */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Similar Issues in Your Area</h4>
              <p className="text-sm text-yellow-800 mb-2">{issueAnalysis.similar_issues_summary}</p>
              {issueAnalysis.similar_reports && issueAnalysis.similar_reports.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-yellow-700 font-medium">Recent Similar Reports:</p>
                  {issueAnalysis.similar_reports.slice(0, 3).map((report: any, index: number) => (
                    <div key={index} className="text-xs text-yellow-700 bg-white p-2 rounded border-l-2 border-yellow-400">
                      <strong>{report.device || 'Unknown Device'}:</strong> {report.description}
                      {report.distance && <span className="text-yellow-600"> ({report.distance})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Device Pattern Analysis */}
            {issueAnalysis.device_pattern && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Device Pattern Analysis</h4>
                <p className="text-sm text-green-800">{issueAnalysis.device_pattern}</p>
              </div>
            )}

            {/* Recommendations */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">AI Recommendations</h4>
              <p className="text-sm text-purple-800">{issueAnalysis.recommendations}</p>
            </div>

            {/* Area Impact */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Analysis Confidence: {Math.round(issueAnalysis.confidence_score * 100)}%</span>
              <span>Similar Reports: {issueAnalysis.similar_reports?.length || 0}</span>
            </div>
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

          {/* Google Maps Coverage Visualization */}
          {coordinates.lat !== 0 && coordinates.lng !== 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-600" />
                  <h4 className="text-lg font-semibold">Coverage Map Visualization</h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>

              {showMap && (
                <GoogleCoverageMap
                  lat={coordinates.lat}
                  lng={coordinates.lng}
                  address={coordinates.address}
                  radius={mapRadius}
                  onRadiusChange={setMapRadius}
                  issueCount={
                    coverageData ? 
                    coverageData.mobile_providers.reduce((sum, p) => sum + p.recent_issues, 0) +
                    coverageData.broadband_providers.reduce((sum, p) => sum + p.recent_issues, 0)
                    : 0
                  }
                  areaName={coordinates.address || `${coordinates.lat.toFixed(2)}, ${coordinates.lng.toFixed(2)}`}
                />
              )}
            </div>
          )}

          {/* Google Maps Thumbnail with 10km Area Preview */}
          {coordinates.lat !== 0 && coordinates.lng !== 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-600" />
                  <CardTitle>Area Map (10km Radius)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">
                  {showExpandedMap ? 'Interactive map view' : 'Click the map to expand the interactive view'}
                </div>

                {!showExpandedMap ? (
                  // Google Maps Static API Thumbnail
                  <div 
                    className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors group"
                    onClick={() => setShowExpandedMap(true)}
                  >
                    <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=12&size=600x300&maptype=roadmap&markers=color:red%7C${coordinates.lat},${coordinates.lng}&circle=fillcolor:0x0080FF30%7Ccolor:0x0080FFFF%7Cweight:2%7C${coordinates.lat},${coordinates.lng},10000&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                    alt={`Map showing 10km area around ${coordinates.address || `${coordinates.lat}, ${coordinates.lng}`}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      // Fallback if Google Maps Static API fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />

                  {/* Fallback for when Static Maps API is unavailable */}
                  <div className="hidden w-full h-48 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">Click to view area map</p>
                      <p className="text-xs text-muted-foreground">{coordinates.address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`}</p>
                    </div>
                  </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ZoomIn className="h-4 w-4" />
                          Expand Interactive Map
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Expanded Interactive Google Maps
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Interactive Coverage Map</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const googleMapsUrl = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},13z`;
                            window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in Google Maps
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowExpandedMap(false)}
                        >
                          <ZoomOut className="h-4 w-4 mr-2" />
                          Collapse
                        </Button>
                      </div>
                    </div>

                    <GoogleCoverageMap
                      lat={coordinates.lat}
                      lng={coordinates.lng}
                      address={coordinates.address}
                      radius={10}
                      onRadiusChange={() => {}}
                      issueCount={0}
                      areaName={coordinates.address || `${coordinates.lat.toFixed(2)}, ${coordinates.lng.toFixed(2)}`}
                    />
                  </div>
                )}

                {/* Map details */}
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Center:</span> {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </div>
                  <div>
                    <span className="font-medium">Coverage Radius:</span> 10km
                  </div>
                  {coordinates.address && (
                    <div className="col-span-2">
                      <span className="font-medium">Location:</span> {coordinates.address}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

      {/* Location Consent Dialog */}
      <LocationConsentDialog
        isOpen={showLocationConsent}
        onClose={() => setShowLocationConsent(false)}
        onConsent={handleLocationConsent}
      />
    </div>
  );
}