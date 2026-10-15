import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trip, Traveler } from '../types/travel';
import { calculateDistanceMeters, formatWalkingEta } from '../utils/travelUtils';
import L from 'leaflet';
import { 
  Navigation, Battery, BatteryWarning, MapPin, 
  Clock, Bell, Check, Edit2, Send, X, Crosshair, 
  Layers, Maximize2, Minimize2, Footprints, Compass,
  Sparkles, AlertCircle, Share2, LocateFixed
} from 'lucide-react';

interface RendezvousMapProps {
  trip: Trip;
  activeTraveler: Traveler;
  onUpdateTrip: (updated: Trip) => void;
}

// Singapore landmark presets for instant regrouping
const SINGAPORE_LANDMARKS: { name: string; coords: [number, number]; notes: string }[] = [
  {
    name: 'Lau Pa Sat Satay Street (Boon Tat St Outdoor Table 18)',
    coords: [1.2807, 103.8504],
    notes: 'Table choped with tissue packets. Stalls 7 & 8 satay feast starts at 18:45 sharp.',
  },
  {
    name: 'Gardens by the Bay Supertree Grove (Light Show Lawn)',
    coords: [1.2816, 103.8636],
    notes: 'Regroup at the central lawn 20 mins before Garden Rhapsody (19:45 & 20:45 shows).',
  },
  {
    name: 'Marina Bay Sands Event Plaza (Spectra Water Fountain)',
    coords: [1.2838, 103.8591],
    notes: 'Meet at the waterfront promenade deck facing Fullerton Hotel.',
  },
  {
    name: 'Chinatown Pagoda Street (Heritage Shophouse Arch)',
    coords: [1.2820, 103.8445],
    notes: 'Under the main red Chinatown arch right at Chinatown MRT Exit A.',
  },
  {
    name: 'Maxwell Food Centre (Tian Tian Chicken Rice Queue)',
    coords: [1.2803, 103.8447],
    notes: 'Stall #01-10 area. Grab seats near the center beverage kopitiam stall.',
  },
  {
    name: 'Clarke Quay Riverside Walk (Read Bridge Steps)',
    coords: [1.2886, 103.8465],
    notes: 'Sitting on the historic pedestrian bridge steps watching river bumboats.',
  },
  {
    name: 'Haji Lane & Arab Street (Sultan Mosque Golden Dome Viewpoint)',
    coords: [1.3008, 103.8590],
    notes: 'Corner of Baghdad St & Muscat St with view of the golden dome.',
  },
  {
    name: 'Jewel Changi Rain Vortex (Level 2 Canopy Deck)',
    coords: [1.3602, 103.9897],
    notes: 'Opposite Shake Shack on Level 2 directly facing the 40-meter indoor waterfall.',
  },
];

type MapStyle = 'osm' | 'voyager' | 'dark' | 'satellite';

const TILE_CONFIGS: Record<MapStyle, { url: string; maxZoom: number; attribution: string; subdomains?: string | string[] }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

export const RendezvousMap: React.FC<RendezvousMapProps> = ({
  trip,
  activeTraveler,
  onUpdateTrip,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [isEditingBeacon, setIsEditingBeacon] = useState(false);
  const [beaconName, setBeaconName] = useState(trip.meetupPoint.name);
  const [beaconTime, setBeaconTime] = useState(trip.meetupPoint.time);
  const [beaconNotes, setBeaconNotes] = useState(trip.meetupPoint.notes);
  const [beaconCoordsState, setBeaconCoordsState] = useState<[number, number]>(
    trip.meetupPoint.coordinates || [1.2807, 103.8504]
  );

  const [mapStyle, setMapStyle] = useState<MapStyle>('osm');
  const [showWalkingRoutes, setShowWalkingRoutes] = useState(true);
  const [showPerimeterZone, setShowPerimeterZone] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickMode, setClickMode] = useState<'move-me' | 'set-beacon'>('move-me');

  const [quickStatus, setQuickStatus] = useState('');
  const [announcementBanner, setAnnouncementBanner] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Traveler | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  const beaconCoords: [number, number] = useMemo(() => {
    return trip.meetupPoint.coordinates || [1.2807, 103.8504];
  }, [trip.meetupPoint.coordinates]);

  // Keep local editing state synced when trip prop updates
  useEffect(() => {
    setBeaconName(trip.meetupPoint.name);
    setBeaconTime(trip.meetupPoint.time);
    setBeaconNotes(trip.meetupPoint.notes);
    if (trip.meetupPoint.coordinates) {
      setBeaconCoordsState(trip.meetupPoint.coordinates);
    }
  }, [trip.meetupPoint]);

  // 1. Initialize and Manage Leaflet Map Instance
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Safely remove prior instance if present
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Leaflet cleanup notice:', e);
      }
      mapInstanceRef.current = null;
    }

    // Reset internal leaflet container ID to prevent "Map container is already initialized"
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    const map = L.map(container, {
      center: beaconCoords,
      zoom: 16,
      zoomControl: false, // We'll add custom positioned zoom control
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // Add zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer
    const cfg = TILE_CONFIGS[mapStyle];
    const initialTileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
      subdomains: cfg.subdomains || 'abc',
    }).addTo(map);
    tileLayerRef.current = initialTileLayer;

    // Polylines layer group
    const polyGroup = L.layerGroup().addTo(map);
    polylineLayerRef.current = polyGroup;

    // Map Click Handler: Updates user pin OR sets beacon location depending on clickMode
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));

      if (clickMode === 'set-beacon') {
        const updatedTrip: Trip = {
          ...trip,
          meetupPoint: {
            ...trip.meetupPoint,
            coordinates: [lat, lng],
            updatedAt: `Just now by ${activeTraveler.name}`,
          },
        };
        onUpdateTrip(updatedTrip);
        setAnnouncementBanner(`📍 Rendezvous Beacon moved to coordinates (${lat}, ${lng})!`);
        setClickMode('move-me');
      } else {
        const updatedMembers = trip.members.map((m) => {
          if (m.id === activeTraveler.id) {
            return {
              ...m,
              coordinates: [lat, lng] as [number, number],
              locationName: `Singapore GPS (${lat}, ${lng})`,
              lastActive: 'Just now',
            };
          }
          return m;
        });

        onUpdateTrip({
          ...trip,
          members: updatedMembers,
        });

        setAnnouncementBanner(`📍 ${activeTraveler.name} pinned new location on map.`);
      }
    });

    // Invalidate map size to prevent gray tiles on initial layout render
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    // ResizeObserver for responsive layout updates
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, []); // Mount once

  // 2. Handle Map Style (Tile Layer) changes dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_CONFIGS[mapStyle];
    const newTiles = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
      subdomains: cfg.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = newTiles;
  }, [mapStyle]);

  // 3. Render and Update Beacon, Zone Circle, Member Markers, and Walking Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing member/beacon markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Clear old zone circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    // Clear walking lines
    if (polylineLayerRef.current) {
      polylineLayerRef.current.clearLayers();
    }

    // A. Add 300m Regroup Zone Circle
    if (showPerimeterZone) {
      const circle = L.circle(beaconCoords, {
        radius: 300,
        color: '#f59e0b',
        fillColor: '#fef3c7',
        fillOpacity: 0.22,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);

      circle.bindTooltip('300m Rendezvous Perimeter', {
        permanent: false,
        direction: 'top',
        className: 'text-xs font-semibold px-2 py-1 bg-slate-900 text-white rounded shadow',
      });

      radiusCircleRef.current = circle;
    }

    // B. Add Beacon Marker with Pulsing Ring
    const beaconHtml = `
      <div class="relative flex items-center justify-center cursor-pointer">
        <div class="absolute w-12 h-12 bg-amber-400/35 rounded-full animate-ping"></div>
        <div class="relative w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold shadow-xl border-2 border-white ring-2 ring-amber-400 transform hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
      </div>
    `;

    const beaconIcon = L.divIcon({
      html: beaconHtml,
      className: 'custom-beacon-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });

    const beaconMarker = L.marker(beaconCoords, { icon: beaconIcon }).addTo(map);
    beaconMarker.bindPopup(`
      <div class="p-2 font-sans text-xs max-w-xs">
        <div class="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
          <span class="text-amber-500">📍</span>
          <span>Meetup Beacon (${trip.meetupPoint.time})</span>
        </div>
        <div class="text-slate-800 font-semibold mt-1">${trip.meetupPoint.name}</div>
        <div class="text-slate-600 mt-1 italic bg-amber-50 p-1.5 rounded border border-amber-100">
          "${trip.meetupPoint.notes}"
        </div>
        <div class="text-[10px] text-slate-400 mt-1.5">
          Updated: ${trip.meetupPoint.updatedAt}
        </div>
      </div>
    `);

    markersRef.current['beacon'] = beaconMarker;

    // C. Add Each Member Marker and Walking Polylines
    trip.members.forEach((member) => {
      const coords = member.coordinates || beaconCoords;
      const isCurrent = activeTraveler.id === member.id;
      const isSelected = selectedMember?.id === member.id;
      const distanceMeters = calculateDistanceMeters(coords, beaconCoords);
      const walkingEta = formatWalkingEta(distanceMeters);

      // Walking Route Polylines to Beacon
      if (showWalkingRoutes && polylineLayerRef.current && !member.isAtMeetup) {
        const polyline = L.polyline([coords, beaconCoords], {
          color: isCurrent ? '#f59e0b' : '#3b82f6',
          weight: isCurrent ? 3 : 2,
          opacity: 0.7,
          dashArray: '5, 8',
        });

        polyline.bindTooltip(`${member.name.split(' ')[0]}: ${walkingEta}`, {
          sticky: true,
          direction: 'center',
          className: 'text-[11px] font-medium bg-slate-900 text-white px-2 py-0.5 rounded shadow',
        });

        polylineLayerRef.current.addLayer(polyline);
      }

      // Member Marker HTML
      const memberHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <div class="relative">
            <img 
              src="${member.avatar}" 
              alt="${member.name}" 
              class="w-10 h-10 rounded-full object-cover shadow-lg border-2 transition-all ${
                member.isAtMeetup 
                  ? 'border-emerald-500 ring-3 ring-emerald-400' 
                  : isCurrent 
                  ? 'border-amber-500 ring-3 ring-amber-300' 
                  : isSelected 
                  ? 'border-blue-500 ring-3 ring-blue-300'
                  : 'border-white ring-1 ring-slate-300'
              }"
            />
            <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${
              member.isAtMeetup 
                ? 'bg-emerald-500 text-white' 
                : member.battery < 20 
                ? 'bg-rose-500 text-white' 
                : 'bg-amber-400 text-slate-950'
            }">
              ${member.isAtMeetup ? '✓' : ''}
            </div>
          </div>
          <span class="mt-1 px-2 py-0.5 rounded text-[11px] font-bold shadow-md whitespace-nowrap transition-colors ${
            isCurrent 
              ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300' 
              : member.isAtMeetup 
              ? 'bg-emerald-600 text-white' 
              : 'bg-slate-900/90 text-white'
          }">
            ${member.name.split(' ')[0]} ${isCurrent ? '(You)' : ''}
          </span>
        </div>
      `;

      const memberIcon = L.divIcon({
        html: memberHtml,
        className: 'custom-traveler-marker',
        iconSize: [44, 58],
        iconAnchor: [22, 50],
        popupAnchor: [0, -48],
      });

      const memberMarker = L.marker(coords, { icon: memberIcon }).addTo(map);
      memberMarker.bindPopup(`
        <div class="p-2 font-sans text-xs max-w-xs">
          <div class="flex items-center gap-2">
            <img src="${member.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" />
            <div>
              <div class="font-bold text-slate-900 text-sm">${member.name}</div>
              <div class="text-[11px] text-slate-500">${member.role} · Battery: <span class="font-tabular ${member.battery < 20 ? 'text-rose-600 font-bold' : ''}">${member.battery}%</span></div>
            </div>
          </div>
          <div class="mt-2 text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
            "${member.status}"
          </div>
          <div class="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
            <div class="text-slate-600">
              <strong>Location:</strong> ${member.locationName}
            </div>
            <div class="text-slate-600">
              <strong>Beacon Distance:</strong> ${walkingEta}
            </div>
            <div class="text-slate-500 text-[10px]">
              Last active: ${member.lastActive}
            </div>
          </div>
        </div>
      `);

      markersRef.current[member.id] = memberMarker;
    });
  }, [trip.members, trip.meetupPoint, activeTraveler.id, selectedMember, showWalkingRoutes, showPerimeterZone, beaconCoords]);

  // Recenter map if beaconCoords changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.invalidateSize();
  }, [beaconCoords]);

  // Fit bounds to include all crew members and the meetup beacon
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const allPoints: L.LatLngExpression[] = [
      beaconCoords,
      ...trip.members.map((m) => m.coordinates || beaconCoords),
    ];

    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
  };

  // Center on beacon
  const handleCenterOnBeacon = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(beaconCoords, 17, { duration: 0.8 });
    const marker = markersRef.current['beacon'];
    if (marker) {
      setTimeout(() => marker.openPopup(), 600);
    }
  };

  // Focus a specific traveler
  const handleFocusMember = (member: Traveler) => {
    setSelectedMember(member);
    const map = mapInstanceRef.current;
    if (!map) return;

    const coords = member.coordinates || beaconCoords;
    map.flyTo(coords, 18, { duration: 0.8 });

    const marker = markersRef.current[member.id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 600);
    }
  };

  // Real GPS Geolocation using browser API
  const handleLocateMyGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));

        const updatedMembers = trip.members.map((m) => {
          if (m.id === activeTraveler.id) {
            return {
              ...m,
              coordinates: [lat, lng] as [number, number],
              locationName: `Live GPS Device Location (${lat}, ${lng})`,
              lastActive: 'Just now (Live GPS)',
            };
          }
          return m;
        });

        onUpdateTrip({
          ...trip,
          members: updatedMembers,
        });

        setAnnouncementBanner(`🛰️ Updated ${activeTraveler.name}'s location with device GPS!`);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([lat, lng], 18, { duration: 0.8 });
        }
      },
      (err) => {
        setIsLocatingGPS(false);
        // Fallback simulated Singapore location
        const fallbackLat = 1.2825;
        const fallbackLng = 103.8520;
        const updatedMembers = trip.members.map((m) => {
          if (m.id === activeTraveler.id) {
            return {
              ...m,
              coordinates: [fallbackLat, fallbackLng] as [number, number],
              locationName: 'Marina Boulevard Promenade',
              lastActive: 'Just now',
            };
          }
          return m;
        });

        onUpdateTrip({
          ...trip,
          members: updatedMembers,
        });

        setAnnouncementBanner(`📍 Position simulated at Marina Boulevard (GPS prompt was dismissed).`);
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([fallbackLat, fallbackLng], 17, { duration: 0.8 });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Group quick check-in for active traveler
  const handleToggleArrived = () => {
    const isNowArrived = !activeTraveler.isAtMeetup;
    const updatedMembers = trip.members.map((m) => {
      if (m.id === activeTraveler.id) {
        return {
          ...m,
          isAtMeetup: isNowArrived,
          coordinates: isNowArrived ? beaconCoords : m.coordinates,
          status: isNowArrived ? `Arrived at ${trip.meetupPoint.name}!` : 'Exploring nearby',
          lastActive: 'Just now',
        };
      }
      return m;
    });

    onUpdateTrip({
      ...trip,
      members: updatedMembers,
    });

    setAnnouncementBanner(
      isNowArrived
        ? `🎉 ${activeTraveler.name} just checked in at the Meetup Beacon!`
        : `${activeTraveler.name} marked as en-route.`
    );
  };

  // Post custom broadcast status
  const handleUpdateCustomStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStatus.trim()) return;

    const updatedMembers = trip.members.map((m) => {
      if (m.id === activeTraveler.id) {
        return {
          ...m,
          status: quickStatus.trim(),
          lastActive: 'Just now',
        };
      }
      return m;
    });

    onUpdateTrip({
      ...trip,
      members: updatedMembers,
    });

    setAnnouncementBanner(`📢 ${activeTraveler.name}: "${quickStatus.trim()}"`);
    setQuickStatus('');
  };

  // Select landmark preset
  const handleSelectLandmarkPreset = (landmark: typeof SINGAPORE_LANDMARKS[0]) => {
    setBeaconName(landmark.name);
    setBeaconNotes(landmark.notes);
    setBeaconCoordsState(landmark.coords);
  };

  // Save Beacon
  const handleSaveBeacon = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTrip: Trip = {
      ...trip,
      meetupPoint: {
        name: beaconName.trim(),
        time: beaconTime.trim(),
        notes: beaconNotes.trim(),
        updatedAt: `Just now by ${activeTraveler.name}`,
        coordinates: beaconCoordsState,
      },
    };

    onUpdateTrip(updatedTrip);
    setIsEditingBeacon(false);
    setAnnouncementBanner(`🔔 New Rendezvous Beacon set at ${beaconTime}: ${beaconName}`);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(beaconCoordsState, 17, { duration: 0.8 });
    }
  };

  const handleSendRegroupAlert = () => {
    setAnnouncementBanner(
      `🔔 REGROUP ALERT SENT: "${activeTraveler.name} signaled all crew members to converge at ${trip.meetupPoint.name} for ${trip.meetupPoint.time} meetup."`
    );
  };

  const arrivedCount = trip.members.filter((m) => m.isAtMeetup).length;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4 overflow-y-auto' : ''}`}>
      {/* Broadcast Alert Banner */}
      {announcementBanner && (
        <div className="bg-amber-500 text-slate-950 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 shrink-0" />
            <span>{announcementBanner}</span>
          </div>
          <button
            onClick={() => setAnnouncementBanner(null)}
            className="p-1 hover:bg-amber-600/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rendezvous Beacon Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-400">
              <Navigation className="w-4 h-4 animate-bounce" />
              <span>ACTIVE SINGAPORE RENDEZVOUS BEACON</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400 font-normal">{trip.meetupPoint.updatedAt}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{trip.meetupPoint.name}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-amber-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Meetup Time: {trip.meetupPoint.time}
              </span>
              <span className="text-slate-300 max-w-xl">{trip.meetupPoint.notes}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => setIsEditingBeacon(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Change Beacon</span>
            </button>
            <button
              onClick={handleSendRegroupAlert}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ping Crew</span>
            </button>
          </div>
        </div>

        {/* Check-in Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <span className="text-slate-400">Regroup Status: </span>
              <strong className="text-white font-tabular">{arrivedCount} of {trip.members.length} Arrived</strong>
            </div>
            <div className="flex -space-x-1.5">
              {trip.members.map((m) => (
                <img
                  key={m.id}
                  src={m.avatar}
                  alt={m.name}
                  title={`${m.name}: ${m.isAtMeetup ? 'At Meetup' : 'En route'}`}
                  className={`w-7 h-7 rounded-full object-cover ring-2 transition-all ${
                    m.isAtMeetup ? 'ring-emerald-400 scale-105' : 'ring-slate-700 opacity-60'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleToggleArrived}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
              activeTraveler.isAtMeetup
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {activeTraveler.isAtMeetup
                ? `You're Checked In as ${activeTraveler.name.split(' ')[0]}!`
                : `I Have Arrived (${activeTraveler.name.split(' ')[0]})`}
            </span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Map Header Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Interactive Singapore Crew Radar & GPS Map
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {clickMode === 'set-beacon' 
                ? '🎯 Click anywhere on Singapore map to set the new Rendezvous Beacon!'
                : 'Click map to update your location pin, or click member buttons to jump directly.'}
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* GPS Locate Me Button */}
            <button
              onClick={handleLocateMyGPS}
              disabled={isLocatingGPS}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors"
              title="Use Device GPS to pinpoint your location on Singapore map"
            >
              <LocateFixed className={`w-3.5 h-3.5 text-emerald-600 ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span>{isLocatingGPS ? 'Locating...' : 'Locate Me'}</span>
            </button>

            {/* Click Mode Toggle */}
            <button
              onClick={() => setClickMode(clickMode === 'move-me' ? 'set-beacon' : 'move-me')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                clickMode === 'set-beacon'
                  ? 'bg-amber-500 text-slate-950 border-amber-600'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Toggle click mode"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{clickMode === 'set-beacon' ? 'Targeting Beacon' : 'Move My Pin'}</span>
            </button>

            {/* Center Beacon */}
            <button
              onClick={handleCenterOnBeacon}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              title="Center on Beacon"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Beacon</span>
            </button>

            {/* Fit All Crew */}
            <button
              onClick={handleFitBounds}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              title="Fit all members & beacon on screen"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Fit All</span>
            </button>

            {/* Walking Routes Toggle */}
            <button
              onClick={() => setShowWalkingRoutes(!showWalkingRoutes)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                showWalkingRoutes
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle walking connection lines"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Routes</span>
            </button>

            {/* Tile Style Selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <select
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value as MapStyle)}
                className="bg-transparent border-none text-xs font-medium text-slate-700 py-1 pr-2 pl-1 focus:outline-hidden"
              >
                <option value="osm">Streets (OSM)</option>
                <option value="voyager">Voyager (Clean)</option>
                <option value="satellite">Satellite</option>
                <option value="dark">Night Mode</option>
              </select>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Map'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Leaflet Map DOM Element */}
        <div 
          ref={mapContainerRef} 
          className="w-full relative z-10 bg-slate-100 transition-all duration-300"
          style={{ height: isFullscreen ? 'calc(100vh - 220px)' : '480px', minHeight: '380px' }}
        />

        {/* Quick Member Quick-Jump Bar under Map */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-3 text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Jump to:</span>
            {trip.members.map((m) => {
              const distance = calculateDistanceMeters(m.coordinates || beaconCoords, beaconCoords);
              const eta = formatWalkingEta(distance);
              const isCurrent = m.id === activeTraveler.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleFocusMember(m)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                    m.isAtMeetup 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : isCurrent 
                      ? 'bg-amber-50 text-amber-900 border-amber-200 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <span>{m.name.split(' ')[0]}</span>
                  {m.isAtMeetup ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-tabular">({eta.split(' ')[0]})</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Arrived</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              <span>En Route</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Low Battery (&lt;20%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Member Status Grid & Quick Broadcast */}
      <div className="space-y-4">
        {/* Quick Status Bar for Active Traveler */}
        <form onSubmit={handleUpdateCustomStatus} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2 shadow-xs">
          <div className="flex items-center gap-2 flex-1">
            <img 
              src={activeTraveler.avatar} 
              alt={activeTraveler.name} 
              className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" 
            />
            <input
              type="text"
              value={quickStatus}
              onChange={(e) => setQuickStatus(e.target.value)}
              placeholder={`Broadcast note to crew as ${activeTraveler.name} (e.g. "Ordering satay skewers, meet in 5 mins!")...`}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Update</span>
          </button>
        </form>

        {/* Member Cards Grid with Distance & Walking ETA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {trip.members.map((member) => {
            const isLowBattery = member.battery < 20;
            const coords = member.coordinates || beaconCoords;
            const distMeters = calculateDistanceMeters(coords, beaconCoords);
            const eta = formatWalkingEta(distMeters);
            const isCurrent = member.id === activeTraveler.id;

            return (
              <div
                key={member.id}
                onClick={() => handleFocusMember(member)}
                className={`bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer hover:border-slate-300 hover:shadow-sm ${
                  member.isAtMeetup 
                    ? 'border-emerald-200 bg-emerald-50/15' 
                    : isCurrent 
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{member.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">You</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{member.role}</div>
                    </div>
                  </div>

                  {/* Battery Indicator */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-tabular">
                    {isLowBattery ? (
                      <BatteryWarning className="w-4 h-4 text-rose-500 animate-pulse" />
                    ) : (
                      <Battery className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={isLowBattery ? 'text-rose-600 font-bold' : ''}>
                      {member.battery}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="font-medium truncate">{member.locationName}</span>
                  </div>

                  {/* Distance & ETA Badge */}
                  <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Footprints className="w-3 h-3 text-slate-400" />
                      <span>Distance:</span>
                    </span>
                    <span className="font-semibold text-slate-800 font-tabular">
                      {member.isAtMeetup ? 'At Meetup (0m)' : eta}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 italic">
                    "{member.status}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Active: {member.lastActive}</span>
                    <span className={member.isAtMeetup ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-slate-500'}>
                      {member.isAtMeetup && <Check className="w-3 h-3 text-emerald-600" />}
                      {member.isAtMeetup ? 'At Meetup Beacon' : 'En Route'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Beacon Modal with Singapore Landmark Presets */}
      {isEditingBeacon && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Set Singapore Rendezvous Beacon</h3>
              </div>
              <button 
                onClick={() => setIsEditingBeacon(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Landmark Quick Preset Picker */}
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick-Select Singapore Landmark Preset:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SINGAPORE_LANDMARKS.slice(0, 4).map((landmark, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLandmarkPreset(landmark)}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-800 rounded-md border border-amber-200 font-medium transition-colors"
                  >
                    {landmark.name.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveBeacon} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Meetup Location / Landmark *</label>
                <input
                  type="text"
                  required
                  value={beaconName}
                  onChange={(e) => setBeaconName(e.target.value)}
                  placeholder="e.g. Lau Pa Sat Satay Street (Table 18)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Meetup Time *</label>
                <input
                  type="text"
                  required
                  value={beaconTime}
                  onChange={(e) => setBeaconTime(e.target.value)}
                  placeholder="18:30"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-tabular font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Note for Crew</label>
                <textarea
                  rows={2}
                  value={beaconNotes}
                  onChange={(e) => setBeaconNotes(e.target.value)}
                  placeholder="e.g. Priya has choped the table with tissue packs. Stalls 7 & 8 satay feast starts 18:45."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingBeacon(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
                >
                  Broadcast New Beacon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
