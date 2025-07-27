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
  const [worldMapSVG, setWorldMapSVG] = useState<string>('');
  const mapRef = useRef<SVGSVGElement>(null);

  // Fetch recent searches every 5 seconds
  const { data: searches } = useQuery<{ searches: SearchLocation[] }>({
    queryKey: ['/api/map/searches?limit=100'],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Fetch AI-generated world map every 30 seconds
  const { data: mapData } = useQuery<{ svgPaths: string; generated: string }>({
    queryKey: ['/api/map/generate'],
    refetchInterval: 30000, // Regenerate map every 30 seconds
    refetchIntervalInBackground: true,
    onSuccess: (data) => {
      if (data?.svgPaths) {
        setWorldMapSVG(data.svgPaths);
      }
    }
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
              style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 50%, #e0f2fe 100%)' }}
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
              
              {/* AI-Generated World Map */}
              <g dangerouslySetInnerHTML={{ 
                __html: worldMapSVG || `
                  <!-- Improved fallback world map with better geographic accuracy -->
                  <!-- North America -->
                  <path d="M120 140 L160 120 L200 130 L240 140 L280 150 L290 180 L285 220 L270 240 L240 250 L200 245 L160 240 L130 220 L115 180 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Greenland -->
                  <path d="M320 80 L340 75 L355 85 L360 110 L350 130 L330 135 L315 125 L310 100 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- South America -->
                  <path d="M220 260 L250 270 L270 290 L275 330 L270 370 L250 390 L230 385 L210 370 L205 330 L210 290 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Europe -->
                  <path d="M380 120 L420 115 L440 125 L445 150 L435 170 L415 175 L385 170 L375 145 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Africa -->
                  <path d="M390 180 L430 185 L450 200 L460 240 L465 280 L455 320 L445 350 L430 365 L410 370 L390 365 L380 320 L385 280 L388 240 L390 200 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Asia -->
                  <path d="M460 90 L520 95 L580 105 L640 115 L680 125 L720 140 L740 160 L735 190 L720 210 L680 220 L640 215 L580 210 L520 200 L480 185 L465 160 L460 120 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- India -->
                  <path d="M520 200 L540 205 L550 220 L545 240 L535 250 L520 245 L510 230 L515 215 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Australia -->
                  <path d="M620 310 L660 315 L690 325 L705 340 L700 360 L680 365 L640 360 L615 350 L610 330 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Japan -->
                  <path d="M680 160 L690 155 L695 165 L692 180 L685 185 L678 175 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- UK -->
                  <path d="M375 130 L385 128 L388 138 L383 145 L378 143 L374 138 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Madagascar -->
                  <path d="M480 320 L490 325 L488 345 L482 350 L478 340 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                `
              }} />

              {/* Subtle latitude/longitude grid */}
              <g stroke="#94a3b8" strokeWidth="0.3" opacity="0.2">
                {/* Longitude lines */}
                {Array.from({ length: 13 }, (_, i) => (
                  <line key={`lng-${i}`} x1={i * 66.67} y1="0" x2={i * 66.67} y2="400" strokeDasharray="2,4" />
                ))}
                {/* Latitude lines */}
                {Array.from({ length: 7 }, (_, i) => (
                  <line key={`lat-${i}`} x1="0" y1={i * 66.67} x2="800" y2={i * 66.67} strokeDasharray="2,4" />
                ))}
                {/* Equator (more prominent) */}
                <line x1="0" y1="200" x2="800" y2="200" stroke="#64748b" strokeWidth="0.5" opacity="0.4" />
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

              {/* Static dots for existing searches - show last 100 */}
              {searches?.searches?.slice(0, 100).map((search: SearchLocation, index: number) => {
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
            {mapData?.generated && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>AI-Generated Map ({new Date(mapData.generated).toLocaleTimeString()})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}