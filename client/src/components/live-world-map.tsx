
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface SearchLocation {
  id: number;
  location: string;
  deviceMake?: string;
  deviceModel?: string;
  searchedAt: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AnimatedDot {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  location: string;
  device: string;
}

export default function LiveWorldMap() {
  const [animatedDots, setAnimatedDots] = useState<AnimatedDot[]>([]);
  const [lastSearchId, setLastSearchId] = useState<number>(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Fetch recent searches every 5 seconds
  const { data: searches } = useQuery<{ searches: SearchLocation[] }>({
    queryKey: ['/api/map/searches?limit=100'],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Convert location string to Google Maps coordinates
  const getMapCoordinates = (location: string): { lat: number; lng: number } | null => {
    // Handle GPS coordinates
    const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      return { lat, lng };
    }

    // Approximate coordinates for major countries/cities
    const locationMap: { [key: string]: { lat: number; lng: number } } = {
      'united states': { lat: 39.8283, lng: -98.5795 },
      'usa': { lat: 39.8283, lng: -98.5795 },
      'canada': { lat: 56.1304, lng: -106.3468 },
      'united kingdom': { lat: 55.3781, lng: -3.4360 },
      'uk': { lat: 55.3781, lng: -3.4360 },
      'germany': { lat: 51.1657, lng: 10.4515 },
      'france': { lat: 46.2276, lng: 2.2137 },
      'australia': { lat: -25.2744, lng: 133.7751 },
      'japan': { lat: 36.2048, lng: 138.2529 },
      'china': { lat: 35.8617, lng: 104.1954 },
      'india': { lat: 20.5937, lng: 78.9629 },
      'brazil': { lat: -14.2350, lng: -51.9253 },
      'mexico': { lat: 23.6345, lng: -102.5528 },
      'russia': { lat: 61.5240, lng: 105.3188 },
      'south africa': { lat: -30.5595, lng: 22.9375 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'california': { lat: 36.7783, lng: -119.4179 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'toronto': { lat: 43.6532, lng: -79.3832 },
      'vancouver': { lat: 49.2827, lng: -123.1207 },
    };

    const normalized = location.toLowerCase().trim();
    
    // Direct match
    if (locationMap[normalized]) {
      return locationMap[normalized];
    }
    
    // Partial match
    for (const [key, coords] of Object.entries(locationMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return coords;
      }
    }
    
    // Default to center if unknown
    return { lat: 0, lng: 0 };
  };

  // Initialize Google Maps
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (!mapRef.current || !window.google) return;

      // Initialize Google Map
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 }, // Center on world
        zoom: 2,
        styles: [
          {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [{ color: "#4a90e2" }]
          },
          {
            featureType: "landscape",
            elementType: "geometry.fill",
            stylers: [{ color: "#2e7d32" }]
          },
          {
            featureType: "administrative.country",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1b5e20" }, { weight: 1 }]
          }
        ],
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false
      });

      googleMapRef.current = map;
    };

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBUrzY4hb9JIbUBu8SdJ3Oqr8b6YoZhX6Y&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = loadGoogleMaps;
      document.head.appendChild(script);
    } else {
      loadGoogleMaps();
    }
  }, []);

  // Process new searches and add Google Maps markers
  useEffect(() => {
    if (!searches?.searches || !googleMapRef.current) return;

    const newSearches = searches.searches.filter((search: SearchLocation) => 
      search.id > lastSearchId
    );

    if (newSearches.length > 0) {
      // Clear old markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add all search locations as markers
      searches.searches.forEach((search: SearchLocation) => {
        const coords = getMapCoordinates(search.location || 'unknown');
        if (!coords || !googleMapRef.current) return;

        const isNew = search.id > lastSearchId;
        
        const marker = new google.maps.Marker({
          position: coords,
          map: googleMapRef.current,
          title: `${search.deviceMake && search.deviceModel 
            ? `${search.deviceMake} ${search.deviceModel}` 
            : 'Device'} - ${search.location}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isNew ? 8 : 4,
            fillColor: isNew ? '#3b82f6' : '#64748b',
            fillOpacity: isNew ? 1 : 0.6,
            strokeColor: isNew ? '#1e40af' : '#475569',
            strokeWeight: 2
          },
          animation: isNew ? google.maps.Animation.DROP : undefined
        });

        // Add info window for new searches
        if (isNew) {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <div class="font-semibold text-blue-600">New Search</div>
                <div class="text-sm">${search.deviceMake && search.deviceModel 
                  ? `${search.deviceMake} ${search.deviceModel}` 
                  : 'Unknown Device'}</div>
                <div class="text-xs text-gray-500">${search.location}</div>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          // Auto-open info window for 3 seconds for new searches
          setTimeout(() => {
            infoWindow.open(googleMapRef.current, marker);
            setTimeout(() => infoWindow.close(), 3000);
          }, 1000);
        }

        markersRef.current.push(marker);
      });

      setLastSearchId(Math.max(...searches.searches.map((s: SearchLocation) => s.id)));
    }
  }, [searches, lastSearchId]);

  // Clean up old dots
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setAnimatedDots(prev => 
        prev.filter(dot => now - dot.timestamp < 10000) // Keep dots for 10 seconds
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  const totalSearches = searches?.searches?.length || 0;

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Live Search Activity
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real-time IMEI device searches from around the world. Watch as users check device compatibility live.
          </p>
          <div className="mt-4 inline-flex items-center space-x-6 text-sm text-slate-500">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              Recent Searches
            </span>
            <span>{totalSearches} total searches</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 overflow-hidden">
          <div className="relative w-full" style={{ height: '600px' }}>
            {/* Google Maps Container */}
            <div 
              ref={mapRef}
              className="absolute inset-0 w-full h-full rounded-lg"
            />
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center space-x-8 text-sm text-slate-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Live Searches</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-slate-500 rounded-full opacity-60"></div>
              <span>Previous Searches</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full opacity-70"></div>
              <span>Real Google Maps</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
