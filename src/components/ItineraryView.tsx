import React, { useState } from 'react';
import { Trip, DayPlan, ActivityItem, Traveler } from '../types/travel';
import { formatCurrency } from '../utils/travelUtils';
import { 
  Clock, MapPin, Plus, User, FileText, CheckCircle2, 
  Sun, CloudSun, CloudRain, Calendar, Navigation, Trash2, 
  Edit3, X, Crown, ArrowUp, ArrowDown, AlertCircle, 
  Megaphone, Shield, Check, Compass, Sparkles
} from 'lucide-react';

interface ItineraryViewProps {
  trip: Trip;
  activeTraveler: Traveler;
  onUpdateTrip: (updated: Trip) => void;
  onNavigateToRendezvous: () => void;
  onSelectTraveler?: (traveler: Traveler) => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  trip,
  activeTraveler,
  onUpdateTrip,
  onNavigateToRendezvous,
  onSelectTraveler,
}) => {
  const isTourLeader = activeTraveler.role === 'Organizer' || activeTraveler.role === 'Tour Leader';
  const tourLeaderMember = trip.members.find((m) => m.role === 'Organizer' || m.role === 'Tour Leader') || trip.members[0];

  const [selectedDayId, setSelectedDayId] = useState<string>(trip.days[0]?.id || 'day-1');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modals state
  const [isAddingActivity, setIsAddingActivity] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [isEditingDay, setIsEditingDay] = useState<boolean>(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Day Edit Form State
  const activeDay = trip.days.find((d) => d.id === selectedDayId) || trip.days[0];
  const [dayTitle, setDayTitle] = useState(activeDay?.title || '');
  const [dayDate, setDayDate] = useState(activeDay?.date || '');
  const [dayWeatherTemp, setDayWeatherTemp] = useState(activeDay?.weather?.temp || '31°C');
  const [dayWeatherCondition, setDayWeatherCondition] = useState(activeDay?.weather?.condition || 'Tropical Warm');
  const [dayWeatherIcon, setDayWeatherIcon] = useState(activeDay?.weather?.icon || 'Sun');
  const [dayLeaderBriefing, setDayLeaderBriefing] = useState(activeDay?.leaderBriefing || '');

  // Activity Form State (shared for add & edit)
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('14:00 - 16:00');
  const [formCategory, setFormCategory] = useState<ActivityItem['category']>('Sightseeing');
  const [formLocation, setFormLocation] = useState('');
  const [formCost, setFormCost] = useState('15');
  const [formLeaderId, setFormLeaderId] = useState(activeTraveler.id);
  const [formBookingRef, setFormBookingRef] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsConfirmed, setFormIsConfirmed] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openAddActivityModal = () => {
    setFormTitle('');
    setFormTime('14:00 - 16:00');
    setFormCategory('Sightseeing');
    setFormLocation('Central Singapore');
    setFormCost('15');
    setFormLeaderId(tourLeaderMember?.id || activeTraveler.id);
    setFormBookingRef('');
    setFormNotes('');
    setFormIsConfirmed(true);
    setIsAddingActivity(true);
  };

  const openEditActivityModal = (act: ActivityItem) => {
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormTime(act.time);
    setFormCategory(act.category);
    setFormLocation(act.location);
    setFormCost(act.costPerPerson.toString());
    setFormLeaderId(act.assignedLeaderId);
    setFormBookingRef(act.bookingRef || '');
    setFormNotes(act.notes || '');
    setFormIsConfirmed(act.isConfirmed);
  };

  const openEditDayModal = () => {
    if (!activeDay) return;
    setDayTitle(activeDay.title);
    setDayDate(activeDay.date);
    setDayWeatherTemp(activeDay.weather?.temp || '31°C');
    setDayWeatherCondition(activeDay.weather?.condition || 'Tropical Warm');
    setDayWeatherIcon(activeDay.weather?.icon || 'Sun');
    setDayLeaderBriefing(activeDay.leaderBriefing || '');
    setIsEditingDay(true);
  };

  // 1. Tour Leader: Add Activity
  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      dayId: selectedDayId,
      time: formTime.trim() || '14:00 - 15:30',
      title: formTitle.trim(),
      category: formCategory,
      location: formLocation.trim() || 'Singapore Meeting Point',
      costPerPerson: parseFloat(formCost) || 0,
      assignedLeaderId: formLeaderId,
      bookingRef: formBookingRef.trim() || undefined,
      notes: formNotes.trim() || undefined,
      isConfirmed: formIsConfirmed,
    };

    const updatedDays = trip.days.map((day) => {
      if (day.id === selectedDayId) {
        return {
          ...day,
          activities: [...day.activities, newActivity],
        };
      }
      return day;
    });

    onUpdateTrip({
      ...trip,
      days: updatedDays,
    });

    setIsAddingActivity(false);
    showToast(`Added "${newActivity.title}" to Day ${activeDay.dayNumber}`);
  };

  // 2. Tour Leader: Edit Activity
  const handleEditActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !formTitle.trim()) return;

    const updatedActivity: ActivityItem = {
      ...editingActivity,
      title: formTitle.trim(),
      time: formTime.trim(),
      category: formCategory,
      location: formLocation.trim(),
      costPerPerson: parseFloat(formCost) || 0,
      assignedLeaderId: formLeaderId,
      bookingRef: formBookingRef.trim() || undefined,
      notes: formNotes.trim() || undefined,
      isConfirmed: formIsConfirmed,
    };

    const updatedDays = trip.days.map((day) => {
      if (day.id === selectedDayId) {
        return {
          ...day,
          activities: day.activities.map((a) => (a.id === editingActivity.id ? updatedActivity : a)),
        };
      }
      return day;
    });

    onUpdateTrip({
      ...trip,
      days: updatedDays,
    });

    setEditingActivity(null);
    showToast(`Updated "${updatedActivity.title}"`);
  };

  // 3. Tour Leader: Delete Activity
  const handleDeleteActivity = (actId: string) => {
    const actToDelete = activeDay.activities.find((a) => a.id === actId);
    const updatedDays = trip.days.map((day) => {
      if (day.id === selectedDayId) {
        return {
          ...day,
          activities: day.activities.filter((a) => a.id !== actId),
        };
      }
      return day;
    });

    onUpdateTrip({
      ...trip,
      days: updatedDays,
    });

    setDeletingActivityId(null);
    showToast(`Removed "${actToDelete?.title || 'activity'}" from itinerary`);
  };

  // 4. Tour Leader: Toggle Activity Confirmation
  const handleToggleConfirmed = (actId: string) => {
    const updatedDays = trip.days.map((day) => {
      if (day.id === selectedDayId) {
        return {
          ...day,
          activities: day.activities.map((a) => (a.id === actId ? { ...a, isConfirmed: !a.isConfirmed } : a)),
        };
      }
      return day;
    });

    onUpdateTrip({
      ...trip,
      days: updatedDays,
    });
  };

  // 5. Tour Leader: Move Activity Up / Down
  const handleMoveActivity = (actId: string, direction: 'up' | 'down') => {
    const actIndex = activeDay.activities.findIndex((a) => a.id === actId);
    if (actIndex === -1) return;
    if (direction === 'up' && actIndex === 0) return;
    if (direction === 'down' && actIndex === activeDay.activities.length - 1) return;

    const targetIndex = direction === 'up' ? actIndex - 1 : actIndex + 1;
    const newActivities = [...activeDay.activities];
    const [movedAct] = newActivities.splice(actIndex, 1);
    newActivities.splice(targetIndex, 0, movedAct);

    const updatedDays = trip.days.map((day) => {
      if (day.id === selectedDayId) {
        return {
          ...day,
          activities: newActivities,
        };
      }
      return day;
    });

    onUpdateTrip({
      ...trip,
      days: updatedDays,
    });
    showToast(`Moved "${movedAct.title}" ${direction}`);
  };

  // 6. Tour Leader: Save Daily Plan (Title, Date, Weather, Leader Briefing)
  const handleSaveDayPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayTitle.trim()) return;

    const updatedDays = trip.days.map((day) => {
      if (day.id === selectedDayId) {
        return {
          ...day,
          title: dayTitle.trim(),
          date: dayDate.trim() || day.date,
          weather: {
            temp: dayWeatherTemp.trim() || '30°C',
            condition: dayWeatherCondition.trim() || 'Warm & Breezy',
            icon: dayWeatherIcon,
          },
          leaderBriefing: dayLeaderBriefing.trim() || undefined,
        };
      }
      return day;
    });

    onUpdateTrip({
      ...trip,
      days: updatedDays,
    });

    setIsEditingDay(false);
    showToast(`Saved changes for Day ${activeDay.dayNumber}`);
  };

  // 7. Tour Leader: Add New Day
  const handleAddNewDay = () => {
    const nextDayNum = trip.days.length + 1;
    const newDayId = `day-${Date.now()}`;
    const newDay: DayPlan = {
      id: newDayId,
      dayNumber: nextDayNum,
      date: `Day ${nextDayNum} Schedule`,
      title: `Singapore Day ${nextDayNum} Exploration & Group Trail`,
      weather: {
        temp: '31°C',
        condition: 'Tropical Sunshine & Evening Breeze',
        icon: 'Sun',
      },
      leaderBriefing: 'Tour leader briefing: Meet after breakfast for group exploration.',
      activities: [],
    };

    onUpdateTrip({
      ...trip,
      days: [...trip.days, newDay],
    });

    setSelectedDayId(newDayId);
    showToast(`Created Day ${nextDayNum}`);
  };

  // 8. Tour Leader: Delete Active Day (guard: at least 1 day remains)
  const handleDeleteActiveDay = () => {
    if (trip.days.length <= 1) {
      alert('Cannot delete the only day of the itinerary.');
      return;
    }

    const remainingDays = trip.days
      .filter((d) => d.id !== selectedDayId)
      .map((d, idx) => ({
        ...d,
        dayNumber: idx + 1,
      }));

    onUpdateTrip({
      ...trip,
      days: remainingDays,
    });

    setSelectedDayId(remainingDays[0].id);
    setIsEditingDay(false);
    showToast(`Day removed and daily schedule renumbered`);
  };

  const filteredActivities = activeDay.activities.filter((act) => {
    if (filterCategory === 'all') return true;
    return act.category.toLowerCase() === filterCategory.toLowerCase();
  });

  const dayTotalCost = activeDay.activities.reduce((acc, curr) => acc + curr.costPerPerson, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tour Leader Permissions Control Strip */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isTourLeader 
          ? 'bg-amber-50/70 border-amber-200 text-slate-800' 
          : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isTourLeader ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'
            }`}>
              {isTourLeader ? <Crown className="w-5 h-5 text-slate-950" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isTourLeader ? 'Tour Leader Itinerary Editor' : 'Daily Itinerary Schedule'}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isTourLeader ? 'bg-amber-400/30 text-amber-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isTourLeader ? 'Tour Leader Mode' : 'Read-Only Traveler'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isTourLeader ? (
                  <span>Signed in as Tour Leader <strong>{activeTraveler.name}</strong>. You have permissions to add, edit, reorder activities, adjust timings, and broadcast daily briefings.</span>
                ) : (
                  <span>Only the Tour Leader (<strong>{tourLeaderMember?.name}</strong>) can modify daily activities and briefings. You are viewing as <strong>{activeTraveler.name}</strong> ({activeTraveler.role}).</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isTourLeader && tourLeaderMember && onSelectTraveler && (
              <button
                onClick={() => onSelectTraveler(tourLeaderMember)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
                title={`Switch persona to ${tourLeaderMember.name} to edit the itinerary`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Switch to Tour Leader ({tourLeaderMember.name.split(' ')[0]})</span>
              </button>
            )}

            {isTourLeader && (
              <div className="flex items-center gap-2">
                <button
                  onClick={openEditDayModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
                  title="Edit day title, date, weather, and leader briefing note"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit Day {activeDay.dayNumber}</span>
                </button>
                <button
                  onClick={openAddActivityModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Activity</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip Header Banner with photography */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white border border-slate-200/20 shadow-sm">
        <div className="absolute inset-0">
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        </div>

        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
              <span>{trip.destination}</span>
              <span aria-hidden="true">·</span>
              <span>{trip.days.length} Days Itinerary</span>
              <span aria-hidden="true">·</span>
              <span>{trip.members.length} Explorers</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-balance">
              {trip.title}
            </h1>
            <p className="text-sm text-slate-300">
              Synchronized schedule led by <span className="text-white font-semibold">{tourLeaderMember?.name}</span> ({tourLeaderMember?.role}).
            </p>
          </div>

          {/* Quick Meetup Beacon Strip */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 w-full md:w-auto shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <Navigation className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Today's Rendezvous: {trip.meetupPoint.time}</span>
                </div>
                <div className="text-xs text-slate-300 max-w-xs truncate">{trip.meetupPoint.name}</div>
              </div>
            </div>
            <button
              onClick={onNavigateToRendezvous}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap"
            >
              Check-in
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Day Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {trip.days.map((day) => {
            const isSelected = day.id === selectedDayId;
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Day {day.dayNumber}</span>
                <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  ({day.date.split(',')[0]})
                </span>
              </button>
            );
          })}

          {/* Tour Leader "+ Add Day" Tab */}
          {isTourLeader && (
            <button
              onClick={handleAddNewDay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 transition-colors whitespace-nowrap shrink-0"
              title="Add a new day to the trip itinerary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Day {trip.days.length + 1}</span>
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs">
          {['all', 'dining', 'sightseeing', 'adventure', 'relaxation', 'transit', 'accommodation'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Day Meta Summary & Leader Briefing */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              {activeDay.weather?.icon === 'Sun' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : activeDay.weather?.icon === 'CloudRain' ? (
                <CloudRain className="w-5 h-5 text-sky-500" />
              ) : (
                <CloudSun className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Day {activeDay.dayNumber}: {activeDay.title}
                </span>
                {isTourLeader && (
                  <button
                    onClick={openEditDayModal}
                    className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                    title="Edit Day Details & Leader Briefing"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500 block">
                {activeDay.date} · Forecast: <strong>{activeDay.weather?.temp}</strong> ({activeDay.weather?.condition})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Day Activity Budget</span>
              <span className="text-sm font-bold font-tabular text-slate-900">
                {formatCurrency(dayTotalCost, trip.currency)} <span className="text-xs font-normal text-slate-500">/ person</span>
              </span>
            </div>

            {isTourLeader && (
              <button
                onClick={openAddActivityModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Activity</span>
              </button>
            )}
          </div>
        </div>

        {/* Tour Leader Daily Briefing Notice (if available) */}
        {activeDay.leaderBriefing ? (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs flex items-start justify-between gap-3 text-slate-800">
            <div className="flex items-start gap-2.5">
              <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block mb-0.5">Tour Leader Daily Briefing</span>
                <p className="text-slate-700 leading-relaxed">{activeDay.leaderBriefing}</p>
              </div>
            </div>
            {isTourLeader && (
              <button
                onClick={openEditDayModal}
                className="text-xs font-semibold text-amber-900 hover:underline shrink-0"
              >
                Edit
              </button>
            )}
          </div>
        ) : isTourLeader ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between gap-2 text-slate-500">
            <span className="flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-slate-400" />
              <span>No briefing set for Day {activeDay.dayNumber}. Broadcast instructions to travelers.</span>
            </span>
            <button
              onClick={openEditDayModal}
              className="text-xs font-semibold text-slate-900 hover:underline"
            >
              + Post Briefing
            </button>
          </div>
        ) : null}
      </div>

      {/* Activities Timeline */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No activities scheduled for this day yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              {isTourLeader 
                ? 'As Tour Leader, you can build today’s agenda by adding stops, dining spots, or transit reservations.'
                : 'The Tour Leader has not scheduled any activities under this filter yet.'}
            </p>
            {isTourLeader && (
              <button
                onClick={openAddActivityModal}
                className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg shadow-xs hover:bg-slate-800"
              >
                Add First Activity for Day {activeDay.dayNumber}
              </button>
            )}
          </div>
        ) : (
          filteredActivities.map((act, idx) => {
            const leader = trip.members.find((m) => m.id === act.assignedLeaderId);
            const isFirst = idx === 0;
            const isLast = idx === filteredActivities.length - 1;

            return (
              <div
                key={act.id}
                className={`bg-white rounded-xl border p-4.5 transition-all shadow-xs ${
                  act.isConfirmed ? 'border-slate-200 hover:border-slate-300' : 'border-amber-200 bg-amber-50/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Timing & Category Bar */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-900 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-tabular">{act.time}</span>
                      </span>

                      <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {act.category}
                      </span>

                      {act.isConfirmed ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Draft / Unconfirmed
                        </span>
                      )}

                      {act.bookingRef && (
                        <span className="text-slate-600 font-tabular text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          Ref: {act.bookingRef}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{act.title}</h3>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{act.location}</span>
                    </div>

                    {/* Notes & Tour Leader tips */}
                    {act.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {act.notes}
                      </p>
                    )}
                  </div>

                  {/* Leader info, price & Tour Leader actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-sm font-bold font-tabular text-slate-900">
                        {act.costPerPerson === 0 ? 'Free' : `${formatCurrency(act.costPerPerson, trip.currency)}`}
                      </div>
                      <span className="text-[10px] text-slate-400 block">per person</span>
                    </div>

                    {leader && (
                      <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg" title={`Lead for this activity: ${leader.name} (${leader.role})`}>
                        <img
                          src={leader.avatar}
                          alt={leader.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[11px] text-slate-700 font-medium">Lead: {leader.name.split(' ')[0]}</span>
                      </div>
                    )}

                    {/* Tour Leader Controls (Edit, Move Up, Move Down, Delete, Confirm) */}
                    <div className="flex items-center gap-1 pt-1">
                      {isTourLeader && (
                        <>
                          {/* Reorder Buttons */}
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                            <button
                              onClick={() => handleMoveActivity(act.id, 'up')}
                              disabled={isFirst}
                              className={`p-1 transition-colors ${
                                isFirst ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                              title="Move earlier in schedule"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveActivity(act.id, 'down')}
                              disabled={isLast}
                              className={`p-1 border-l border-slate-200 transition-colors ${
                                isLast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                              title="Move later in schedule"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Edit Activity Button */}
                          <button
                            onClick={() => openEditActivityModal(act)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit activity details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Confirmation toggle */}
                      <button
                        onClick={() => handleToggleConfirmed(act.id)}
                        disabled={!isTourLeader}
                        className={`p-1.5 rounded-lg transition-colors ${
                          act.isConfirmed
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        } ${!isTourLeader ? 'cursor-default' : ''}`}
                        title={isTourLeader ? (act.isConfirmed ? 'Mark unconfirmed' : 'Confirm activity') : (act.isConfirmed ? 'Confirmed' : 'Draft')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      {/* Delete Activity Button (Tour Leader) */}
                      {isTourLeader && (
                        <button
                          onClick={() => setDeletingActivityId(act.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove activity from schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EDIT DAY PLAN MODAL (TOUR LEADER) */}
      {isEditingDay && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Day {activeDay.dayNumber} Plan</h3>
                  <p className="text-xs text-slate-500">Update daily schedule metadata & leader briefing</p>
                </div>
              </div>
              <button onClick={() => setIsEditingDay(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDayPlan} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Day Title / Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={dayTitle}
                  onChange={(e) => setDayTitle(e.target.value)}
                  placeholder="e.g. Tiong Bahru Art Deco & Supertrees Light Show"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Date / Display Subtitle
                </label>
                <input
                  type="text"
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  placeholder="e.g. Monday, Oct 19"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-tabular"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Forecast Temp</label>
                  <input
                    type="text"
                    value={dayWeatherTemp}
                    onChange={(e) => setDayWeatherTemp(e.target.value)}
                    placeholder="31°C"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-tabular"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Weather Condition</label>
                  <input
                    type="text"
                    value={dayWeatherCondition}
                    onChange={(e) => setDayWeatherCondition(e.target.value)}
                    placeholder="Tropical Warm & Passing Shower"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Weather Icon</label>
                <select
                  value={dayWeatherIcon}
                  onChange={(e) => setDayWeatherIcon(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  <option value="Sun">☀️ Sunny / Clear Sky</option>
                  <option value="CloudSun">⛅ Warm & Passing Clouds</option>
                  <option value="CloudRain">🌧️ Afternoon Rain / Showers</option>
                </select>
              </div>

              {/* Tour Leader Daily Briefing Notice */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tour Leader Morning Briefing / Packing Note</span>
                </label>
                <textarea
                  rows={3}
                  value={dayLeaderBriefing}
                  onChange={(e) => setDayLeaderBriefing(e.target.value)}
                  placeholder="e.g. Wear light linen and walking shoes. Afternoon humidity high — remember your water bottle and EZ-Link card."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This note will be prominently pinned at the top of this day's schedule for all crew members.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {trip.days.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleDeleteActiveDay}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Day {activeDay.dayNumber}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDay(false)}
                    className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ACTIVITY MODAL (TOUR LEADER) */}
      {isAddingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Activity to Day {activeDay.dayNumber}</h3>
                  <p className="text-xs text-slate-500">{activeDay.date}</p>
                </div>
              </div>
              <button onClick={() => setIsAddingActivity(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivitySubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Activity Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Marina Bay Sands SkyPark Observation Deck"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="14:00 - 16:30"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-tabular text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Dining">Dining</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Relaxation">Relaxation</option>
                    <option value="Transit">Transit</option>
                    <option value="Accommodation">Accommodation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location / Venue</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. 10 Bayfront Avenue"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cost / Person ({trip.currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-tabular text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Activity Host</label>
                  <select
                    value={formLeaderId}
                    onChange={(e) => setFormLeaderId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                  >
                    {trip.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Booking Ref / Voucher PIN</label>
                  <input
                    type="text"
                    value={formBookingRef}
                    onChange={(e) => setFormBookingRef(e.target.value)}
                    placeholder="e.g. MBS-88219"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Special Notes / Instructions for Group</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Bring umbrella, meet outside exit B near ticket counter."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-add"
                  checked={formIsConfirmed}
                  onChange={(e) => setFormIsConfirmed(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-slate-900"
                />
                <label htmlFor="confirm-add" className="font-medium text-slate-700 cursor-pointer">
                  Mark as officially confirmed on itinerary
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingActivity(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
                >
                  Add to Itinerary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACTIVITY MODAL (TOUR LEADER) */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Activity</h3>
                  <p className="text-xs text-slate-500">Day {activeDay.dayNumber} · {editingActivity.title}</p>
                </div>
              </div>
              <button onClick={() => setEditingActivity(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditActivitySubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Activity Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-tabular text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Dining">Dining</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Relaxation">Relaxation</option>
                    <option value="Transit">Transit</option>
                    <option value="Accommodation">Accommodation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location / Venue</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cost / Person ({trip.currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-tabular text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Activity Host</label>
                  <select
                    value={formLeaderId}
                    onChange={(e) => setFormLeaderId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 bg-white"
                  >
                    {trip.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Booking Ref / Voucher PIN</label>
                  <input
                    type="text"
                    value={formBookingRef}
                    onChange={(e) => setFormBookingRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 font-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Special Notes / Instructions for Group</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-edit"
                  checked={formIsConfirmed}
                  onChange={(e) => setFormIsConfirmed(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-slate-900"
                />
                <label htmlFor="confirm-edit" className="font-medium text-slate-700 cursor-pointer">
                  Confirmed reservation / scheduled stop
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteActivity(editingActivity.id);
                    setEditingActivity(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Activity</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingActivity(null)}
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACTIVITY CONFIRMATION MODAL */}
      {deletingActivityId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Activity?</h3>
                <p className="text-xs text-slate-500">Day {activeDay.dayNumber} itinerary item</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to delete this activity? Group members will no longer see it on their daily schedule.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingActivityId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteActivity(deletingActivityId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Delete Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
