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
  const mapRef = useRef<SVGSVGElement>(null);

  // Fetch recent searches every 5 seconds
  const { data: searches } = useQuery<{ searches: SearchLocation[] }>({
    queryKey: ['/api/map/searches?limit=50'],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Convert location string to map coordinates
  const getMapCoordinates = (location: string): { x: number; y: number } | null => {
    // Handle GPS coordinates
    const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      
      // Convert lat/lng to SVG coordinates (800x400 map)
      const x = ((lng + 180) / 360) * 800;
      const y = ((90 - lat) / 180) * 400;
      return { x: Math.max(0, Math.min(800, x)), y: Math.max(0, Math.min(400, y)) };
    }

    // Approximate coordinates for major countries/cities
    const locationMap: { [key: string]: { x: number; y: number } } = {
      'united states': { x: 200, y: 180 },
      'usa': { x: 200, y: 180 },
      'canada': { x: 180, y: 120 },
      'united kingdom': { x: 400, y: 140 },
      'uk': { x: 400, y: 140 },
      'germany': { x: 420, y: 150 },
      'france': { x: 410, y: 160 },
      'australia': { x: 650, y: 300 },
      'japan': { x: 680, y: 170 },
      'china': { x: 600, y: 180 },
      'india': { x: 550, y: 200 },
      'brazil': { x: 280, y: 280 },
      'mexico': { x: 180, y: 200 },
      'russia': { x: 500, y: 120 },
      'south africa': { x: 460, y: 320 },
      'new york': { x: 220, y: 170 },
      'california': { x: 160, y: 180 },
      'london': { x: 400, y: 140 },
      'paris': { x: 410, y: 160 },
      'tokyo': { x: 680, y: 170 },
      'sydney': { x: 670, y: 320 },
      'toronto': { x: 200, y: 130 },
      'vancouver': { x: 150, y: 120 },
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
    return { x: 400, y: 200 };
  };

  // Process new searches and add animations
  useEffect(() => {
    if (!searches?.searches) return;

    const newSearches = searches.searches.filter((search: SearchLocation) => 
      search.id > lastSearchId
    );

    if (newSearches.length > 0) {
      const newDots: AnimatedDot[] = newSearches.map((search: SearchLocation) => {
        const coords = getMapCoordinates(search.location || 'unknown');
        if (!coords) return null;

        return {
          id: `search-${search.id}-${Date.now()}`,
          x: coords.x,
          y: coords.y,
          timestamp: Date.now(),
          location: search.location || 'Unknown',
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
          <div className="relative w-full" style={{ paddingBottom: '50%' }}>
            <svg
              ref={mapRef}
              viewBox="0 0 800 400"
              className="absolute inset-0 w-full h-full"
              style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}
            >
              {/* World Map Outline (Simplified) */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Continents (Simplified shapes) */}
              <g fill="#94a3b8" stroke="#64748b" strokeWidth="1" opacity="0.8">
                {/* North America */}
                <path d="M50 80 L280 80 L300 120 L280 200 L200 220 L120 200 L80 160 L50 120 Z" />
                
                {/* South America */}
                <path d="M200 220 L280 240 L300 320 L250 380 L200 360 L180 300 L200 220 Z" />
                
                {/* Europe */}
                <path d="M350 80 L450 80 L460 140 L400 160 L350 140 L350 80 Z" />
                
                {/* Africa */}
                <path d="M380 160 L480 160 L500 240 L480 340 L420 360 L380 320 L380 160 Z" />
                
                {/* Asia */}
                <path d="M450 80 L720 80 L750 120 L700 200 L650 180 L580 160 L520 140 L450 100 L450 80 Z" />
                
                {/* Australia */}
                <path d="M620 280 L720 280 L740 320 L700 340 L620 340 L620 280 Z" />
              </g>

              {/* Grid lines */}
              <g stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3">
                {Array.from({ length: 9 }, (_, i) => (
                  <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="400" />
                ))}
                {Array.from({ length: 5 }, (_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} />
                ))}
              </g>

              {/* Animated Search Dots */}
              {animatedDots.map(dot => {
                const age = Date.now() - dot.timestamp;
                const opacity = Math.max(0, 1 - age / 10000); // Fade out over 10 seconds
                const scale = Math.min(1, age / 500); // Scale in over 0.5 seconds

                return (
                  <g key={dot.id} transform={`translate(${dot.x}, ${dot.y})`}>
                    {/* Ripple effect */}
                    <circle
                      r={age / 100}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      opacity={Math.max(0, 0.8 - age / 5000)}
                    />
                    
                    {/* Main dot */}
                    <circle
                      r={4 * scale}
                      fill="#3b82f6"
                      opacity={opacity}
                      filter="url(#glow)"
                    />
                    
                    {/* Tooltip on hover */}
                    <title>{`${dot.device} - ${dot.location}`}</title>
                  </g>
                );
              })}

              {/* Static dots for existing searches */}
              {searches?.searches?.slice(0, 20).map((search: SearchLocation, index: number) => {
                const coords = getMapCoordinates(search.location || 'unknown');
                if (!coords) return null;

                return (
                  <g key={`static-${search.id}`} transform={`translate(${coords.x}, ${coords.y})`}>
                    <circle
                      r="2"
                      fill="#64748b"
                      opacity="0.6"
                    />
                    <title>
                      {search.deviceMake && search.deviceModel 
                        ? `${search.deviceMake} ${search.deviceModel}` 
                        : 'Device'} - {search.location}
                    </title>
                  </g>
                );
              })}
            </svg>
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
              <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              <span>Continents</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}