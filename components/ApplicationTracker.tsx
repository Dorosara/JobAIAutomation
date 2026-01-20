import React from 'react';
import { Application } from '../types';
import { MoreHorizontal, Calendar, Building, FileText } from 'lucide-react';

interface ApplicationTrackerProps {
  applications: Application[];
}

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ applications }) => {
  const columns = [
    { id: 'APPLIED', title: 'Applied', color: 'bg-blue-500' },
    { id: 'VIEWED', title: 'Recruiter Viewed', color: 'bg-indigo-500' },
    { id: 'SHORTLISTED', title: 'Shortlisted', color: 'bg-purple-500' },
    { id: 'INTERVIEW', title: 'Interview', color: 'bg-orange-500' },
    { id: 'REJECTED', title: 'Rejected', color: 'bg-red-500' }
  ];

  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="flex gap-6 h-full min-w-[1200px]">
        {columns.map(col => {
          const colApps = applications.filter(app => app.status === col.id);
          
          return (
            <div key={col.id} className="flex-1 min-w-[280px] flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-slate-700">{col.title}</h3>
                </div>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold">
                  {colApps.length}
                </span>
              </div>

              <div className="bg-slate-100 rounded-xl p-3 flex-1 overflow-y-auto space-y-3">
                {colApps.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                    No applications
                  </div>
                ) : (
                  colApps.map(app => (
                    <div key={app.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-700 font-bold border border-slate-100">
                          {app.company.charAt(0)}
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      
                      <h4 className="font-bold text-slate-800 text-sm">{app.jobTitle}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 mb-3">
                        <Building size={12} /> {app.company}
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(app.appliedDate).toLocaleDateString()}
                        </div>
                        {app.coverLetter && (
                          <div className="flex items-center gap-1 text-blue-600" title="AI Cover Letter Generated">
                            <FileText size={12} /> AI
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationTracker;
