import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useAdmin } from './hooks/useAdmin';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginView } from './components/LoginView';
import { UserPortal } from './components/UserPortal';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const {
    token,
    user,
    error,
    success,
    isLoading,
    logout,
    saveLocation,
    fetchProfile,
    loginWithCredentials,
    registerWithCredentials,
    unlinkTelegram,
  } = useAuth();

  const {
    users,
    stats,
    adminError,
    fetchAdminData,
    updateStatus,
  } = useAdmin(token);

  // Fetch admin dashboard details immediately and poll to keep in sync
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    fetchAdminData();

    const interval = setInterval(() => {
      fetchAdminData();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, fetchAdminData]);

  // Auto-poll user status if currently pending to detect admin approval
  useEffect(() => {
    if (!user || user.status !== 'pending' || !token) return;

    const interval = setInterval(() => {
      fetchProfile();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, token, fetchProfile]);

  // Combine error displays
  const errorMsg = error || adminError;
  const successMsg = success;

  // Show splash loading screen to prevent login flickering while fetching initial profile
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-indigo-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Header user={user} onLogout={logout} />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Connection Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-200 flex items-start gap-3 shadow-lg shadow-rose-950/20">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">System Issue:</span> {errorMsg}
              <button 
                onClick={() => {
                  fetchProfile();
                  if (user && user.role === 'admin') fetchAdminData();
                }}
                className="ml-3 underline hover:text-white font-semibold flex items-center gap-1 inline-flex cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 flex items-start gap-3 shadow-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm">{successMsg}</p>
          </div>
        )}

        {/* Role-Based Separated UI Coordinator */}
        {!user ? (
          <LoginView 
            onLoginWithCredentials={loginWithCredentials}
            onRegisterWithCredentials={registerWithCredentials}
          />
        ) : user.role === 'admin' ? (
          <AdminDashboard
            stats={stats}
            users={users}
            onUpdateStatus={updateStatus}
            onRefresh={fetchAdminData}
          />
        ) : (
          <UserPortal
            user={user}
            onSaveLocation={saveLocation}
            onUnlinkTelegram={unlinkTelegram}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
