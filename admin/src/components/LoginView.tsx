import { useState } from 'react';
import { Shield, Globe, Mail, Lock, User as UserIcon } from 'lucide-react';
import { API_BASE } from '../services/api.service';

interface LoginViewProps {
  onLoginWithCredentials: (email: string, password: string) => Promise<void>;
  onRegisterWithCredentials: (email: string, name: string, password: string) => Promise<void>;
}

export function LoginView({ onLoginWithCredentials, onRegisterWithCredentials }: LoginViewProps) {
  const [authType, setAuthType] = useState<'oauth' | 'local'>('oauth');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      if (isRegister) {
        if (!name.trim()) {
          setFormError('Name is required for registration.');
          return;
        }
        await onRegisterWithCredentials(email.trim(), name.trim(), password);
      } else {
        await onLoginWithCredentials(email.trim(), password);
      }
    } catch (err) {
      // Errors handled globally by useAuth
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 animate-fade-in">
      <div className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden border-indigo-500/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
        
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Access Request Portal</h2>
          <p className="text-sm text-slate-400 mt-2">
            WeatherGuard is an invite-only service. Log in to check status or request access.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-6 relative z-10">
          <button
            onClick={() => {
              setAuthType('oauth');
              setFormError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authType === 'oauth'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Social Login
          </button>
          <button
            onClick={() => {
              setAuthType('local');
              setFormError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              authType === 'local'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Email / Password
          </button>
        </div>

        {/* Dynamic Views */}
        <div className="relative z-10">
          {authType === 'oauth' ? (
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = `${API_BASE}/auth/google`}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 font-semibold hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm"
              >
                <Globe className="w-5 h-5 text-blue-400" />
                <span>Log in with Google</span>
              </button>

              <button
                onClick={() => window.location.href = `${API_BASE}/auth/github`}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 font-semibold hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                <span>Log in with GitHub</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg">
                  {formError}
                </div>
              )}

              {isRegister && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alice Cooper"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all cursor-pointer mt-2"
              >
                {isRegister ? 'Request Access' : 'Sign In'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setFormError(null);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {isRegister ? 'Already have an account? Sign In' : 'Need access? Create an account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
