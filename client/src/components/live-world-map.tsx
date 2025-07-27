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

  // Fetch world map once
  const { data: mapData } = useQuery<{ svgPaths: string; generated: string }>({
    queryKey: ['/api/map/generate'],
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
              
              {/* World Map */}
              <g dangerouslySetInnerHTML={{ 
                __html: worldMapSVG || `
                  <!-- Accurate world map -->
                  <!-- North America -->
                  <path d="M60 80 L90 75 L120 78 L150 82 L180 88 L210 95 L240 105 L270 115 L290 130 L300 150 L295 170 L285 190 L270 210 L250 225 L225 235 L200 240 L175 238 L150 235 L125 230 L100 220 L80 205 L65 185 L55 165 L50 145 L52 125 L55 105 L58 90 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Greenland -->
                  <path d="M320 50 L350 45 L375 50 L390 60 L400 75 L405 95 L400 115 L390 130 L375 140 L350 145 L325 140 L305 130 L295 115 L290 95 L295 75 L305 60 L315 50 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- South America -->
                  <path d="M240 260 L260 265 L275 270 L285 280 L290 295 L288 315 L285 335 L280 355 L272 375 L260 390 L245 395 L230 390 L218 380 L210 365 L205 350 L203 335 L205 320 L210 305 L218 290 L228 275 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Europe -->
                  <path d="M380 100 L400 95 L420 98 L440 105 L460 115 L470 130 L465 145 L455 160 L440 170 L420 175 L400 172 L385 165 L375 150 L370 135 L372 120 L375 105 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- UK -->
                  <path d="M365 110 L375 108 L385 112 L388 120 L385 128 L378 132 L370 130 L365 125 L363 118 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Africa -->
                  <path d="M380 175 L400 178 L420 182 L440 188 L460 195 L475 205 L485 220 L490 240 L492 260 L490 280 L485 300 L478 320 L468 340 L455 355 L440 365 L420 370 L400 368 L385 365 L375 355 L370 340 L368 320 L370 300 L375 280 L378 260 L380 240 L382 220 L384 200 L382 180 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Asia -->
                  <path d="M470 70 L500 75 L530 80 L560 85 L590 90 L620 95 L650 100 L680 105 L710 110 L740 118 L760 130 L770 145 L765 165 L755 185 L740 200 L720 210 L695 215 L670 218 L645 215 L620 210 L595 205 L570 200 L545 195 L520 188 L500 180 L485 165 L475 150 L470 135 L468 120 L470 105 L472 90 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- India -->
                  <path d="M530 195 L545 198 L555 205 L560 215 L558 230 L552 242 L542 250 L530 248 L520 242 L515 230 L518 215 L525 205 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Australia -->
                  <path d="M640 300 L665 305 L690 310 L715 318 L730 330 L735 345 L730 360 L720 370 L705 375 L685 372 L660 368 L640 363 L625 355 L620 340 L625 325 L632 315 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
                  <!-- Japan -->
                  <path d="M695 150 L705 148 L715 152 L718 162 L715 172 L708 180 L700 182 L692 178 L688 168 L690 158 Z" fill="#475569" stroke="#334155" stroke-width="0.6" opacity="0.85"/>
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
            
          </div>
        </div>
      </div>
    </section>
  );
}