
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import * as THREE from 'three';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const threeSceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

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
      
      // Convert lat/lng to normalized coordinates (0-1 range)
      const x = (lng + 180) / 360;
      const y = (90 - lat) / 180;
      return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    }

    // Approximate normalized coordinates for major countries/cities
    const locationMap: { [key: string]: { x: number; y: number } } = {
      'united states': { x: 0.25, y: 0.45 },
      'usa': { x: 0.25, y: 0.45 },
      'canada': { x: 0.225, y: 0.3 },
      'united kingdom': { x: 0.5, y: 0.35 },
      'uk': { x: 0.5, y: 0.35 },
      'germany': { x: 0.525, y: 0.375 },
      'france': { x: 0.5125, y: 0.4 },
      'australia': { x: 0.8125, y: 0.75 },
      'japan': { x: 0.85, y: 0.425 },
      'china': { x: 0.75, y: 0.45 },
      'india': { x: 0.6875, y: 0.5 },
      'brazil': { x: 0.35, y: 0.7 },
      'mexico': { x: 0.225, y: 0.5 },
      'russia': { x: 0.625, y: 0.3 },
      'south africa': { x: 0.575, y: 0.8 },
      'new york': { x: 0.275, y: 0.425 },
      'california': { x: 0.2, y: 0.45 },
      'london': { x: 0.5, y: 0.35 },
      'paris': { x: 0.5125, y: 0.4 },
      'tokyo': { x: 0.85, y: 0.425 },
      'sydney': { x: 0.8375, y: 0.8 },
      'toronto': { x: 0.25, y: 0.325 },
      'vancouver': { x: 0.1875, y: 0.3 },
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
    return { x: 0.5, y: 0.5 };
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!mapRef.current) return;

    const container = mapRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);

    // Create ocean base (flat plane)
    const oceanGeometry = new THREE.PlaneGeometry(12, 6);
    const oceanMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4a90e2, 
      transparent: true, 
      opacity: 0.4 
    });
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.1;
    scene.add(ocean);

    // Extrusion settings for continents
    const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 };
    const continentMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x2e7d32, 
      transparent: true, 
      opacity: 0.9 
    });

    // North America - Realistic shape with Canada, USA, Mexico
    const northAmericaShape = new THREE.Shape();
    // Start from Alaska
    northAmericaShape.moveTo(-5.2, 2.1);
    northAmericaShape.lineTo(-4.8, 2.3);  // Aleutian Islands
    northAmericaShape.lineTo(-4.2, 2.4);  // Western Alaska
    northAmericaShape.lineTo(-3.8, 2.2);  // Northern Canada
    northAmericaShape.lineTo(-3.2, 2.3);  // Arctic Canada
    northAmericaShape.lineTo(-2.6, 2.1);  // Hudson Bay
    northAmericaShape.lineTo(-2.0, 1.8);  // Eastern Canada
    northAmericaShape.lineTo(-1.7, 1.4);  // Maritime provinces
    northAmericaShape.lineTo(-1.8, 1.0);  // New England
    northAmericaShape.lineTo(-1.9, 0.6);  // Mid-Atlantic
    northAmericaShape.lineTo(-2.0, 0.2);  // Southeast US
    northAmericaShape.lineTo(-2.1, -0.1); // Florida
    northAmericaShape.lineTo(-2.4, -0.2); // Gulf Coast
    northAmericaShape.lineTo(-2.8, -0.1); // Texas
    northAmericaShape.lineTo(-3.2, 0.1);  // Mexico
    northAmericaShape.lineTo(-3.6, 0.4);  // Mexico West
    northAmericaShape.lineTo(-4.2, 0.8);  // California
    northAmericaShape.lineTo(-4.6, 1.2);  // Pacific Northwest
    northAmericaShape.lineTo(-5.0, 1.6);  // British Columbia
    northAmericaShape.closePath();
    const northAmericaGeometry = new THREE.ExtrudeGeometry(northAmericaShape, extrudeSettings);
    const northAmerica = new THREE.Mesh(northAmericaGeometry, continentMaterial);
    scene.add(northAmerica);

    // South America - Characteristic elongated shape
    const southAmericaShape = new THREE.Shape();
    southAmericaShape.moveTo(-2.8, -0.3); // Venezuela/Guyana
    southAmericaShape.lineTo(-2.4, -0.2); // Northern coast
    southAmericaShape.lineTo(-1.8, -0.4); // Brazil northeast
    southAmericaShape.lineTo(-1.4, -0.8); // Brazil east bulge
    southAmericaShape.lineTo(-1.3, -1.4); // Brazil central east
    southAmericaShape.lineTo(-1.5, -2.0); // Brazil south
    southAmericaShape.lineTo(-1.8, -2.4); // Uruguay
    southAmericaShape.lineTo(-2.1, -2.6); // Argentina east
    southAmericaShape.lineTo(-2.3, -2.8); // Argentina south
    southAmericaShape.lineTo(-2.6, -2.7); // Chile south
    southAmericaShape.lineTo(-2.9, -2.0); // Chile central
    southAmericaShape.lineTo(-3.1, -1.4); // Peru
    southAmericaShape.lineTo(-3.0, -0.8); // Ecuador
    southAmericaShape.lineTo(-2.9, -0.5); // Colombia
    southAmericaShape.closePath();
    const southAmericaGeometry = new THREE.ExtrudeGeometry(southAmericaShape, extrudeSettings);
    const southAmerica = new THREE.Mesh(southAmericaGeometry, continentMaterial);
    scene.add(southAmerica);

    // Europe - Detailed with recognizable features
    const europeShape = new THREE.Shape();
    europeShape.moveTo(0.4, 1.9);   // Norway north
    europeShape.lineTo(0.7, 2.0);   // Norway/Sweden
    europeShape.lineTo(1.0, 1.8);   // Finland
    europeShape.lineTo(1.3, 1.6);   // Russia west
    europeShape.lineTo(1.4, 1.3);   // Eastern Europe
    europeShape.lineTo(1.3, 1.0);   // Balkans
    europeShape.lineTo(1.1, 0.8);   // Greece/Turkey
    europeShape.lineTo(0.9, 0.9);   // Italy
    europeShape.lineTo(0.7, 1.0);   // France/Spain
    europeShape.lineTo(0.5, 1.1);   // Iberian Peninsula
    europeShape.lineTo(0.4, 1.3);   // France west
    europeShape.lineTo(0.2, 1.4);   // British Isles
    europeShape.lineTo(0.3, 1.6);   // UK/Ireland
    europeShape.lineTo(0.3, 1.8);   // Scotland
    europeShape.closePath();
    const europeGeometry = new THREE.ExtrudeGeometry(europeShape, extrudeSettings);
    const europe = new THREE.Mesh(europeGeometry, continentMaterial);
    scene.add(europe);

    // Africa - Classic triangular African shape
    const africaShape = new THREE.Shape();
    africaShape.moveTo(0.6, 0.9);    // Morocco
    africaShape.lineTo(1.4, 0.8);    // Algeria/Libya
    africaShape.lineTo(1.8, 0.6);    // Egypt
    africaShape.lineTo(2.0, 0.3);    // Sudan
    africaShape.lineTo(2.1, -0.1);   // Ethiopia/Somalia
    africaShape.lineTo(2.0, -0.5);   // Kenya
    africaShape.lineTo(1.9, -0.9);   // Tanzania
    africaShape.lineTo(1.7, -1.3);   // Zambia/Zimbabwe
    africaShape.lineTo(1.4, -1.6);   // Botswana
    africaShape.lineTo(1.0, -1.8);   // South Africa
    africaShape.lineTo(0.7, -1.7);   // South Africa west
    africaShape.lineTo(0.5, -1.4);   // Namibia
    africaShape.lineTo(0.3, -1.0);   // Angola
    africaShape.lineTo(0.2, -0.6);   // Congo/Gabon
    africaShape.lineTo(0.1, -0.2);   // Cameroon
    africaShape.lineTo(0.3, 0.2);    // Nigeria
    africaShape.lineTo(0.4, 0.6);    // West Africa
    africaShape.closePath();
    const africaGeometry = new THREE.ExtrudeGeometry(africaShape, extrudeSettings);
    const africa = new THREE.Mesh(africaGeometry, continentMaterial);
    scene.add(africa);

    // Asia - Large continent with India, China, Russia
    const asiaShape = new THREE.Shape();
    asiaShape.moveTo(1.4, 2.1);      // Western Russia
    asiaShape.lineTo(2.2, 2.2);      // Central Russia
    asiaShape.lineTo(3.2, 2.1);      // Siberia
    asiaShape.lineTo(4.0, 1.9);      // Eastern Russia
    asiaShape.lineTo(4.4, 1.6);      // Far East Russia
    asiaShape.lineTo(4.3, 1.3);      // China northeast
    asiaShape.lineTo(4.1, 1.0);      // China east
    asiaShape.lineTo(3.9, 0.7);      // China south
    asiaShape.lineTo(3.6, 0.4);      // Southeast Asia
    asiaShape.lineTo(3.2, 0.1);      // Indonesia area
    asiaShape.lineTo(2.8, 0.2);      // India southeast
    asiaShape.lineTo(2.4, 0.5);      // India
    asiaShape.lineTo(2.2, 0.8);      // Pakistan/Afghanistan
    asiaShape.lineTo(2.0, 1.1);      // Iran
    asiaShape.lineTo(1.8, 1.4);      // Turkey/Caucasus
    asiaShape.lineTo(1.6, 1.7);      // Kazakhstan
    asiaShape.closePath();
    const asiaGeometry = new THREE.ExtrudeGeometry(asiaShape, extrudeSettings);
    const asia = new THREE.Mesh(asiaGeometry, continentMaterial);
    scene.add(asia);

    // Australia - Recognizable Australian outline
    const australiaShape = new THREE.Shape();
    australiaShape.moveTo(3.7, -1.3);  // Queensland north
    australiaShape.lineTo(4.1, -1.4);  // Queensland east
    australiaShape.lineTo(4.3, -1.7);  // New South Wales
    australiaShape.lineTo(4.2, -2.0);  // Victoria
    australiaShape.lineTo(3.9, -2.2);  // South Australia
    australiaShape.lineTo(3.5, -2.1);  // Western Australia south
    australiaShape.lineTo(3.2, -1.8);  // Western Australia
    australiaShape.lineTo(3.3, -1.5);  // Northern Territory
    australiaShape.lineTo(3.5, -1.4);  // Queensland west
    australiaShape.closePath();
    const australiaGeometry = new THREE.ExtrudeGeometry(australiaShape, extrudeSettings);
    const australia = new THREE.Mesh(australiaGeometry, continentMaterial);
    scene.add(australia);

    // Add Greenland
    const greenlandShape = new THREE.Shape();
    greenlandShape.moveTo(-1.2, 2.0);
    greenlandShape.lineTo(-0.8, 2.1);
    greenlandShape.lineTo(-0.6, 1.8);
    greenlandShape.lineTo(-0.8, 1.5);
    greenlandShape.lineTo(-1.2, 1.6);
    greenlandShape.closePath();
    const greenlandGeometry = new THREE.ExtrudeGeometry(greenlandShape, extrudeSettings);
    const greenland = new THREE.Mesh(greenlandGeometry, continentMaterial);
    scene.add(greenland);

    // Static camera position - top-down view
    camera.position.set(0, 5, 2);
    camera.lookAt(0, 0, 0);

    // Store references
    threeSceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Static render (no animation)
    renderer.render(scene, camera);

    // Handle resize
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      const newWidth = newRect.width;
      const newHeight = newRect.height;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderer.render(scene, camera);
      
      // Update SVG viewBox to match
      if (svgRef.current) {
        svgRef.current.setAttribute('viewBox', `0 0 ${newWidth} ${newHeight}`);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

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
            {/* Three.js 3D Map Container */}
            <div 
              ref={mapRef}
              className="absolute inset-0 w-full h-full"
              style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 50%, #e0f2fe 100%)' }}
            />
            
            {/* SVG Overlay for dots and interactions */}
            <svg
              ref={svgRef}
              viewBox="0 0 800 400"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            >
              {/* Defs for effects */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Subtle grid overlay */}
              <g stroke="#94a3b8" strokeWidth="0.3" opacity="0.2">
                {/* Longitude lines */}
                {Array.from({ length: 13 }, (_, i) => (
                  <line key={`lng-${i}`} x1={i * 66.67} y1="0" x2={i * 66.67} y2="400" strokeDasharray="2,4" />
                ))}
                {/* Latitude lines */}
                {Array.from({ length: 7 }, (_, i) => (
                  <line key={`lat-${i}`} x1="0" y1={i * 66.67} x2="800" y2={i * 66.67} strokeDasharray="2,4" />
                ))}
                {/* Equator */}
                <line x1="0" y1="200" x2="800" y2="200" stroke="#64748b" strokeWidth="0.5" opacity="0.4" />
              </g>

              {/* Animated Search Dots */}
              {animatedDots.map(dot => {
                const age = Date.now() - dot.timestamp;
                const opacity = Math.max(0, 1 - age / 10000);
                const scale = Math.min(1, age / 500);
                
                // Convert normalized coordinates to SVG coordinates
                const svgX = dot.x * 800;
                const svgY = dot.y * 400;

                return (
                  <g key={dot.id} transform={`translate(${svgX}, ${svgY})`} className="pointer-events-auto">
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
                    
                    {/* Tooltip */}
                    <title>{`${dot.device} - ${dot.location}`}</title>
                  </g>
                );
              })}

              {/* Static dots for existing searches */}
              {searches?.searches?.slice(0, 100).map((search: SearchLocation) => {
                const coords = getMapCoordinates(search.location || 'unknown');
                if (!coords) return null;

                const svgX = coords.x * 800;
                const svgY = coords.y * 400;

                return (
                  <g key={`static-${search.id}`} transform={`translate(${svgX}, ${svgY})`} className="pointer-events-auto">
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
              <div className="w-3 h-3 bg-green-600 rounded-full opacity-70"></div>
              <span>3D Terrain</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
