import { useEffect, useState } from "react";
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

// Convert lat/lng to SVG coordinates (Robinson projection approximation)
const latLngToSVG = (lat: number, lng: number): { x: number; y: number } => {
  const width = 1000;
  const height = 500;
  
  // Simple equirectangular projection
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  
  return { x, y };
};

export default function SVGWorldMap() {
  const [animatedDots, setAnimatedDots] = useState<AnimatedDot[]>([]);
  const [lastSearchId, setLastSearchId] = useState<number>(0);

  // Fetch recent searches every 5 seconds
  const { data: searches } = useQuery<{ searches: SearchLocation[] }>({
    queryKey: ['/api/map/searches?limit=100'],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Convert location string to coordinates
  const getCoordinates = (location: string): { lat: number; lng: number } | null => {
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

  // Process new searches and create animated dots
  useEffect(() => {
    if (!searches?.searches) return;

    const newSearches = searches.searches.filter((search: SearchLocation) => 
      search.id > lastSearchId
    );

    if (newSearches.length > 0) {
      const newDots = newSearches.map((search: SearchLocation) => {
        const coords = getCoordinates(search.location || 'unknown');
        if (!coords) return null;

        const svgPos = latLngToSVG(coords.lat, coords.lng);
        
        return {
          id: `dot-${search.id}`,
          x: svgPos.x,
          y: svgPos.y,
          timestamp: Date.now(),
          location: search.location || 'unknown',
          device: search.deviceMake && search.deviceModel 
            ? `${search.deviceMake} ${search.deviceModel}` 
            : 'Unknown Device'
        };
      }).filter(Boolean) as AnimatedDot[];

      setAnimatedDots(prev => [...prev, ...newDots]);
      setLastSearchId(Math.max(...searches.searches.map((s: SearchLocation) => s.id)));
    }
  }, [searches, lastSearchId]);

  // Clean up old dots
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setAnimatedDots(prev => 
        prev.filter(dot => now - dot.timestamp < 15000) // Keep dots for 15 seconds
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  const totalSearches = searches?.searches?.length || 0;

  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Live Global Device Searches
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Real-time visualization of IMEI device compatibility checks worldwide
            </p>
            <div className="mt-4 inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {totalSearches} searches tracked
              </span>
            </div>
          </div>

          {/* SVG World Map */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '2/1' }}>
              <svg
                viewBox="0 0 1000 500"
                className="w-full h-full bg-slate-100 dark:bg-slate-700"
                style={{ maxHeight: '500px' }}
              >
                {/* World Map Paths - Simplified continents */}
                <g fill="#10b981" stroke="#065f46" strokeWidth="1">
                  {/* North America */}
                  <path d="M150 120 L200 100 L280 110 L320 140 L300 180 L250 200 L180 190 L120 160 Z" />
                  
                  {/* South America */}
                  <path d="M220 220 L280 210 L300 280 L290 350 L270 380 L240 370 L210 340 L200 280 Z" />
                  
                  {/* Europe */}
                  <path d="M480 100 L520 90 L540 110 L530 140 L500 150 L470 130 Z" />
                  
                  {/* Africa */}
                  <path d="M480 160 L520 150 L540 200 L530 280 L510 320 L490 310 L470 260 L460 200 Z" />
                  
                  {/* Asia */}
                  <path d="M550 80 L700 70 L750 100 L770 140 L720 180 L650 190 L580 160 L540 120 Z" />
                  
                  {/* Australia */}
                  <path d="M720 280 L780 270 L800 300 L790 320 L750 330 L710 310 Z" />
                </g>

                {/* Animated search dots */}
                {animatedDots.map((dot) => {
                  const age = Date.now() - dot.timestamp;
                  const opacity = Math.max(0, 1 - age / 15000); // Fade over 15 seconds
                  const scale = Math.max(0.3, 1 - age / 15000);
                  
                  return (
                    <g key={dot.id}>
                      {/* Ripple effect */}
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r={age / 100}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        opacity={opacity * 0.5}
                      />
                      
                      {/* Main dot */}
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r={6 * scale}
                        fill="#3b82f6"
                        opacity={opacity}
                        className="animate-pulse"
                      >
                        <title>{dot.device} - {dot.location}</title>
                      </circle>
                    </g>
                  );
                })}

                {/* Static markers for all searches */}
                {searches?.searches?.map((search, index) => {
                  const coords = getCoordinates(search.location || 'unknown');
                  if (!coords) return null;
                  
                  const svgPos = latLngToSVG(coords.lat, coords.lng);
                  const isRecent = animatedDots.some(dot => dot.id === `dot-${search.id}`);
                  
                  if (isRecent) return null; // Skip if already animated
                  
                  return (
                    <circle
                      key={`static-${search.id}`}
                      cx={svgPos.x}
                      cy={svgPos.y}
                      r="3"
                      fill="#64748b"
                      opacity="0.6"
                    >
                      <title>
                        {search.deviceMake && search.deviceModel 
                          ? `${search.deviceMake} ${search.deviceModel}` 
                          : 'Device'} - {search.location}
                      </title>
                    </circle>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center space-x-8 text-sm text-slate-600 dark:text-slate-400">
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
                <span>SVG World Map</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}