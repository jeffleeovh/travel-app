import React, { useState, useEffect } from 'react';
import { Trip, Traveler } from './types/travel';
import { INITIAL_TRIP, INITIAL_MEMBERS } from './data/mockData';
import { Header } from './components/Header';
import { ItineraryView } from './components/ItineraryView';
import { VotingHub } from './components/VotingHub';
import { ExpenseSplitter } from './components/ExpenseSplitter';
import { RendezvousMap } from './components/RendezvousMap';
import { LocalInsiderView } from './components/LocalInsiderView';
import { PackingList } from './components/PackingList';
import { TravellerManager } from './components/TravellerManager';
import { WhatsAppExportModal } from './components/WhatsAppExportModal';
import { 
  Users, Sparkles, Shield, HeartHandshake, 
  MapPin, Calendar, Check 
} from 'lucide-react';

export default function App() {
  const [trip, setTrip] = useState<Trip>(() => {
    const saved = localStorage.getItem('crewvoyage_trip');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.members)) {
          // Normalize legacy cached members to ensure nationality & whatsappNumber are present
          parsed.members = parsed.members.map((m: any, idx: number) => ({
            ...m,
            role: m.role || 'Traveler',
            nationality: m.nationality || (idx === 0 || idx === 1 ? 'Singaporean 🇸🇬' : idx === 2 ? 'Malaysian 🇲🇾' : idx === 3 ? 'British 🇬🇧' : 'Australian 🇦🇺'),
            whatsappNumber: m.whatsappNumber || m.phone || '+65 9123 4567',
          }));
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse cached trip:', e);
      }
    }
    return INITIAL_TRIP;
  });

  const [activeTraveler, setActiveTraveler] = useState<Traveler>(() => {
    return trip.members[0] || INITIAL_MEMBERS[0];
  });

  const [currentTab, setCurrentTab] = useState<string>('itinerary');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeSegmentMode, setActiveSegmentMode] = useState<'friends' | 'family' | 'agency'>('friends');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('crewvoyage_trip', JSON.stringify(trip));
  }, [trip]);

  // Keep activeTraveler in sync if trip members change
  useEffect(() => {
    const found = trip.members.find((m) => m.id === activeTraveler.id);
    if (found) {
      setActiveTraveler(found);
    }
  }, [trip.members]);

  const handleSelectTraveler = (traveler: Traveler) => {
    setActiveTraveler(traveler);
  };

  const handleUpdateTrip = (updated: Trip) => {
    setTrip(updated);
  };

  const handleSwitchSegment = (mode: 'friends' | 'family' | 'agency') => {
    setActiveSegmentMode(mode);
    if (mode === 'family') {
      setTrip({
        ...trip,
        title: 'Singapore Multigen Family Discovery (6 Pax)',
        destination: 'Singapore (Family Friendly & Accessible)',
        meetupPoint: {
          name: 'Gardens by the Bay Children’s Garden Water Play',
          time: '16:30',
          notes: 'Family regroup before Supertree light show. Shaded benches, stroller parking & baby changing nearby.',
          updatedAt: 'Just now by Family Lead',
        },
      });
    } else if (mode === 'agency') {
      setTrip({
        ...trip,
        title: 'Singapore MICE & Heritage Incentive Group (#SG-2026)',
        destination: 'Singapore (Marina Bay & Sentosa)',
        meetupPoint: {
          name: 'Sands Expo & Convention Centre Concierge',
          time: '18:00',
          notes: 'Agent briefing: VIP 24-seater coach departing for Chilli Crab banquet at Riverside Quay.',
          updatedAt: 'Managed via Travel Agent Portal (Freemium Tier Active)',
        },
      });
    } else {
      setTrip(INITIAL_TRIP);
    }
  };

  const activeDay = trip.days[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Bar following Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        activeTraveler={activeTraveler}
        allMembers={trip.members}
        onSelectTraveler={handleSelectTraveler}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Target Audience Segment Strip (from Canvas: Private Friends | Family Group | Travel Agency) */}
      <div className="bg-slate-900 text-white text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Group Travel Mode:</span>
            <span className="font-semibold text-white">
              {activeSegmentMode === 'friends' && 'Private Friends Trip (5 members)'}
              {activeSegmentMode === 'family' && 'Multigenerational Family (All ages & paces)'}
              {activeSegmentMode === 'agency' && 'Travel Agent Managed Tour (Pro Group Hub)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg">
            <button
              onClick={() => handleSwitchSegment('friends')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeSegmentMode === 'friends' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Friends Crew
            </button>
            <button
              onClick={() => handleSwitchSegment('family')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeSegmentMode === 'family' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Family Group
            </button>
            <button
              onClick={() => handleSwitchSegment('agency')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeSegmentMode === 'agency' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Agency View
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'itinerary' && (
          <ItineraryView
            trip={trip}
            activeTraveler={activeTraveler}
            onUpdateTrip={handleUpdateTrip}
            onNavigateToRendezvous={() => setCurrentTab('rendezvous')}
          />
        )}

        {currentTab === 'travellers' && (
          <TravellerManager
            trip={trip}
            activeTraveler={activeTraveler}
            onUpdateTrip={handleUpdateTrip}
            onSelectTraveler={handleSelectTraveler}
          />
        )}

        {currentTab === 'voting' && (
          <VotingHub
            trip={trip}
            activeTraveler={activeTraveler}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpenseSplitter
            trip={trip}
            activeTraveler={activeTraveler}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {currentTab === 'rendezvous' && (
          <RendezvousMap
            trip={trip}
            activeTraveler={activeTraveler}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {currentTab === 'local-gems' && (
          <LocalInsiderView
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
            onNavigateToItinerary={() => setCurrentTab('itinerary')}
          />
        )}

        {currentTab === 'packing' && (
          <PackingList
            trip={trip}
            activeTraveler={activeTraveler}
            onUpdateTrip={handleUpdateTrip}
          />
        )}
      </main>

      {/* WhatsApp Export Modal */}
      <WhatsAppExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        trip={trip}
        activeDay={activeDay}
      />

      {/* Subtle Minimalist Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">CrewVoyage</span>
            <span aria-hidden="true">·</span>
            <span>Collaborative Group Travel Workspace</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Logged in as {activeTraveler.name}</span>
            <span aria-hidden="true">·</span>
            <span>{trip.members.length} Active Travelers</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => {
                localStorage.removeItem('crewvoyage_trip');
                setTrip(INITIAL_TRIP);
              }}
              className="text-slate-500 hover:text-slate-900 underline"
            >
              Reset Demo State
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
