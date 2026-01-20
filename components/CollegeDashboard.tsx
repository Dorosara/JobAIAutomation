import React from 'react';
import { Users, FileCheck, Briefcase, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'CS', placed: 85, total: 100 },
  { name: 'IT', placed: 70, total: 90 },
  { name: 'ECE', placed: 60, total: 110 },
  { name: 'MECH', placed: 40, total: 80 },
];

const pieData = [
  { name: 'Placed', value: 255 },
  { name: 'Looking', value: 125 },
];

const COLORS = ['#2563eb', '#94a3b8'];

const CollegeDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: '1,240', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Resumes Optimized', value: '98%', icon: FileCheck, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Active Applications', value: '3,402', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { label: 'Placement Rate', value: '72%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Department Wise Placement</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="placed" fill="#2563eb" radius={[4, 4, 0, 0]} name="Placed Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Overall Status</h3>
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div> Placed (67%)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-400 rounded-full"></div> Job Seeking (33%)
            </div>
          </div>
        </div>
      </div>
      
      {/* Student List Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Recent Student Activity</h3>
            <button className="text-sm text-blue-600 font-medium">View Directory</button>
        </div>
        <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Resume Score</th>
                    <th className="px-6 py-3">Applications</th>
                    <th className="px-6 py-3">Status</th>
                </tr>
            </thead>
            <tbody>
                {[1,2,3,4,5].map(i => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">Student {i}</td>
                        <td className="px-6 py-4">Computer Science</td>
                        <td className="px-6 py-4"><span className="text-green-600 font-bold">{85 + i}%</span></td>
                        <td className="px-6 py-4">{10 + i}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Active</span></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollegeDashboard;
