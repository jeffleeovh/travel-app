import React, { useState } from 'react';
import { Traveler } from '../types/travel';
import { ChevronDown, Share2, Compass, Check, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeTraveler: Traveler;
  allMembers: Traveler[];
  onSelectTraveler: (traveler: Traveler) => void;
  onOpenExportModal: () => void;
  theme: 'day' | 'night';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  activeTraveler,
  allMembers,
  onSelectTraveler,
  onOpenExportModal,
  theme,
  onToggleTheme,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const navItems = [
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'voting', label: 'Group Votes' },
    { id: 'expenses', label: 'FairShare Ledger' },
    { id: 'rendezvous', label: 'Live Rendezvous' },
    { id: 'local-gems', label: 'Local Gems' },
    { id: 'packing', label: 'Gear List' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Compass className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap leading-none">
              CrewVoyage
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              SINGAPORE
            </span>
          </div>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 text-sm font-medium ${
                  isActive
                    ? 'text-slate-900 border-b-2 border-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Day vs. Night Toggle, Active Persona Switcher & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Day vs. Night Mode Toggle */}
          <div 
            className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 transition-colors"
            role="group"
            aria-label="Day versus Night Mode Toggle"
          >
            <button
              type="button"
              onClick={() => theme !== 'day' && onToggleTheme()}
              aria-pressed={theme === 'day'}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                theme === 'day'
                  ? 'bg-white text-amber-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Day Mode: Singapore daylight hawker trails, botanic walks, and kopitiams"
            >
              <Sun className={`w-3.5 h-3.5 ${theme === 'day' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-[11px]">Day</span>
            </button>
            <button
              type="button"
              onClick={() => theme !== 'night' && onToggleTheme()}
              aria-pressed={theme === 'night'}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                theme === 'night'
                  ? 'bg-slate-900 text-amber-300 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Night Mode: Lau Pa Sat satay street, Marina Bay light show, and rooftop skylines"
            >
              <Moon className={`w-3.5 h-3.5 ${theme === 'night' ? 'text-amber-300' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-[11px]">Night</span>
            </button>
          </div>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-slate-200/60"
              title="Switch user perspective to test multi-member collaboration"
            >
              <img
                src={activeTraveler.avatar}
                alt={activeTraveler.name}
                className="w-5 h-5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="hidden sm:inline font-semibold text-slate-900">{activeTraveler.name.split(' ')[0]}</span>
              <span className="text-slate-500 hidden lg:inline">({activeTraveler.role})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">Switch Traveler Persona</p>
                  <p className="text-[11px] text-slate-500">Test voting, check-in, & debt from any member's perspective</p>
                </div>
                <div className="py-1">
                  {allMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        onSelectTraveler(member);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                        activeTraveler.id === member.id ? 'bg-slate-50 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-6 h-6 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="text-slate-900">{member.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{member.role}</div>
                        </div>
                      </div>
                      {activeTraveler.id === member.id && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary Action: Share */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar below header for small screens */}
      <div className="md:hidden flex overflow-x-auto gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`whitespace-nowrap shrink-0 py-1 px-2 rounded font-medium ${
              currentTab === item.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
