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
    queryKey: ['/api/map/searches?limit=100'],
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
              
              {/* Enhanced World Map with detailed coastlines */}
              <g fill="#475569" stroke="#334155" strokeWidth="0.6" opacity="0.85">
                {/* North America - more detailed */}
                <path d="M50 100 Q70 80 100 85 L130 75 Q160 70 180 80 L200 85 Q230 90 250 100 L270 110 Q290 125 295 150 L290 180 Q285 200 270 215 L250 225 Q220 230 190 225 L160 220 Q130 215 110 200 L90 180 Q70 160 65 140 L60 120 Q55 110 50 100 Z" />
                
                {/* South America - more natural shape */}
                <path d="M200 240 Q220 235 240 245 L260 255 Q280 270 285 295 L290 320 Q285 345 275 365 L265 380 Q250 390 235 385 L220 380 Q205 375 195 360 L190 340 Q185 320 190 300 L195 280 Q200 260 200 240 Z" />
                
                {/* Europe - detailed coastlines */}
                <path d="M360 110 Q380 105 400 110 L420 115 Q440 120 450 135 L455 150 Q450 165 440 175 L420 180 Q400 175 380 170 L365 165 Q355 155 355 140 L358 125 Q360 115 360 110 Z" />
                
                {/* Africa - realistic outline */}
                <path d="M390 180 Q410 175 430 185 L450 195 Q470 210 475 235 L480 260 Q475 285 470 310 L465 335 Q455 355 445 370 L430 380 Q410 385 395 380 L380 375 Q370 360 375 340 L380 315 Q385 290 388 265 L390 240 Q392 210 390 180 Z" />
                
                {/* Asia - vast continent */}
                <path d="M470 90 Q500 85 530 95 L560 105 Q590 115 620 125 L650 135 Q680 145 700 160 L720 175 Q735 190 730 210 L725 230 Q715 245 700 255 L680 260 Q650 255 620 250 L590 245 Q560 240 530 235 L500 230 Q480 220 470 200 L468 180 Q466 160 468 140 L470 120 Q472 105 470 90 Z" />
                
                {/* Australia and Oceania */}
                <path d="M630 300 Q650 295 670 305 L690 315 Q710 325 720 340 L715 355 Q705 365 690 360 L670 355 Q650 350 635 340 L628 325 Q625 312 630 300 Z" />
                
                {/* Additional island chains and details */}
                <ellipse cx="580" cy="180" rx="12" ry="8" opacity="0.8" /> {/* Japan */}
                <circle cx="460" cy="130" r="4" opacity="0.8" /> {/* UK */}
                <ellipse cx="350" cy="270" rx="3" ry="8" opacity="0.7" /> {/* Madagascar */}
                <circle cx="720" cy="200" r="4" opacity="0.7" /> {/* Philippines */}
                <ellipse cx="680" cy="350" rx="8" ry="4" opacity="0.8" /> {/* New Zealand */}
                
                {/* Major island chains */}
                <circle cx="600" cy="220" r="2" opacity="0.6" /> {/* Indonesia */}
                <circle cx="610" cy="225" r="2" opacity="0.6" />
                <circle cx="620" cy="230" r="2" opacity="0.6" />
                <circle cx="400" cy="250" r="2" opacity="0.6" /> {/* Caribbean */}
                <circle cx="405" cy="255" r="1.5" opacity="0.6" />
                <circle cx="410" cy="260" r="1.5" opacity="0.6" />
              </g>

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