import React, { useState, useEffect, useRef } from 'react';
import { Trip, Traveler } from '../types/travel';
import L from 'leaflet';
import { 
  Navigation, Battery, BatteryWarning, MapPin, 
  Clock, Bell, Check, Edit2, Send, X, Crosshair, 
  Layers, Maximize2, MessageCircle
} from 'lucide-react';

interface RendezvousMapProps {
  trip: Trip;
  activeTraveler: Traveler;
  onUpdateTrip: (updated: Trip) => void;
}

export const RendezvousMap: React.FC<RendezvousMapProps> = ({
  trip,
  activeTraveler,
  onUpdateTrip,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [isEditingBeacon, setIsEditingBeacon] = useState(false);
  const [beaconName, setBeaconName] = useState(trip.meetupPoint.name);
  const [beaconTime, setBeaconTime] = useState(trip.meetupPoint.time);
  const [beaconNotes, setBeaconNotes] = useState(trip.meetupPoint.notes);

  const [quickStatus, setQuickStatus] = useState('');
  const [announcementBanner, setAnnouncementBanner] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Traveler | null>(null);

  const beaconCoords: [number, number] = trip.meetupPoint.coordinates || [1.2807, 103.8504];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: beaconCoords,
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // High quality Voyager tiles for clear Singapore street detail
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);

    // Click map to update active traveler location
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const updatedMembers = trip.members.map((m) => {
        if (m.id === activeTraveler.id) {
          return {
            ...m,
            coordinates: [parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5))] as [number, number],
            locationName: 'Pin dropped on Singapore map',
            lastActive: 'Just now',
          };
        }
        return m;
      });

      onUpdateTrip({
        ...trip,
        members: updatedMembers,
      });

      setAnnouncementBanner(`📍 ${activeTraveler.name} updated location on map.`);
    });

    // Invalidate size after layout renders
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when trip data or active traveler changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // 1. Add Rendezvous Beacon Marker with Pulsing Ring
    const beaconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 bg-amber-400/30 rounded-full animate-ping"></div>
        <div class="relative w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white ring-2 ring-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </div>
      </div>
    `;

    const beaconIcon = L.divIcon({
      html: beaconHtml,
      className: 'custom-beacon-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });

    const beaconMarker = L.marker(beaconCoords, { icon: beaconIcon }).addTo(map);
    beaconMarker.bindPopup(`
      <div class="p-1 font-sans text-xs">
        <div class="font-bold text-slate-900 text-sm flex items-center gap-1">
          <span>📍 Rendezvous Beacon (${trip.meetupPoint.time})</span>
        </div>
        <div class="text-slate-700 font-medium mt-0.5">${trip.meetupPoint.name}</div>
        <div class="text-slate-500 mt-1 italic">${trip.meetupPoint.notes}</div>
      </div>
    `);

    markersRef.current['beacon'] = beaconMarker;

    // 2. Add Member Markers
    trip.members.forEach((member) => {
      const coords = member.coordinates || beaconCoords;
      const isSelected = selectedMember?.id === member.id;
      const isCurrent = activeTraveler.id === member.id;

      const memberHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <div class="relative">
            <img 
              src="${member.avatar}" 
              alt="${member.name}" 
              class="w-9 h-9 rounded-full object-cover shadow-md border-2 ${
                member.isAtMeetup ? 'border-emerald-500 ring-2 ring-emerald-400' : isCurrent ? 'border-amber-500 ring-2 ring-amber-300' : 'border-white'
              }"
            />
            <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-white ${
              member.isAtMeetup ? 'bg-emerald-500' : member.battery < 20 ? 'bg-rose-500' : 'bg-amber-400'
            }"></div>
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-white shadow-xs whitespace-nowrap">
            ${member.name.split(' ')[0]} ${isCurrent ? '(You)' : ''}
          </span>
        </div>
      `;

      const memberIcon = L.divIcon({
        html: memberHtml,
        className: 'custom-traveler-icon',
        iconSize: [42, 54],
        iconAnchor: [21, 48],
        popupAnchor: [0, -45],
      });

      const memberMarker = L.marker(coords, { icon: memberIcon }).addTo(map);
      memberMarker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="flex items-center gap-2">
            <img src="${member.avatar}" class="w-6 h-6 rounded-full object-cover" />
            <div>
              <div class="font-bold text-slate-900">${member.name} (${member.role})</div>
              <div class="text-[11px] text-slate-500">Battery: ${member.battery}% · ${member.lastActive}</div>
            </div>
          </div>
          <div class="mt-2 text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100">
            "${member.status}"
          </div>
          <div class="mt-1 text-[11px] text-slate-500 font-medium">
            📍 ${member.locationName}
          </div>
        </div>
      `);

      markersRef.current[member.id] = memberMarker;
    });
  }, [trip.members, trip.meetupPoint, activeTraveler.id, selectedMember]);

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const allPoints: L.LatLngExpression[] = [
      beaconCoords,
      ...trip.members.map((m) => m.coordinates || beaconCoords),
    ];

    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
  };

  const handleCenterOnBeacon = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(beaconCoords, 17, { duration: 1 });
  };

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

  // Group quick check-in for active traveler
  const handleToggleArrived = () => {
    const updatedMembers = trip.members.map((m) => {
      if (m.id === activeTraveler.id) {
        return {
          ...m,
          isAtMeetup: !m.isAtMeetup,
          coordinates: !m.isAtMeetup ? beaconCoords : m.coordinates,
          status: !m.isAtMeetup ? 'Arrived at Lau Pa Sat Satay Street!' : 'Exploring nearby',
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

    setQuickStatus('');
  };

  const handleSaveBeacon = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTrip({
      ...trip,
      meetupPoint: {
        ...trip.meetupPoint,
        name: beaconName.trim(),
        time: beaconTime.trim(),
        notes: beaconNotes.trim(),
        updatedAt: `Just now by ${activeTraveler.name}`,
      },
    });
    setIsEditingBeacon(false);
    setAnnouncementBanner(`New Rendezvous Beacon set at ${beaconTime}: ${beaconName}`);
  };

  const handleSendRegroupAlert = () => {
    setAnnouncementBanner(
      `🔔 REGROUP ALERT SENT: "${activeTraveler.name} signaled the crew to head to ${trip.meetupPoint.name} for ${trip.meetupPoint.time} meetup."`
    );
  };

  const arrivedCount = trip.members.filter((m) => m.isAtMeetup).length;

  return (
    <div className="space-y-6">
      {/* Broadcast Alert Banner */}
      {announcementBanner && (
        <div className="bg-amber-500 text-slate-950 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 shrink-0" />
            <span>{announcementBanner}</span>
          </div>
          <button
            onClick={() => setAnnouncementBanner(null)}
            className="p-1 hover:bg-amber-600/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rendezvous Beacon Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Navigation className="w-4 h-4" />
              <span>ACTIVE SINGAPORE RENDEZVOUS BEACON</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400 font-normal">{trip.meetupPoint.updatedAt}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {trip.meetupPoint.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <Clock className="w-4 h-4 text-amber-400" />
                Meetup Time: {trip.meetupPoint.time}
              </span>
              <span aria-hidden="true">·</span>
              <span>{trip.meetupPoint.notes}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setIsEditingBeacon(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Beacon</span>
            </button>
            <button
              onClick={handleSendRegroupAlert}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ping Crew</span>
            </button>
          </div>
        </div>

        {/* Check-in Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <span className="text-slate-400">Attendance: </span>
              <strong className="text-white font-tabular">{arrivedCount} of {trip.members.length} Arrived</strong>
            </div>
            <div className="flex -space-x-1.5">
              {trip.members.map((m) => (
                <img
                  key={m.id}
                  src={m.avatar}
                  alt={m.name}
                  title={`${m.name}: ${m.isAtMeetup ? 'At Meetup' : 'En route'}`}
                  className={`w-6 h-6 rounded-full object-cover ring-2 ${
                    m.isAtMeetup ? 'ring-emerald-400' : 'ring-slate-700 opacity-60'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleToggleArrived}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTraveler.isAtMeetup
                ? 'bg-emerald-600 text-white shadow-xs'
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

      {/* Real Interactive Leaflet Singapore Map */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Interactive Singapore GPS Group Map</span>
            </h3>
            <p className="text-xs text-slate-500">
              Live Singapore map view with member markers. Click anywhere on the map to update your location pin!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCenterOnBeacon}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 transition-colors shadow-xs"
              title="Center on Lau Pa Sat Beacon"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-500" />
              <span>Center Beacon</span>
            </button>
            <button
              onClick={handleFitBounds}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 transition-colors shadow-xs"
              title="Show all members and meetup point"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Fit All Crew</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map DOM Element */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-96 sm:h-[450px] relative z-10 bg-slate-100"
          style={{ minHeight: '380px' }}
        />

        {/* Quick Member Quick-Jump Bar under Map */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Jump to:</span>
          {trip.members.map((m) => (
            <button
              key={m.id}
              onClick={() => handleFocusMember(m)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 text-slate-800"
            >
              <img
                src={m.avatar}
                alt={m.name}
                className="w-4 h-4 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="font-medium">{m.name.split(' ')[0]}</span>
              {m.isAtMeetup && <span className="text-emerald-600 font-bold">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Member Status Grid & Quick Update */}
      <div className="space-y-4">
        {/* Quick status bar for active traveler */}
        <form onSubmit={handleUpdateCustomStatus} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-2">
          <input
            type="text"
            value={quickStatus}
            onChange={(e) => setQuickStatus(e.target.value)}
            placeholder={`Broadcast quick note to group as ${activeTraveler.name} (e.g. "Grabbing sugarcane juice, be there in 3 mins")...`}
            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Status</span>
          </button>
        </form>

        {/* Member cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {trip.members.map((member) => {
            const isLowBattery = member.battery < 20;
            return (
              <div
                key={member.id}
                onClick={() => handleFocusMember(member)}
                className={`bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer hover:border-slate-300 ${
                  member.isAtMeetup ? 'border-emerald-200 bg-emerald-50/15' : 'border-slate-200'
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
                        {member.id === activeTraveler.id && (
                          <span className="text-[10px] text-slate-500 font-normal">(You)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{member.nationality || 'Singaporean 🇸🇬'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{member.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Battery Indicator */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-tabular">
                    {isLowBattery ? (
                      <BatteryWarning className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Battery className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={isLowBattery ? 'text-rose-600 font-bold' : ''}>
                      {member.battery}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="font-medium truncate">{member.locationName}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded">
                    "{member.status}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Active: {member.lastActive}</span>
                    <span className={member.isAtMeetup ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      {member.isAtMeetup ? 'At Meetup Beacon' : 'Away'}
                    </span>
                  </div>

                  {/* WhatsApp Direct Link */}
                  {(member.whatsappNumber || member.phone) && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-tabular text-slate-500">
                        {member.whatsappNumber || member.phone}
                      </span>
                      <a
                        href={`https://wa.me/${(member.whatsappNumber || member.phone).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Beacon Modal */}
      {isEditingBeacon && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Set Singapore Rendezvous Beacon</h3>
              <button onClick={() => setIsEditingBeacon(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-tabular"
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingBeacon(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
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
