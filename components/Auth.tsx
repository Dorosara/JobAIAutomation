import React, { useState } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (role: UserRole, name: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.JOB_SEEKER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
           // Success - Profile creation is handled by SQL Triggers in Supabase
           // or we can manually insert if triggers aren't set up, but let's rely on metadata for now
           onLogin(role, fullName); 
        }
      } else {
        // Sign In Logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user) {
          // Retrieve role from metadata
          const userRole = data.user.user_metadata.role as UserRole || UserRole.JOB_SEEKER;
          const userName = data.user.user_metadata.full_name || email.split('@')[0];
          onLogin(userRole, userName);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        <div className="p-8 pb-0">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                    <ShieldCheck className="text-white" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-slate-500">
                  {isSignUp ? 'Join AutoApply AI Platform' : 'Sign in to your dashboard'}
                </p>
            </div>

            {isSignUp && (
              <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                  {[
                      { r: UserRole.JOB_SEEKER, label: 'Student' },
                      { r: UserRole.COLLEGE_ADMIN, label: 'College' },
                      { r: UserRole.RECRUITER, label: 'Recruiter' }
                  ].map((tab) => (
                      <button
                          key={tab.r}
                          onClick={() => setRole(tab.r)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                              role === tab.r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Processing...' : (
                <>
                    {isSignUp ? 'Create Account' : 'Access Dashboard'} <ArrowRight size={18} />
                </>
            )}
          </button>
        </form>
        
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-500 border-t border-slate-100">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"} 
            <span 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 font-bold cursor-pointer hover:underline ml-1"
            >
              {isSignUp ? 'Sign In' : 'Register Now'}
            </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
