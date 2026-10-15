import React, { useState, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { Trip, Traveler } from '../types/travel';
import { 
  Navigation, Maximize2, MapPin, 
  ShieldCheck, AlertCircle 
} from 'lucide-react';

interface GoogleRendezvousMapProps {
  trip: Trip;
  activeTraveler: Traveler;
  onUpdateTrip: (updated: Trip) => void;
  selectedMember: Traveler | null;
  onSelectMember: (member: Traveler | null) => void;
}

// Inner Controller for Camera Controls using useMap hook
const MapCameraController: React.FC<{
  beaconCoords: { lat: number; lng: number };
  members: Traveler[];
  selectedMember: Traveler | null;
}> = ({ beaconCoords, members, selectedMember }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedMember) return;
    const coords = selectedMember.coordinates
      ? { lat: selectedMember.coordinates[0], lng: selectedMember.coordinates[1] }
      : beaconCoords;
    map.panTo(coords);
    map.setZoom(18);
  }, [selectedMember, map]);

  return null;
};

export const GoogleRendezvousMap: React.FC<GoogleRendezvousMapProps> = ({
  trip,
  activeTraveler,
  onUpdateTrip,
  selectedMember,
  onSelectMember,
}) => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDoO6w5X6nOOmtc3gOXOfxN0FD39-LhxBc';
  const [activeInfo, setActiveInfo] = useState<'beacon' | Traveler | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  const beaconLat = trip.meetupPoint.coordinates?.[0] || 1.2807;
  const beaconLng = trip.meetupPoint.coordinates?.[1] || 103.8504;
  const beaconPos = { lat: beaconLat, lng: beaconLng };

  const handleMapClick = (e: any) => {
    if (!e.detail?.latLng) return;
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;

    const updatedMembers = trip.members.map((m) => {
      if (m.id === activeTraveler.id) {
        return {
          ...m,
          coordinates: [parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5))] as [number, number],
          locationName: 'Pinned on Google Maps',
          lastActive: 'Just now',
        };
      }
      return m;
    });

    onUpdateTrip({
      ...trip,
      members: updatedMembers,
    });
  };

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] bg-slate-100 overflow-hidden rounded-xl border border-slate-200">
      <APIProvider apiKey={apiKey} libraries={['marker', 'places']}>
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={beaconPos}
          defaultZoom={16}
          gestureHandling="greedy"
          mapTypeId={mapType}
          disableDefaultUI={false}
          onClick={handleMapClick}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {/* Inner Map Controller */}
          <MapCameraController 
            beaconCoords={beaconPos} 
            members={trip.members} 
            selectedMember={selectedMember} 
          />

          {/* 1. Central Rendezvous Beacon Advanced Marker */}
          <AdvancedMarker
            position={beaconPos}
            onClick={() => setActiveInfo('beacon')}
            title={`Rendezvous Beacon: ${trip.meetupPoint.name}`}
          >
            <div className="relative flex items-center justify-center cursor-pointer group">
              <div className="absolute w-12 h-12 bg-amber-400/35 rounded-full animate-ping pointer-events-none" />
              <div className="relative w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white ring-2 ring-amber-400 hover:scale-110 transition-transform">
                <Navigation className="w-5 h-5 fill-slate-950" />
              </div>
              <div className="absolute -top-7 whitespace-nowrap bg-slate-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-amber-400/40">
                Beacon ({trip.meetupPoint.time})
              </div>
            </div>
          </AdvancedMarker>

          {/* 2. Group Member Advanced Markers */}
          {trip.members.map((member) => {
            const mLat = member.coordinates?.[0] || beaconLat;
            const mLng = member.coordinates?.[1] || beaconLng;
            const isCurrent = activeTraveler.id === member.id;
            const isAtBeacon = member.isAtMeetup;

            return (
              <AdvancedMarker
                key={member.id}
                position={{ lat: mLat, lng: mLng }}
                onClick={() => {
                  setActiveInfo(member);
                  onSelectMember(member);
                }}
                title={`${member.name} - ${member.role}`}
              >
                <div className="relative flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className={`w-9 h-9 rounded-full object-cover shadow-md border-2 ${
                        isAtBeacon 
                          ? 'border-emerald-500 ring-2 ring-emerald-400' 
                          : isCurrent 
                          ? 'border-amber-500 ring-2 ring-amber-300' 
                          : 'border-white'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-white ${
                        isAtBeacon 
                          ? 'bg-emerald-500' 
                          : member.battery < 20 
                          ? 'bg-rose-500' 
                          : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <span className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-white shadow-xs whitespace-nowrap">
                    {member.name.split(' ')[0]} {isCurrent ? '(You)' : ''}
                  </span>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* 3. InfoWindow for Beacon */}
          {activeInfo === 'beacon' && (
            <InfoWindow
              position={beaconPos}
              onCloseClick={() => setActiveInfo(null)}
            >
              <div className="p-2 max-w-xs font-sans text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  <Navigation className="w-4 h-4 text-amber-500" />
                  <span>Rendezvous Beacon ({trip.meetupPoint.time})</span>
                </div>
                <div className="font-semibold text-slate-800">{trip.meetupPoint.name}</div>
                <p className="text-slate-600 italic bg-amber-50/60 p-1.5 rounded border border-amber-100">
                  "{trip.meetupPoint.notes}"
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Updated: {trip.meetupPoint.updatedAt}
                </div>
              </div>
            </InfoWindow>
          )}

          {/* 4. InfoWindow for Selected Member */}
          {activeInfo && activeInfo !== 'beacon' && (
            <InfoWindow
              position={{
                lat: activeInfo.coordinates?.[0] || beaconLat,
                lng: activeInfo.coordinates?.[1] || beaconLng,
              }}
              onCloseClick={() => setActiveInfo(null)}
            >
              <div className="p-2 max-w-xs font-sans text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <img
                    src={activeInfo.avatar}
                    alt={activeInfo.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="font-bold text-slate-900">
                      {activeInfo.name} ({activeInfo.role})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Battery: {activeInfo.battery}% · Active {activeInfo.lastActive}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-700 italic">
                  "{activeInfo.status}"
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activeInfo.locationName}</span>
                </div>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className={activeInfo.isAtMeetup ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                    {activeInfo.isAtMeetup ? 'At Beacon ✓' : 'Away from Beacon'}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeInfo.coordinates?.[0]},${activeInfo.coordinates?.[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 hover:text-amber-950 font-semibold underline"
                  >
                    Directions
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Map Mode Switcher */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-lg border border-slate-200/80 shadow-md text-xs">
        <button
          onClick={() => setMapType('roadmap')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            mapType === 'roadmap' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Street
        </button>
        <button
          onClick={() => setMapType('satellite')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            mapType === 'satellite' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
};
