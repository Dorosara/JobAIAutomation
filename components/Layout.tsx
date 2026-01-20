import React from 'react';
import { User, UserRole } from '../types';
import { 
  Briefcase, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  User as UserIcon, 
  Users, 
  Building2,
  PieChart
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, onNavigate, onLogout }) => {
  
  const getNavItems = () => {
    switch (user.role) {
      case UserRole.JOB_SEEKER:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'resume', label: 'AI Resume Builder', icon: FileText },
          { id: 'jobs', label: 'Job Matching', icon: Briefcase },
          { id: 'tracking', label: 'My Applications', icon: PieChart },
        ];
      case UserRole.COLLEGE_ADMIN:
        return [
          { id: 'dashboard', label: 'College Overview', icon: Building2 },
          { id: 'students', label: 'Student Directory', icon: Users },
          { id: 'analytics', label: 'Placement Analytics', icon: PieChart },
        ];
      case UserRole.RECRUITER:
        return [
          { id: 'dashboard', label: 'Recruiter Hub', icon: Briefcase },
          { id: 'candidates', label: 'Talent Pool', icon: Users },
          { id: 'analytics', label: 'Hiring Pipeline', icon: PieChart },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              A
            </div>
            AutoApply AI
          </div>
          <div className="mt-2 text-xs text-slate-400 uppercase tracking-wider">
            {user.role.replace('_', ' ')}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="md:hidden font-bold text-slate-800">AutoApply AI</div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
