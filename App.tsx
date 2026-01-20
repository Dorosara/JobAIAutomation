import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './components/Auth';
import ResumeBuilder from './components/ResumeBuilder';
import JobBoard from './components/JobBoard';
import ApplicationTracker from './components/ApplicationTracker';
import CollegeDashboard from './components/CollegeDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import { User, UserRole, Application, Job, ResumeData } from './types';
import { INITIAL_RESUME_STATE } from './constants';
import { CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applications, setApplications] = useState<Application[]>([]);
  const [userResume, setUserResume] = useState<ResumeData>(INITIAL_RESUME_STATE);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Database health check state
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'missing_tables'>('checking');

  // Check for existing session and DB connection
  useEffect(() => {
    const checkSystem = async () => {
      try {
        // 1. Check Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const role = (session.user.user_metadata.role as UserRole) || UserRole.JOB_SEEKER;
          const name = session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User';
          
          setUser({
            id: session.user.id,
            name: name,
            email: session.user.email || '',
            role: role,
            subscriptionPlan: 'PRO'
          });
          setActiveTab(role === UserRole.COLLEGE_ADMIN || role === UserRole.RECRUITER ? 'dashboard' : 'jobs');
        }

        // 2. Check Database Tables
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error && error.code === '42P01') {
          setDbStatus('missing_tables');
        } else {
          setDbStatus('connected');
        }

      } catch (err) {
        console.error("System Check Error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSystem();
  }, []);

  // Fetch Data when user is logged in
  useEffect(() => {
    if (user && user.role === UserRole.JOB_SEEKER) {
        const loadUserData = async () => {
            // Load Resume
            const { data: resumeData } = await supabase.from('resumes').select('content_json').eq('user_id', user.id).single();
            if (resumeData) setUserResume(resumeData.content_json);

            // Load Applications
            const { data: appData } = await supabase
                .from('applications')
                .select(`*, jobs:job_id (title, company)`)
                .eq('user_id', user.id);
            
            if (appData) {
                const mappedApps: Application[] = appData.map((item: any) => ({
                    id: item.id,
                    jobId: item.job_id,
                    jobTitle: item.jobs?.title || 'Unknown',
                    company: item.jobs?.company || 'Unknown',
                    status: item.status,
                    appliedDate: item.applied_date,
                    coverLetter: item.cover_letter
                }));
                setApplications(mappedApps);
            }
        };
        loadUserData();
    }
  }, [user]);

  const handleLogin = (role: UserRole, name: string) => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          id: user.id,
          name: name,
          email: user.email || '',
          role: role,
          subscriptionPlan: 'PRO'
        });
        setActiveTab(role === UserRole.COLLEGE_ADMIN || role === UserRole.RECRUITER ? 'dashboard' : 'jobs');
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setApplications([]);
  };

  const handleApply = (job: Job, coverLetter: string) => {
    // Optimistic update for UI
    const newApp: Application = {
      id: Date.now().toString(),
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      status: 'APPLIED',
      appliedDate: new Date().toISOString(),
      coverLetter: coverLetter
    };
    setApplications(prev => [newApp, ...prev]);
    triggerToast(`Applied to ${job.company} successfully!`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Toast Component
  const Toast = () => (
    <div className={`fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform z-50 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      <div className="bg-green-500 rounded-full p-1">
        <CheckCircle size={16} className="text-white" />
      </div>
      <p className="font-medium">{toastMessage}</p>
    </div>
  );

  // Database Alert Component
  const DatabaseAlert = () => {
    if (dbStatus !== 'missing_tables') return null;
    return (
      <div className="bg-red-600 text-white px-4 py-3 text-sm font-medium flex items-center justify-center gap-3 shadow-lg z-[100] relative">
        <Database size={18} />
        <span>
          <strong>Database Setup Required:</strong> The tables do not exist in Supabase yet. 
          Please copy the content of <code>supabase_schema.sql</code> and run it in your Supabase SQL Editor.
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <DatabaseAlert />
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Layout 
          user={user} 
          activeTab={activeTab} 
          onNavigate={setActiveTab} 
          onLogout={handleLogout}
        >
          {(() => {
            // College Admin View
            if (user.role === UserRole.COLLEGE_ADMIN) {
                if (activeTab === 'dashboard' || activeTab === 'analytics') return <CollegeDashboard />;
                return <div className="p-10 text-center text-slate-500">Feature coming soon...</div>;
            }

            // Recruiter View
            if (user.role === UserRole.RECRUITER) {
                if (activeTab === 'dashboard' || activeTab === 'candidates') return <RecruiterDashboard />;
                return <div className="p-10 text-center text-slate-500">Feature coming soon...</div>;
            }

            // Job Seeker View
            switch (activeTab) {
              case 'resume':
                return <ResumeBuilder user={user} />;
              case 'jobs':
                return <JobBoard user={user} userResume={userResume} onApply={handleApply} />;
              case 'tracking':
                return <ApplicationTracker applications={applications} />;
              case 'dashboard':
                return <ApplicationTracker applications={applications} />;
              default:
                return <JobBoard user={user} userResume={userResume} onApply={handleApply} />;
            }
          })()}
          <Toast />
        </Layout>
      )}
    </>
  );
};

export default App;