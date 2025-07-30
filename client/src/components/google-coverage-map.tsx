import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Globe, AlertTriangle, CheckCircle } from 'lucide-react';

// Google Maps type declarations
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleCoverageMapProps {
  lat: number;
  lng: number;
  address?: string;
  radius: number;
  onRadiusChange: (radius: number) => void;
  issueCount: number;
  areaName: string;
}

interface IssueOverlay {
  radius: number;
  issueCount: number;
  label: string;
  color: string;
}

export function GoogleCoverageMap({ 
  lat, 
  lng, 
  address, 
  radius, 
  onRadiusChange, 
  issueCount,
  areaName 
}: GoogleCoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [overlays, setOverlays] = useState<any[]>([]);
  const [marker, setMarker] = useState<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = () => {
      // Check if Google Maps is available
      if (typeof window.google === 'undefined' || !window.google.maps) {
        setMapError('Google Maps is not available. Using fallback visualization.');
        return;
      }

      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: getZoomLevel(radius),
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setMap(mapInstance);
        setIsMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
        setMapError('Failed to load Google Maps. Using fallback visualization.');
      }
    };

    // If Google Maps is already loaded, initialize immediately
    if (typeof window.google !== 'undefined' && window.google.maps) {
      initializeMap();
    } else {
      // Wait for Google Maps to load, with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkGoogleMaps = () => {
        attempts++;
        
        if (typeof window.google !== 'undefined' && window.google.maps) {
          initializeMap();
        } else if (attempts < maxAttempts) {
          setTimeout(checkGoogleMaps, 100);
        } else {
          setMapError('Google Maps failed to load. Using fallback visualization.');
        }
      };
      
      checkGoogleMaps();
    }
  }, [lat, lng, radius]);

  // Update map center when coordinates change
  useEffect(() => {
    if (map && lat && lng) {
      map.setCenter({ lat, lng });
      map.setZoom(getZoomLevel(radius));
    }
  }, [map, lat, lng, radius]);

  // Create coverage overlays and marker
  useEffect(() => {
    if (!map || !isMapLoaded || !window.google?.maps) return;

    try {
      // Clear existing overlays and marker
      overlays.forEach(overlay => {
        try {
          overlay.setMap(null);
        } catch (e) {
          console.warn('Error clearing overlay:', e);
        }
      });
      
      if (marker) {
        try {
          marker.setMap(null);
        } catch (e) {
          console.warn('Error clearing marker:', e);
        }
      }

      // Create new marker at the center
      const newMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: address || `Coverage Analysis: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      // Create concentric circles for different analysis areas
      const newOverlays: any[] = [];
      const overlayConfigs: IssueOverlay[] = [
        { radius: 5, issueCount: Math.floor(issueCount * 0.4), label: '5km', color: '#10b981' },
        { radius: 10, issueCount: Math.floor(issueCount * 0.7), label: '10km', color: '#f59e0b' },
        { radius: 20, issueCount: issueCount, label: '20km', color: '#ef4444' },
      ];

      overlayConfigs.forEach((config, index) => {
        const circle = new window.google.maps.Circle({
          strokeColor: config.color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: config.color,
          fillOpacity: 0.1,
          map: map,
          center: { lat, lng },
          radius: config.radius * 1000, // Convert km to meters
        });

        // Add info window for each circle
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h4 class="font-semibold">${config.label} Analysis Radius</h4>
              <p class="text-sm text-gray-600">Issues reported: ${config.issueCount}</p>
              <p class="text-xs text-gray-500">Based on last 30 days of data</p>
            </div>
          `,
          position: { lat: lat + (config.radius * 0.01), lng }
        });

        circle.addListener('click', () => {
          infoWindow.open(map);
        });

        newOverlays.push(circle);
      });

      setOverlays(newOverlays);
      setMarker(newMarker);
    } catch (error) {
      console.error('Error creating map overlays:', error);
      setMapError('Failed to create map overlays. Using fallback visualization.');
    }
  }, [map, isMapLoaded, lat, lng, radius, issueCount, address]);

  // Helper function to determine zoom level based on radius
  function getZoomLevel(radiusKm: number): number {
    if (radiusKm <= 5) return 12;
    if (radiusKm <= 10) return 11;
    if (radiusKm <= 20) return 10;
    return 9;
  }

  // Get issue summary for the area
  const getIssueSummary = () => {
    if (issueCount === 0) {
      return {
        icon: CheckCircle,
        text: `0 issues reported in ${areaName}`,
        color: 'bg-green-500',
        description: 'Excellent network stability in your area'
      };
    } else if (issueCount <= 5) {
      return {
        icon: AlertTriangle,
        text: `${issueCount} minor issues in ${areaName}`,
        color: 'bg-yellow-500',
        description: 'Some isolated network problems reported'
      };
    } else {
      return {
        icon: AlertTriangle,
        text: `${issueCount} issues reported in ${areaName}`,
        color: 'bg-red-500',
        description: 'Multiple network problems in the area'
      };
    }
  };

  const issueSummary = getIssueSummary();
  const IconComponent = issueSummary.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Coverage Map</CardTitle>
          <Badge className={`${issueSummary.color} text-white`}>
            <IconComponent className="h-3 w-3 mr-1" />
            {issueSummary.text}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{issueSummary.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Container */}
        {mapError ? (
          <div className="w-full h-96 rounded-lg border bg-gray-100 flex items-center justify-center">
            <div className="text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-sm text-gray-600">{mapError}</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>Location: {address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</p>
                <p>Analysis Radius: {radius}km</p>
                <p>Issues in Area: {issueCount}</p>
              </div>
            </div>
          </div>
        ) : (
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg border"
            style={{ minHeight: '400px' }}
          />
        )}

        {/* Map Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Analysis Radius:</span>
            <div className="flex gap-1">
              <Button
                variant={radius === 5 ? "default" : "outline"}
                size="sm"
                onClick={() => onRadiusChange(5)}
              >
                <ZoomIn className="h-3 w-3 mr-1" />
                5km
              </Button>
              <Button
                variant={radius === 10 ? "default" : "outline"}
                size="sm"
                onClick={() => onRadiusChange(10)}
              >
                10km
              </Button>
              <Button
                variant={radius === 20 ? "default" : "outline"}
                size="sm"
                onClick={() => onRadiusChange(20)}
              >
                <ZoomOut className="h-3 w-3 mr-1" />
                20km
              </Button>
              <Button
                variant={radius === 50 ? "default" : "outline"}
                size="sm"
                onClick={() => onRadiusChange(50)}
              >
                <Globe className="h-3 w-3 mr-1" />
                Country
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Click circles for detailed area information
          </div>
        </div>

        {/* Area Summary Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Badge variant="outline" className="p-2 justify-center">
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            5km: {Math.floor(issueCount * 0.4)} issues
          </Badge>
          <Badge variant="outline" className="p-2 justify-center">
            <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
            10km: {Math.floor(issueCount * 0.7)} issues
          </Badge>
          <Badge variant="outline" className="p-2 justify-center">
            <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
            20km: {issueCount} issues
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}