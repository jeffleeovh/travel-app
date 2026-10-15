import React, { useState } from 'react';
import { Trip, Traveler } from '../types/travel';
import { 
  Navigation, Battery, BatteryWarning, MapPin, 
  Clock, Bell, Check, Edit2, Send, AlertTriangle, X 
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
  const [isEditingBeacon, setIsEditingBeacon] = useState(false);
  const [beaconName, setBeaconName] = useState(trip.meetupPoint.name);
  const [beaconTime, setBeaconTime] = useState(trip.meetupPoint.time);
  const [beaconNotes, setBeaconNotes] = useState(trip.meetupPoint.notes);

  const [quickStatus, setQuickStatus] = useState('');
  const [announcementBanner, setAnnouncementBanner] = useState<string | null>(null);

  // Group quick check-in for active traveler
  const handleToggleArrived = () => {
    const updatedMembers = trip.members.map((m) => {
      if (m.id === activeTraveler.id) {
        return {
          ...m,
          isAtMeetup: !m.isAtMeetup,
          status: !m.isAtMeetup ? 'Arrived at Rendezvous Point!' : 'Exploring nearby',
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
              <span>ACTIVE GROUP RENDEZVOUS BEACON</span>
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

      {/* Spatial Radar Simulation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Spatial Group Radar · Singapore CBD & Telok Ayer</h3>
            <p className="text-xs text-slate-500">Real-time GPS proximity to the Lau Pa Sat Satay Street meetup beacon.</p>
          </div>
          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            Telok Ayer Proximity: Active
          </span>
        </div>

        {/* Visual Map Canvas Simulation */}
        <div className="relative h-64 sm:h-72 w-full rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
          {/* Subtle radial distance rings */}
          <div className="absolute w-48 h-48 rounded-full border border-slate-800/80 pointer-events-none" />
          <div className="absolute w-80 h-80 rounded-full border border-slate-800/50 pointer-events-none" />
          <div className="absolute w-120 h-120 rounded-full border border-slate-800/30 pointer-events-none" />

          {/* Central Meetup Beacon */}
          <div className="absolute z-10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/20 ring-4 ring-amber-400/30 animate-pulse">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="mt-1.5 text-[11px] font-bold text-amber-300 bg-slate-900/90 px-2 py-0.5 rounded shadow-sm border border-amber-400/30 whitespace-nowrap">
              Lau Pa Sat Beacon ({trip.meetupPoint.time})
            </span>
          </div>

          {/* Member 1: Alex (Chinatown Hotel, West) */}
          <div className="absolute top-10 left-16 flex flex-col items-center">
            <img
              src={trip.members[0].avatar}
              alt={trip.members[0].name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-400 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] text-white bg-slate-900/80 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
              Alex (Chinatown 400m)
            </span>
          </div>

          {/* Member 2: Priya (At Satay Table 18!) */}
          <div className="absolute top-24 left-1/2 ml-6 flex flex-col items-center">
            <img
              src={trip.members[1].avatar}
              alt={trip.members[1].name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-400 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] text-emerald-300 bg-slate-900/80 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
              Priya (At Table 18)
            </span>
          </div>

          {/* Member 3: Wei Ming (Telok Ayer MRT, close) */}
          <div className="absolute bottom-12 left-1/3 flex flex-col items-center">
            <img
              src={trip.members[2].avatar}
              alt={trip.members[2].name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-400 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] text-emerald-300 bg-slate-900/80 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
              Wei Ming (MRT Exit A, 90m)
            </span>
          </div>

          {/* Member 4: Sarah (Amoy St Shophouses) */}
          <div className="absolute top-8 right-20 flex flex-col items-center">
            <img
              src={trip.members[3].avatar}
              alt={trip.members[3].name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] text-amber-300 bg-slate-900/80 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
              Sarah (Amoy St, 280m)
            </span>
          </div>

          {/* Member 5: Ryan (Cross St Grab junction) */}
          <div className="absolute bottom-16 right-1/3 flex flex-col items-center">
            <img
              src={trip.members[4].avatar}
              alt={trip.members[4].name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-400 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] text-sky-300 bg-slate-900/80 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
              Ryan (Cross St, 150m)
            </span>
          </div>
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
            placeholder={`Broadcast quick note to group as ${activeTraveler.name} (e.g. "Grabbing water bottles, be there in 3 mins")...`}
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
                className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
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
                      <div className="text-[11px] text-slate-400">{member.role}</div>
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
              <h3 className="text-base font-bold text-slate-900">Set Rendezvous Beacon</h3>
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
                  placeholder="e.g. Vernazza Harbor Piazza Marconi (by the fountain)"
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
                  placeholder="e.g. Marcus has boat passes. We walk together to the pier."
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
