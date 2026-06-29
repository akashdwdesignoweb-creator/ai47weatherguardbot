import { useState } from 'react';
import { CloudSun, MapPin, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { User } from '../types';
import { StatusBadge } from './StatusBadge';

interface UserPortalProps {
  user: User;
  onSaveLocation: (location: string) => Promise<void>;
  onUnlinkTelegram: () => Promise<void>;
  isLoading: boolean;
}

export function UserPortal({ user, onSaveLocation, onUnlinkTelegram, isLoading }: UserPortalProps) {
  const [locationInput, setLocationInput] = useState(user.location || '');
  const [suggestions, setSuggestions] = useState<{ name: string; country: string; admin1?: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSubmitLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    onSaveLocation(locationInput.trim());
    setShowDropdown(false);
  };

  const handleLocationChange = async (val: string) => {
    setLocationInput(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=5&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          setSuggestions(data.results);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      }
    } catch (err) {
      console.error('Error fetching geocoding suggestions', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* Profile/Status Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-extrabold text-white">Your Request Profile</h2>
              <p className="text-xs text-slate-400 mt-1">Status of your invitation request and system links</p>
            </div>
            <div><StatusBadge status={user.status} /></div>
          </div>

          <div className="mt-6 space-y-4 border-t border-slate-800/80 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered Email</p>
                <p className="text-sm font-semibold text-slate-300 mt-1 overflow-hidden text-ellipsis">{user.email}</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</p>
                <p className="text-sm font-semibold text-indigo-400 mt-1 capitalize">{user.role}</p>
              </div>
            </div>

            {user.status === 'pending' && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 text-amber-200 text-xs">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">Access Pending Approval:</span> Your request is awaiting review by a system administrator. In the meantime, you can configure your weather location and link your Telegram account below.
                </div>
              </div>
            )}

            {user.status === 'rejected' && (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 flex gap-3 text-rose-200 text-xs">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold">Access Rejected / Revoked:</span> Your access request has been rejected or revoked by an administrator. Weather alert notifications are disabled.
                </div>
              </div>
            )}

            {user.status === 'approved' && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-3 text-emerald-200 text-xs">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Access Approved!</span> You are a validated member of WeatherGuard. You will receive active alerts once your Telegram account is fully linked below.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Preferences */}
        <div className="glass-panel rounded-3xl p-6 relative z-20">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-indigo-400" /> Weather Alert Location
          </h3>
          <p className="text-xs text-slate-400 mt-1">Configure which city's weather forecast we monitor for you.</p>

          <form onSubmit={handleSubmitLocation} className="mt-4 flex gap-2 relative">
            <div className="relative flex-grow">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => locationInput.trim().length >= 2 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="e.g. New York, Tokyo, London"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 text-sm"
              />
              
              {/* Autocomplete Dropdown suggestions */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-slate-850">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevents losing focus before selection is made
                        const fullname = `${s.name}${s.admin1 ? `, ${s.admin1}` : ''}${s.country ? `, ${s.country}` : ''}`;
                        setLocationInput(fullname);
                        setSuggestions([]);
                        setShowDropdown(false);
                        onSaveLocation(fullname);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer flex flex-col"
                    >
                      <span className="font-bold text-slate-200">{s.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {s.admin1 ? `${s.admin1}, ` : ''}{s.country}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-500/20"
            >
              Save
            </button>
          </form>
        </div>
      </div>

      {/* Telegram Link Box */}
      <div className="lg:col-span-1">
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border-slate-800">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" /> Telegram Integration
          </h3>
          <p className="text-xs text-slate-400 mt-1">Link your Telegram account to receive automated alerts.</p>

          <div className="mt-6 space-y-4">
            {user.telegramChatId ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-xs font-bold">Bot Connected Successfully</p>
                <p className="text-[10px] text-slate-400 mt-1 mb-4">Chat ID: {user.telegramChatId}</p>
                
                <button
                  onClick={onUnlinkTelegram}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/20 text-rose-300 text-xs font-bold transition-all text-center cursor-pointer disabled:opacity-50"
                >
                  Disconnect Bot
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your verification code</p>
                  <p className="text-2xl font-black text-white tracking-widest mt-1 select-all">{user.telegramVerificationCode}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Double-click code to select and copy</p>
                </div>

                <div className="text-xs text-slate-400 space-y-2.5">
                  <p className="font-semibold text-slate-300">Linking Steps:</p>
                  <div className="flex gap-2.5 items-start">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-extrabold text-slate-300 mt-0.5 shrink-0">1</span>
                    <p>Open Telegram and search for your bot or click the link below.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-extrabold text-slate-300 mt-0.5 shrink-0">2</span>
                    <p>Send the message below or type `/link {user.telegramVerificationCode}` to the bot.</p>
                  </div>
                </div>

                <a
                  href={`https://t.me/WeatherGuardService_bot?start=${user.telegramVerificationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all text-center shadow-lg shadow-blue-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  Open Telegram Bot
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
