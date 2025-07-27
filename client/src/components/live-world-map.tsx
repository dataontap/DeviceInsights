
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

    // Create base plane
    const geometry = new THREE.PlaneGeometry(10, 5, 32, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x2e7d32, 
      wireframe: false, 
      transparent: true, 
      opacity: 0.3 
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Add continent shapes with extrusion
    const extrudeSettings = { depth: 0.3, bevelEnabled: false };

    // North America
    const northAmericaShape = new THREE.Shape();
    northAmericaShape.moveTo(-4, 1);
    northAmericaShape.lineTo(-2, 2);
    northAmericaShape.lineTo(-1, 1.5);
    northAmericaShape.lineTo(-2, 0.5);
    northAmericaShape.lineTo(-3.5, 0);
    const northAmericaGeometry = new THREE.ExtrudeGeometry(northAmericaShape, extrudeSettings);
    const continentMaterial = new THREE.MeshBasicMaterial({ color: 0x2e7d32, transparent: true, opacity: 0.7 });
    const northAmerica = new THREE.Mesh(northAmericaGeometry, continentMaterial);
    scene.add(northAmerica);

    // Africa
    const africaShape = new THREE.Shape();
    africaShape.moveTo(0, 0.5);
    africaShape.lineTo(1, 1);
    africaShape.lineTo(1.5, 0);
    africaShape.lineTo(1, -1.5);
    africaShape.lineTo(0.5, -1);
    const africaGeometry = new THREE.ExtrudeGeometry(africaShape, extrudeSettings);
    const africa = new THREE.Mesh(africaGeometry, continentMaterial);
    scene.add(africa);

    // Asia
    const asiaShape = new THREE.Shape();
    asiaShape.moveTo(2, 1);
    asiaShape.lineTo(4, 1.5);
    asiaShape.lineTo(4.5, 0);
    asiaShape.lineTo(3.5, -0.5);
    asiaShape.lineTo(2.5, 0);
    const asiaGeometry = new THREE.ExtrudeGeometry(asiaShape, extrudeSettings);
    const asia = new THREE.Mesh(asiaGeometry, continentMaterial);
    scene.add(asia);

    // Australia
    const australiaShape = new THREE.Shape();
    australiaShape.moveTo(3.5, -1.5);
    australiaShape.lineTo(4, -1);
    australiaShape.lineTo(4.5, -1.5);
    australiaShape.lineTo(4, -2);
    const australiaGeometry = new THREE.ExtrudeGeometry(australiaShape, extrudeSettings);
    const australia = new THREE.Mesh(australiaGeometry, continentMaterial);
    scene.add(australia);

    // South America
    const southAmericaShape = new THREE.Shape();
    southAmericaShape.moveTo(-2, -0.5);
    southAmericaShape.lineTo(-1.5, 0);
    southAmericaShape.lineTo(-1, -1);
    southAmericaShape.lineTo(-1.5, -2);
    const southAmericaGeometry = new THREE.ExtrudeGeometry(southAmericaShape, extrudeSettings);
    const southAmerica = new THREE.Mesh(southAmericaGeometry, continentMaterial);
    scene.add(southAmerica);

    // Camera position
    camera.position.set(0, 3, 3);
    camera.lookAt(0, 0, 0);

    // Store references
    threeSceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Slow rotation
      plane.rotation.z += 0.002;
      northAmerica.rotation.y += 0.002;
      africa.rotation.y += 0.002;
      asia.rotation.y += 0.002;
      australia.rotation.y += 0.002;
      southAmerica.rotation.y += 0.002;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      const newWidth = newRect.width;
      const newHeight = newRect.height;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      
      // Update SVG viewBox to match
      if (svgRef.current) {
        svgRef.current.setAttribute('viewBox', `0 0 ${newWidth} ${newHeight}`);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
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
