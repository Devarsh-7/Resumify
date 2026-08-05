import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import HelpModal from './HelpModal';

const Sidebar = ({ activeTab = 'Dashboard', isMobileOpen = false, onCloseMobile = () => {} }) => {
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
    { label: 'AI Humanizer', icon: 'auto_awesome', path: '/humanizer' },
    { label: 'Profile', icon: 'person', path: '/profile' },
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`w-64 h-screen bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 fixed left-0 top-0 pt-24 z-40 transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-2 mb-auto">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={onCloseMobile}
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
            onClick={() => { setIsHelpOpen(true); onCloseMobile(); }}
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
