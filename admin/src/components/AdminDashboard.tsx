import { Users, Clock, CheckCircle, Send, RefreshCw, MapPin, Check, X, Terminal, ArrowUpRight } from 'lucide-react';
import type { User, Stats } from '../types';
import { StatusBadge } from './StatusBadge';

interface AdminDashboardProps {
  stats: Stats;
  users: User[];
  onUpdateStatus: (userId: string, status: 'approved' | 'rejected') => Promise<void>;
  onRefresh: () => void;
}

export function AdminDashboard({ stats, users, onUpdateStatus, onRefresh }: AdminDashboardProps) {
  // Generate informative logs dynamically based on the current users
  const getSimulatedLogs = () => {
    const logs: { time: string; msg: string; type: 'info' | 'success' | 'warn' }[] = [];
    
    // Static base logs
    logs.push({ time: '08:00:00 AM', msg: 'System Cron: Triggered weather alert query pipeline.', type: 'info' });
    
    users.forEach((u, i) => {
      const timeOffset = `08:00:${10 + i * 5} AM`;
      if (u.status === 'approved' && u.telegramChatId) {
        logs.push({ 
          time: timeOffset, 
          msg: `Telegram Alert: Forecast for "${u.location}" pushed to chat ID ${u.telegramChatId} (${u.name}).`, 
          type: 'success' 
        });
      } else if (u.status === 'pending') {
        logs.push({ 
          time: timeOffset, 
          msg: `Access Vetting: ${u.name} (${u.email}) is pending credentials confirmation. Code: ${u.telegramVerificationCode}.`, 
          type: 'warn' 
        });
      } else if (u.status === 'approved' && !u.telegramChatId) {
        logs.push({ 
          time: timeOffset, 
          msg: `Telegram Sync: Account ${u.name} is approved but awaits Telegram bot connection.`, 
          type: 'info' 
        });
      }
    });

    if (logs.length === 1) {
      logs.push({ time: '08:00:05 AM', msg: 'Vetting Directory: Awaiting access requests from new signups.', type: 'info' });
    }

    return logs.slice(0, 5); // Show top 5 logs
  };

  const logs = getSimulatedLogs();

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-black text-slate-100 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-indigo-600/15 p-2.5 rounded-lg text-indigo-400"><Users className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
              <p className="text-2xl font-black text-slate-100 mt-1">{stats.pendingUsers}</p>
            </div>
            <div className="bg-amber-600/15 p-2.5 rounded-lg text-amber-400"><Clock className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Active</p>
              <p className="text-2xl font-black text-slate-100 mt-1">{stats.approvedUsers}</p>
            </div>
            <div className="bg-emerald-600/15 p-2.5 rounded-lg text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telegram Linked</p>
              <p className="text-2xl font-black text-slate-100 mt-1">{stats.telegramLinkedUsers}</p>
            </div>
            <div className="bg-blue-600/15 p-2.5 rounded-lg text-blue-400"><Send className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Directory Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-800/85 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-white">Vetting Directory</h2>
                <p className="text-xs text-slate-400">Review and vet user access requests</p>
              </div>
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-semibold">
                    <th className="p-4">User Details</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Telegram Bot</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u._id} className="hover:bg-slate-900/30 transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} 
                              alt="User avatar" 
                              className="w-8 h-8 rounded-full border border-slate-800 bg-slate-900"
                            />
                            <div>
                              <div className="font-bold text-slate-200">{u.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> {u.location}
                          </span>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="p-4 text-xs font-semibold">
                          {u.telegramChatId ? (
                            <span className="text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">Linked ({u.telegramChatId})</span>
                          ) : (
                            <span className="text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">Unlinked (Code: {u.telegramVerificationCode})</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {u.role === 'admin' ? (
                            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full font-bold border border-indigo-500/20">System Admin</span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              {u.status === 'approved' ? (
                                <button
                                  onClick={() => onUpdateStatus(u._id, 'rejected')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Revoke Access
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => onUpdateStatus(u._id, 'approved')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  {u.status !== 'rejected' && (
                                    <button
                                      onClick={() => onUpdateStatus(u._id, 'rejected')}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" /> Reject
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Informative Side Panel (Live Logs & Details) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Logs Feed */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="font-bold text-white text-md flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-indigo-400" /> Active System Logs
            </h3>
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-850 font-mono text-[10px] space-y-3 max-h-[250px] overflow-y-auto">
              {logs.map((l, i) => (
                <div key={i} className="flex gap-2 items-start leading-relaxed">
                  <span className="text-slate-500 shrink-0 select-none">[{l.time}]</span>
                  <span className={
                    l.type === 'success' ? 'text-emerald-400' :
                    l.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                  }>
                    {l.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Guide */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
            <h3 className="font-bold text-white text-md flex items-center gap-2 mb-2">
              Vetting Quick Guide
            </h3>
            <div className="text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                As a system administrator, you regulate access to the weather broadcasting channel. 
              </p>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px]">
                <span className="font-bold text-indigo-400">Security Rule:</span> Weather notifications are restricted solely to users marked as <span className="text-emerald-400 font-semibold">Approved</span> who have connected their Telegram account.
              </div>
              <p className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 cursor-pointer font-semibold text-[11px]">
                Open system configurations <ArrowUpRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
