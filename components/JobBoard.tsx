import React, { useState, useEffect } from 'react';
import { Job, ResumeData, User } from '../types';
import { generateCoverLetterAI } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { MapPin, DollarSign, Briefcase, Zap, CheckCircle, Clock, AlertTriangle, Lock, RefreshCw } from 'lucide-react';

interface JobBoardProps {
  user: User;
  userResume: ResumeData;
  onApply: (job: Job, coverLetter: string) => void;
}

const JobBoard: React.FC<JobBoardProps> = ({ user, userResume, onApply }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    type: 'All'
  });
  
  // Rate Limiting State
  const [dailyLimit, setDailyLimit] = useState<number>(2); // Default to Free tier (2) instead of 0
  const [todayUsage, setTodayUsage] = useState<number>(0);
  const [limitLoading, setLimitLoading] = useState(true);

  // 1. Fetch Limits and Usage
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('daily_apply_limit')
          .eq('user_id', user.id)
          .single();
        
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('applied_date', today);
        
        const { data: existingApps } = await supabase
          .from('applications')
          .select('job_id')
          .eq('user_id', user.id);

        if (subData) {
            setDailyLimit(subData.daily_apply_limit);
        } else {
            // Fallback: If subscription view is empty (trigger lag), default to 2
            setDailyLimit(2);
        }

        if (count !== null) setTodayUsage(count);
        if (existingApps) setAppliedJobs(existingApps.map(app => app.job_id));
        
      } catch (err) {
        console.error("Error fetching limits:", err);
      } finally {
        setLimitLoading(false);
      }
    };

    fetchLimits();
  }, [user.id]);

  // 2. Fetch Real Jobs from DB
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .order('posted_date', { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedJobs: Job[] = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            company: item.company,
            location: item.location,
            type: item.type,
            salaryRange: item.salary_range,
            description: item.description,
            skillsRequired: item.skills_required || [],
            postedDate: item.posted_date,
            matchScore: Math.floor(Math.random() * (95 - 60 + 1) + 60)
          }));
          setJobs(mappedJobs);
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  const handleAutoApply = async (job: Job) => {
    if (todayUsage >= dailyLimit) {
      alert(`Daily limit of ${dailyLimit} applications reached! Upgrade to PRO.`);
      return;
    }

    setApplyingJobId(job.id);
    
    // 1. Generate Cover Letter
    const resumeSummary = `${userResume.summary} Skills: ${userResume.skills}`;
    const coverLetter = await generateCoverLetterAI(resumeSummary, job);
    
    // 2. Submit Application to Supabase
    try {
        const { error } = await supabase.from('applications').insert({
            job_id: job.id, 
            user_id: user.id,
            status: 'APPLIED',
            cover_letter: coverLetter
        });

        if (error) throw error;

        // 3. Update UI
        onApply(job, coverLetter);
        setAppliedJobs(prev => [...prev, job.id]);
        setTodayUsage(prev => prev + 1);
    } catch (err: any) {
        console.error("Application error", err);
        alert("Failed to apply: " + err.message);
    } finally {
        setApplyingJobId(null);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                          job.company.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Stats */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Job Matching Engine</h2>
            <p className="text-slate-500">
                Matches found: <span className="text-blue-600 font-bold">{loadingJobs ? '...' : filteredJobs.length}</span>
            </p>
          </div>
          
          {/* Limit Counter */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
             <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-500 uppercase">Daily Limit</span>
                <span className={`text-sm font-bold ${todayUsage >= dailyLimit ? 'text-red-600' : 'text-slate-800'}`}>
                    {limitLoading ? '...' : `${todayUsage} / ${dailyLimit}`} Used
                </span>
             </div>
             <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                {todayUsage >= dailyLimit ? <Lock size={16} /> : <Zap size={16} />}
             </div>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search jobs..." 
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Usage Warning */}
      {todayUsage >= dailyLimit && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle size={20} />
              <div>
                  <p className="font-bold">Daily application limit reached.</p>
                  <p className="text-sm">Upgrade to PRO to apply to 50 jobs per day.</p>
              </div>
              <button className="ml-auto bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700">
                  Upgrade Plan
              </button>
          </div>
      )}

      {/* Job List */}
      <div className="grid grid-cols-1 gap-4">
        {loadingJobs && (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                <RefreshCw className="animate-spin mb-2" />
                Loading Jobs from Database...
            </div>
        )}

        {!loadingJobs && filteredJobs.length === 0 && (
            <div className="p-10 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                No jobs found. Make sure you have run the Seed SQL in Supabase.
            </div>
        )}

        {filteredJobs.map((job) => {
          const isApplying = applyingJobId === job.id;
          const isApplied = appliedJobs.includes(job.id);
          const limitReached = todayUsage >= dailyLimit;

          return (
            <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
              {/* Score Badge */}
              <div className="flex flex-col items-center justify-center min-w-[80px]">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold border-4 ${
                  (job.matchScore || 0) > 80 ? 'border-green-100 text-green-600 bg-green-50' : 
                  (job.matchScore || 0) > 60 ? 'border-yellow-100 text-yellow-600 bg-yellow-50' : 'border-slate-100 text-slate-500 bg-slate-50'
                }`}>
                  {job.matchScore}%
                </div>
                <span className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-wide">Match Score</span>
              </div>

              {/* Job Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    <p className="text-slate-500 font-medium">{job.company}</p>
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                    {job.type}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} /> {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} /> {job.salaryRange}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} /> Posted {job.postedDate}
                  </div>
                </div>

                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skillsRequired.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-center min-w-[160px] border-l border-slate-100 md:pl-6 gap-3">
                {isApplied ? (
                  <button disabled className="w-full flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2.5 rounded-lg font-medium text-sm cursor-not-allowed">
                    <CheckCircle size={16} /> Applied
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAutoApply(job)}
                    disabled={isApplying || limitReached}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-lg ${
                        limitReached 
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                    } disabled:opacity-70 disabled:shadow-none`}
                  >
                    {isApplying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        AI Working...
                      </>
                    ) : limitReached ? (
                        <>
                            <Lock size={16} /> Limit Reached
                        </>
                    ) : (
                      <>
                        <Zap size={16} /> Auto Apply
                      </>
                    )}
                  </button>
                )}
                <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-lg font-medium text-sm transition-colors">
                  <Briefcase size={16} /> View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JobBoard;