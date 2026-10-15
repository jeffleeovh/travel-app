import React, { useState } from 'react';
import { Trip, Traveler } from '../types/travel';
import { 
  Users, UserPlus, Edit3, Trash2, Phone, Globe, Shield, 
  Check, X, ExternalLink, Copy, Search, AlertTriangle, 
  Crown, Compass, Utensils, DollarSign, Camera, MapPin, 
  Battery, CheckCircle2, MessageCircle
} from 'lucide-react';

interface TravellerManagerProps {
  trip: Trip;
  activeTraveler: Traveler;
  onUpdateTrip: (updated: Trip) => void;
  onSelectTraveler: (traveler: Traveler) => void;
}

const PRESET_AVATARS = [
  { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80' },
  { label: 'Avatar 5', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Avatar 6', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { label: 'Avatar 7', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' },
  { label: 'Avatar 8', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80' },
];

const POPULAR_NATIONALITIES = [
  'Singaporean 🇸🇬',
  'Malaysian 🇲🇾',
  'Indonesian 🇮🇩',
  'British 🇬🇧',
  'American 🇺🇸',
  'Australian 🇦🇺',
  'Indian 🇮🇳',
  'Japanese 🇯🇵',
  'Chinese 🇨🇳',
  'Canadian 🇨🇦',
  'German 🇩🇪',
  'French 🇫🇷',
  'South Korean 🇰🇷',
  'Filipino 🇵🇭',
  'New Zealander 🇳🇿',
  'Thai 🇹🇭',
];

export const TravellerManager: React.FC<TravellerManagerProps> = ({
  trip,
  activeTraveler,
  onUpdateTrip,
  onSelectTraveler,
}) => {
  const isOrganizer = activeTraveler.role === 'Organizer' || activeTraveler.role === 'Tour Leader';
  const organizerMember = trip.members.find((m) => m.role === 'Organizer' || m.role === 'Tour Leader') || trip.members[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<Traveler | null>(null);
  const [deletingTraveler, setDeletingTraveler] = useState<Traveler | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Form States (used for Add and Edit)
  const [formName, setFormName] = useState('');
  const [formNationality, setFormNationality] = useState('Singaporean 🇸🇬');
  const [customNationality, setCustomNationality] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('+65 ');
  const [formRole, setFormRole] = useState<Traveler['role']>('Traveler');
  const [formAvatar, setFormAvatar] = useState(PRESET_AVATARS[0].url);
  const [formStatus, setFormStatus] = useState('Ready for adventure in Singapore!');
  const [formLocation, setFormLocation] = useState('Singapore Central');

  const openAddModal = () => {
    setFormName('');
    setFormNationality('Singaporean 🇸🇬');
    setCustomNationality('');
    setFormWhatsapp('+65 ');
    setFormRole('Traveler');
    setFormAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].url);
    setFormStatus('Ready for adventure in Singapore!');
    setFormLocation('Singapore Central');
    setIsAddModalOpen(true);
  };

  const openEditModal = (traveler: Traveler) => {
    setEditingTraveler(traveler);
    setFormName(traveler.name);
    if (POPULAR_NATIONALITIES.includes(traveler.nationality)) {
      setFormNationality(traveler.nationality);
      setCustomNationality('');
    } else {
      setFormNationality('Other');
      setCustomNationality(traveler.nationality || '');
    }
    setFormWhatsapp(traveler.whatsappNumber || traveler.phone || '');
    setFormRole(traveler.role);
    setFormAvatar(traveler.avatar);
    setFormStatus(traveler.status || 'Exploring Singapore');
    setFormLocation(traveler.locationName || 'Singapore');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formWhatsapp.trim()) return;

    const finalNationality = formNationality === 'Other' 
      ? (customNationality.trim() || 'Global Citizen 🌍')
      : formNationality;

    const newId = `mem-${Date.now()}`;
    const newTraveler: Traveler = {
      id: newId,
      name: formName.trim(),
      role: formRole,
      avatar: formAvatar,
      phone: formWhatsapp.trim(),
      whatsappNumber: formWhatsapp.trim(),
      nationality: finalNationality,
      status: formStatus.trim() || 'Joined Singapore Crew',
      locationName: formLocation.trim() || 'Singapore',
      battery: 85,
      lastActive: 'Just now',
      isAtMeetup: false,
    };

    onUpdateTrip({
      ...trip,
      members: [...trip.members, newTraveler],
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTraveler || !formName.trim() || !formWhatsapp.trim()) return;

    const finalNationality = formNationality === 'Other' 
      ? (customNationality.trim() || 'Global Citizen 🌍')
      : formNationality;

    const updatedMembers = trip.members.map((m) => {
      if (m.id === editingTraveler.id) {
        return {
          ...m,
          name: formName.trim(),
          role: formRole,
          avatar: formAvatar,
          phone: formWhatsapp.trim(),
          whatsappNumber: formWhatsapp.trim(),
          nationality: finalNationality,
          status: formStatus.trim(),
          locationName: formLocation.trim(),
        };
      }
      return m;
    });

    onUpdateTrip({
      ...trip,
      members: updatedMembers,
    });

    setEditingTraveler(null);
  };

  const openDeleteModal = (traveler: Traveler) => {
    // Check if this is the only Organizer in the group
    const organizerCount = trip.members.filter((m) => m.role === 'Organizer').length;
    if (traveler.role === 'Organizer' && organizerCount <= 1) {
      setDeleteErrorMessage('Cannot remove the only Organizer of this trip. Please assign another member as Organizer first before deleting.');
    } else {
      setDeleteErrorMessage(null);
    }
    setDeletingTraveler(traveler);
  };

  const handleConfirmDelete = () => {
    if (!deletingTraveler) return;

    const targetId = deletingTraveler.id;
    const remainingMembers = trip.members.filter((m) => m.id !== targetId);

    // Fallback leader if deleted person was leading activities or paying
    const fallbackLeaderId = remainingMembers.find((m) => m.role === 'Organizer')?.id || remainingMembers[0]?.id || '';

    // Clean activities
    const updatedDays = trip.days.map((day) => ({
      ...day,
      activities: day.activities.map((act) => ({
        ...act,
        assignedLeaderId: act.assignedLeaderId === targetId ? fallbackLeaderId : act.assignedLeaderId,
      })),
    }));

    // Clean expenses
    const updatedExpenses = trip.expenses.map((exp) => ({
      ...exp,
      paidById: exp.paidById === targetId ? fallbackLeaderId : exp.paidById,
      splitWithIds: exp.splitWithIds.filter((id) => id !== targetId),
    }));

    // Clean proposals
    const updatedProposals = trip.proposals.map((prop) => ({
      ...prop,
      proposedById: prop.proposedById === targetId ? fallbackLeaderId : prop.proposedById,
      upvotes: prop.upvotes.filter((id) => id !== targetId),
      downvotes: prop.downvotes.filter((id) => id !== targetId),
    }));

    // Clean packing items
    const updatedPacking = trip.packingItems.map((item) => ({
      ...item,
      assignedToId: item.assignedToId === targetId ? fallbackLeaderId : item.assignedToId,
    }));

    onUpdateTrip({
      ...trip,
      members: remainingMembers,
      days: updatedDays,
      expenses: updatedExpenses,
      proposals: updatedProposals,
      packingItems: updatedPacking,
    });

    // If active traveler was the one deleted, switch to fallback leader
    if (activeTraveler.id === targetId && remainingMembers.length > 0) {
      onSelectTraveler(remainingMembers[0]);
    }

    setDeletingTraveler(null);
  };

  const handleCopyWhatsApp = (number: string, id: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cleanPhoneForWhatsApp = (rawPhone: string) => {
    return rawPhone.replace(/[^0-9]/g, '');
  };

  // Filtered members list
  const filteredMembers = trip.members.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.nationality && member.nationality.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.whatsappNumber && member.whatsappNumber.includes(searchQuery)) ||
      (member.role && member.role.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || member.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Calculate unique nationalities
  const uniqueNationalities = Array.from(new Set(trip.members.map((m) => m.nationality).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Banner: Organizer Permission Indicator & Switcher */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isOrganizer 
          ? 'bg-amber-50/70 border-amber-200 text-slate-800' 
          : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isOrganizer ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'
            }`}>
              {isOrganizer ? <Crown className="w-5 h-5 text-slate-950" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isOrganizer ? 'Organizer Privileges Active' : 'View-Only Member Roster'}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isOrganizer ? 'bg-amber-400/30 text-amber-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeTraveler.role} Mode
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isOrganizer ? (
                  <span>You are signed in as <strong>{activeTraveler.name}</strong>. You have permission to add, edit, and delete travellers.</span>
                ) : (
                  <span>Only the trip Organizer can add, edit, or delete travellers. You are viewing as <strong>{activeTraveler.name}</strong> ({activeTraveler.role}).</span>
                )}
              </p>
            </div>
          </div>

          {!isOrganizer && organizerMember && (
            <button
              onClick={() => onSelectTraveler(organizerMember)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs shrink-0"
              title={`Switch to ${organizerMember.name} to test adding, editing and deleting travellers`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Switch to Organizer ({organizerMember.name.split(' ')[0]})</span>
            </button>
          )}

          {isOrganizer && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Traveller</span>
            </button>
          )}
        </div>
      </div>

      {/* Roster KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Total Travellers</span>
          </div>
          <div className="text-2xl font-bold font-tabular text-slate-900">
            {trip.members.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Registered in Crew</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>Nationalities</span>
          </div>
          <div className="text-2xl font-bold font-tabular text-slate-900">
            {uniqueNationalities.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Global passport mix</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Ready</span>
          </div>
          <div className="text-2xl font-bold font-tabular text-emerald-700">
            {trip.members.filter((m) => m.whatsappNumber).length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Direct group reach</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <span>Beacon Check-in</span>
          </div>
          <div className="text-2xl font-bold font-tabular text-slate-900">
            {trip.members.filter((m) => m.isAtMeetup).length} / {trip.members.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">At rendezvous point</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search travellers by name, nationality, or WhatsApp number..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap pl-1">Role:</span>
          {['all', 'Organizer', 'Navigator', 'Foodie', 'Budget Master', 'Photographer', 'Traveler'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'all' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Travellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const isMe = member.id === activeTraveler.id;
          const isMemberOrganizer = member.role === 'Organizer';
          const cleanPhone = cleanPhoneForWhatsApp(member.whatsappNumber || member.phone || '');

          return (
            <div
              key={member.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                isMe ? 'ring-2 ring-slate-900 border-transparent' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header & Avatar */}
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      {isMemberOrganizer && (
                        <div 
                          className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 p-1 rounded-full shadow-xs"
                          title="Trip Organizer"
                        >
                          <Crown className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                        {isMe && (
                          <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>

                      {/* Role Badge */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          member.role === 'Organizer' || member.role === 'Tour Leader' ? 'bg-amber-100 text-amber-900 font-bold' :
                          member.role === 'Navigator' ? 'bg-sky-100 text-sky-800' :
                          member.role === 'Foodie' ? 'bg-orange-100 text-orange-800' :
                          member.role === 'Budget Master' ? 'bg-emerald-100 text-emerald-800' :
                          member.role === 'Photographer' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Organizer Quick Actions (Edit / Delete) */}
                  {isOrganizer && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit traveller details (Name, Nationality, WhatsApp)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(member)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove traveller from trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Mandatory Fields Display: Nationality & WhatsApp Number */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                  {/* Nationality */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      Nationality:
                    </span>
                    <span className="font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                      {member.nationality || 'Singaporean 🇸🇬'}
                    </span>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold font-tabular text-slate-800">
                        {member.whatsappNumber || member.phone}
                      </span>
                      <button
                        onClick={() => handleCopyWhatsApp(member.whatsappNumber || member.phone, member.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy phone number"
                      >
                        {copiedId === member.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Location & Status Note */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[170px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {member.locationName}
                      </span>
                      <span className="flex items-center gap-1 font-tabular text-[10px]">
                        <Battery className="w-3 h-3 text-slate-400" />
                        {member.battery}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic truncate">
                      "{member.status}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>

                {!isMe && (
                  <button
                    onClick={() => onSelectTraveler(member)}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                    title="Switch active user persona to view app from their perspective"
                  >
                    View As
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No travellers match your search filter</h4>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or role filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
            className="mt-3 text-xs font-semibold text-slate-900 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ADD TRAVELLER MODAL (ORGANIZER ONLY) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Traveller</h3>
                  <p className="text-xs text-slate-500">Register a new companion for the Singapore journey</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 pt-4 text-xs">
              {/* Field 1: Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Liam Vance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                />
              </div>

              {/* Field 2: Nationality */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nationality <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formNationality}
                  onChange={(e) => setFormNationality(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  {POPULAR_NATIONALITIES.map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                  <option value="Other">Other / Custom Nationality...</option>
                </select>

                {formNationality === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customNationality}
                    onChange={(e) => setCustomNationality(e.target.value)}
                    placeholder="Enter custom nationality (e.g. New Zealander 🇳🇿)"
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                )}
              </div>

              {/* Field 3: WhatsApp Number */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  WhatsApp Number (with country code) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input
                    type="text"
                    required
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="+65 9123 4567 or +1 415 555 2671"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-tabular font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Includes international country code (e.g. +65 for Singapore, +60 for Malaysia, +1 for US/Canada)
                </p>
              </div>

              {/* Field 4: Role */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Trip Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  <option value="Traveler">Traveler (General Member)</option>
                  <option value="Tour Leader">Tour Leader (Itinerary & Tour Guide)</option>
                  <option value="Organizer">Organizer (Full Admin Rights)</option>
                  <option value="Navigator">Navigator (Maps & Transit Lead)</option>
                  <option value="Foodie">Foodie (Hawker & Dining Scout)</option>
                  <option value="Budget Master">Budget Master (Expense Oversight)</option>
                  <option value="Photographer">Photographer (Visual Chronicler)</option>
                </select>
              </div>

              {/* Field 5: Avatar Picker */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Select Profile Photo</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormAvatar(preset.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        formAvatar === preset.url ? 'border-slate-900 ring-2 ring-slate-900/20 scale-105' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={preset.url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {formAvatar === preset.url && (
                        <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="Or paste custom image URL..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Field 6: Status & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Current Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Changi Airport T3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status Note</label>
                  <input
                    type="text"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    placeholder="e.g. Arrived and luggage collected"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
                >
                  Add Traveller to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TRAVELLER MODAL (ORGANIZER ONLY) */}
      {editingTraveler && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Traveller</h3>
                  <p className="text-xs text-slate-500">Update profile for {editingTraveler.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTraveler(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
              {/* Field 1: Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                />
              </div>

              {/* Field 2: Nationality */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nationality <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formNationality}
                  onChange={(e) => setFormNationality(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  {POPULAR_NATIONALITIES.map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                  <option value="Other">Other / Custom Nationality...</option>
                </select>

                {formNationality === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customNationality}
                    onChange={(e) => setCustomNationality(e.target.value)}
                    placeholder="Enter custom nationality (e.g. South African 🇿🇦)"
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                )}
              </div>

              {/* Field 3: WhatsApp Number */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  WhatsApp Number (with country code) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input
                    type="text"
                    required
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-tabular font-medium"
                  />
                </div>
              </div>

              {/* Field 4: Role */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Trip Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  <option value="Organizer">Organizer (Full Admin Rights)</option>
                  <option value="Tour Leader">Tour Leader (Itinerary & Tour Guide)</option>
                  <option value="Navigator">Navigator (Maps & Transit Lead)</option>
                  <option value="Foodie">Foodie (Hawker & Dining Scout)</option>
                  <option value="Budget Master">Budget Master (Expense Oversight)</option>
                  <option value="Photographer">Photographer (Visual Chronicler)</option>
                  <option value="Traveler">Traveler (General Member)</option>
                </select>
              </div>

              {/* Field 5: Avatar Picker */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Profile Photo</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormAvatar(preset.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        formAvatar === preset.url ? 'border-slate-900 ring-2 ring-slate-900/20 scale-105' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={preset.url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {formAvatar === preset.url && (
                        <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="Or paste custom image URL..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Status and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Current Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status Note</label>
                  <input
                    type="text"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTraveler(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (ORGANIZER ONLY) */}
      {deletingTraveler && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Traveller</h3>
                <p className="text-xs text-slate-500">Confirm removal from trip roster</p>
              </div>
            </div>

            {deleteErrorMessage ? (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 mb-4">
                {deleteErrorMessage}
              </div>
            ) : (
              <div className="space-y-3 py-2 text-xs">
                <p className="text-slate-600">
                  Are you sure you want to remove <strong>{deletingTraveler.name}</strong> from the trip?
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                  <img
                    src={deletingTraveler.avatar}
                    alt={deletingTraveler.name}
                    className="w-10 h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="font-bold text-slate-900">{deletingTraveler.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {deletingTraveler.nationality} · {deletingTraveler.role}
                    </div>
                    <div className="text-[11px] text-slate-400 font-tabular">
                      {deletingTraveler.whatsappNumber || deletingTraveler.phone}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Their assigned itinerary items and expense splits will automatically be transferred to the Organizer so no data is lost.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setDeletingTraveler(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
              >
                {deleteErrorMessage ? 'Close' : 'Cancel'}
              </button>
              {!deleteErrorMessage && (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
