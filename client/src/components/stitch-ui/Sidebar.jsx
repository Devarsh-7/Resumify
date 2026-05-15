import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import HelpModal from './HelpModal';

const Sidebar = ({ activeTab = 'Dashboard' }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { label: 'Dashboard', icon: 'grid_view', path: '/dashboard' },
    { label: 'My Resumes', icon: 'description', path: '/resumes' },
    { label: 'Profile', icon: 'person', path: '/profile' },
  ];

  return (
    <>
      <aside className="w-64 h-screen bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 fixed left-0 top-0 pt-24 transition-colors duration-300">
        <div className="space-y-2 mb-auto">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.label 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-2 transition-colors duration-300">
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-rounded text-[20px]">help</span>
            <span className="text-sm">Help</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800/50 transition-colors">
            <span className="material-symbols-rounded text-[20px]">logout</span>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Global Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

export default Sidebar;
