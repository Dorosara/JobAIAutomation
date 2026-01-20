import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Users, Briefcase, CheckCircle, XCircle, Clock, FileText, X, Plus, Mail, Eye, MapPin, DollarSign, List, Filter } from 'lucide-react';

const RecruiterDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs'>('candidates');
  const [applications, setApplications] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  
  // Modals State
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [viewJob, setViewJob] = useState<any | null>(null);
  const [showPostJob, setShowPostJob] = useState(false);
  
  // Post Job Form State
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    salary_range: '',
    description: '',
    skills_required: '' // comma separated for input
  });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Jobs posted by this recruiter
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('created_by', user.id)
        .order('posted_date', { ascending: false });
      
      if (jobsError) throw jobsError;
      if (jobsData) setMyJobs(jobsData);

      // 2. Fetch Applications for these jobs
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          profiles:user_id (full_name, email),
          jobs:job_id (title, company, created_by),
          resumes:user_id (resume_text)
        `)
        .order('applied_date', { ascending: false });

      if (appsError) throw appsError;

      if (apps) {
        // Filter applications for jobs owned by this recruiter
        const myApps = apps.filter((a: any) => a.jobs?.created_by === user.id);

        const formattedApps = myApps.map((item: any) => ({
          id: item.id,
          jobId: item.job_id,
          jobTitle: item.jobs?.title || 'Unknown Job',
          company: item.jobs?.company || 'Unknown Company',
          status: item.status,
          appliedDate: item.applied_date,
          coverLetter: item.cover_letter,
          applicantName: item.profiles?.full_name || 'Anonymous',
          applicantEmail: item.profiles?.email,
          resumeText: item.resumes?.[0]?.resume_text || 'No Resume Found'
        }));
        setApplications(formattedApps);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async (email: string, status: string, jobTitle: string, company: string, candidateName: string) => {
    console.group("📧 Sending Email Notification");
    console.log(`To: ${email}`);
    console.log(`Subject: Application Status Update - ${jobTitle} at ${company}`);
    
    let message = "";
    if (status === 'SHORTLISTED') {
      message = `Dear ${candidateName},\n\nWe are pleased to inform you that your application for the ${jobTitle} position at ${company} has been shortlisted! We will be in touch shortly to schedule an interview.\n\nBest Regards,\nHiring Team`;
    } else if (status === 'REJECTED') {
      message = `Dear ${candidateName},\n\nThank you for the time you took to apply for the ${jobTitle} position at ${company}. After careful review, we have decided to proceed with other candidates who more closely match our current requirements.\n\nWe wish you the best in your job search.\n\nBest Regards,\nHiring Team`;
    }
    
    console.log("Body:", message);
    console.groupEnd();

    await new Promise(resolve => setTimeout(resolve, 800));
    alert(`Email notification sent to ${email}:\n"Your application status has been updated to ${status}."`);
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', appId);
    
    if (!error) {
      setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      ));
      
      const updatedApp = applications.find(app => app.id === appId);
      if (updatedApp && (newStatus === 'SHORTLISTED' || newStatus === 'REJECTED')) {
         sendEmailNotification(
           updatedApp.applicantEmail, 
           newStatus, 
           updatedApp.jobTitle, 
           updatedApp.company,
           updatedApp.applicantName
         );
      }

      if (selectedApp?.id === appId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const skillsArray = newJob.skills_required.split(',').map(s => s.trim()).filter(s => s);

      const { data: insertedJob, error } = await supabase.from('jobs').insert({
        title: newJob.title,
        company: newJob.company,
        location: newJob.location,
        type: newJob.type,
        salary_range: newJob.salary_range,
        description: newJob.description,
        skills_required: skillsArray,
        created_by: user.id,
        is_active: true
      }).select().single();

      if (error) throw error;
      
      alert("Job Posted Successfully! Students can now apply.");
      setShowPostJob(false);
      setNewJob({ title: '', company: '', location: '', type: 'Full-time', salary_range: '', description: '', skills_required: '' });
      if (insertedJob) {
          setMyJobs(prev => [insertedJob, ...prev]);
      }
      
    } catch (err: any) {
      alert("Error posting job: " + err.message);
    } finally {
      setPosting(false);
    }
  };

  const filteredApplications = selectedJobFilter === 'all'
    ? applications
    : applications.filter(app => app.jobId === selectedJobFilter);

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recruitment Portal</h1>
          <p className="text-slate-500">Manage incoming applications and job postings</p>
        </div>
        <button 
          onClick={() => setShowPostJob(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-200">
            <Plus size={18} /> Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={24} /></div>
                <div>
                    <p className="text-sm text-slate-500">Total Applicants</p>
                    <h3 className="text-2xl font-bold">{applications.length}</h3>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Clock size={24} /></div>
                <div>
                    <p className="text-sm text-slate-500">Pending Review</p>
                    <h3 className="text-2xl font-bold">{applications.filter(a => a.status === 'APPLIED').length}</h3>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Briefcase size={24} /></div>
                <div>
                    <p className="text-sm text-slate-500">Active Jobs</p>
                    <h3 className="text-2xl font-bold">{myJobs.length}</h3>
                </div>
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="Tabs">
            <button
                onClick={() => setActiveTab('candidates')}
                className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'candidates'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                <Users size={16} /> Candidates
            </button>
            <button
                onClick={() => setActiveTab('jobs')}
                className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'jobs'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                <List size={16} /> Posted Jobs
            </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
        {activeTab === 'candidates' ? (
             /* Candidates Table */
             <>
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                <Filter size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Filter by Job:</span>
                <select
                    className="text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1.5 bg-white border outline-none min-w-[200px]"
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                >
                    <option value="all">All Jobs</option>
                    {myJobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                </select>
             </div>
             
             {filteredApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Briefcase size={48} className="mb-4 text-slate-300" />
                    <p className="text-lg font-medium">No applications found</p>
                    <p className="text-sm">Try changing filters or wait for new applicants.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Candidate</th>
                                <th className="px-6 py-3">Applied For</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredApplications.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedApp(app)}>
                                        <div className="font-medium text-slate-900 flex items-center gap-2">
                                            {app.applicantName}
                                            <FileText size={14} className="text-blue-500" />
                                        </div>
                                        <div className="text-xs text-slate-500">{app.applicantEmail}</div>
                                    </td>
                                    <td className="px-6 py-4">{app.jobTitle}</td>
                                    <td className="px-6 py-4">{new Date(app.appliedDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                            ${app.status === 'APPLIED' ? 'bg-blue-100 text-blue-700' : 
                                                app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                                                'bg-green-100 text-green-700'}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'SHORTLISTED'); }}
                                                className="p-1 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded" title="Shortlist & Notify">
                                                <CheckCircle size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'REJECTED'); }}
                                                className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded" title="Reject & Notify">
                                                <XCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => setSelectedApp(app)} 
                                                className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium hover:bg-slate-200">
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            </>
        ) : (
            /* Jobs Table */
            myJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Briefcase size={48} className="mb-4 text-slate-300" />
                    <p className="text-lg font-medium">No jobs posted yet</p>
                    <button onClick={() => setShowPostJob(true)} className="text-blue-600 font-medium hover:underline mt-2">Create your first job</button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Job Title</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Posted Date</th>
                                <th className="px-6 py-3">Applicants</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {myJobs.map((job) => {
                                const applicantCount = applications.filter(a => a.jobId === job.id).length;
                                return (
                                    <tr key={job.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{job.title}</td>
                                        <td className="px-6 py-4 flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> {job.location}</td>
                                        <td className="px-6 py-4">{job.type}</td>
                                        <td className="px-6 py-4">{new Date(job.posted_date || job.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                {applicantCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setViewJob(job)}
                                                className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-2">
                                                <Eye size={14} /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )
        )}
      </div>

      {/* Post Job Modal */}
      {showPostJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                <h2 className="text-xl font-bold text-slate-800">Post a New Job</h2>
                <button onClick={() => setShowPostJob(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
             </div>
             <form onSubmit={handlePostJob} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
                    <input required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} placeholder="e.g. React Developer" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company</label>
                    <input required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} placeholder="e.g. TechCorp" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                    <input required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} placeholder="e.g. Remote" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Salary</label>
                    <input required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newJob.salary_range} onChange={e => setNewJob({...newJob, salary_range: e.target.value})} placeholder="e.g. ₹12L - ₹18L" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newJob.type} onChange={e => setNewJob({...newJob, type: e.target.value})}>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Internship</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Skills (Comma separated)</label>
                  <input required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={newJob.skills_required} onChange={e => setNewJob({...newJob, skills_required: e.target.value})} placeholder="React, Node.js, TypeScript" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Description</label>
                  <textarea required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-32" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} placeholder="Describe the role..." />
                </div>
                <button type="submit" disabled={posting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  {posting ? 'Publishing...' : 'Publish Job'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* View Job Details Modal */}
      {viewJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{viewJob.title}</h2>
                        <p className="text-sm text-slate-500">{viewJob.company}</p>
                    </div>
                    <button onClick={() => setViewJob(null)} className="p-2 hover:bg-slate-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                                <MapPin size={12} /> Location
                            </span>
                            <span className="text-sm font-medium text-slate-800">{viewJob.location}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                                <DollarSign size={12} /> Salary
                            </span>
                            <span className="text-sm font-medium text-slate-800">{viewJob.salary_range}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                                <Clock size={12} /> Type
                            </span>
                            <span className="text-sm font-medium text-slate-800">{viewJob.type}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                                <CheckCircle size={12} /> Active
                            </span>
                            <span className="text-sm font-medium text-green-600">Yes</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 mb-2">Description</h3>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {viewJob.description}
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-800 mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {viewJob.skills_required && viewJob.skills_required.map((skill: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
                    <button 
                        onClick={() => setViewJob(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Candidate Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{selectedApp.applicantName}</h2>
                        <p className="text-sm text-slate-500">Applied for {selectedApp.jobTitle} at {selectedApp.company}</p>
                    </div>
                    <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-slate-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Briefcase size={18} /> AI Cover Letter
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-slate-200">
                            {selectedApp.coverLetter}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <FileText size={18} /> Resume (Markdown)
                        </h3>
                        <div className="bg-slate-900 p-4 rounded-lg text-sm text-slate-300 whitespace-pre-wrap font-mono h-[400px] overflow-y-auto">
                            {selectedApp.resumeText}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                    <button 
                        onClick={() => updateStatus(selectedApp.id, 'REJECTED')}
                        className="px-4 py-2 border border-red-200 text-red-700 rounded-lg font-medium hover:bg-red-50 flex items-center gap-2">
                        <Mail size={16} /> Reject & Notify
                    </button>
                    <button 
                        onClick={() => updateStatus(selectedApp.id, 'SHORTLISTED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
                        <Mail size={16} /> Shortlist & Notify
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;