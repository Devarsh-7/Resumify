import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!user;
  const isLandingPage = location.pathname === '/';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  const handleSwitchAccount = () => {
    setDropdownOpen(false);
    logout();
    navigate('/auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">R</div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-white to-blue-600 dark:to-blue-400 transition-colors">
            Resumify AI
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How it Works</a>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            isLandingPage ? (
              /* Landing page: dropdown with Switch Account & Sign Out */
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                  className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">{user.name}</span>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=DBEAFE&color=3B82F6`} 
                       className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 transition-colors" alt="Avatar" />
                  <span className={`material-symbols-rounded text-sm text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {/* Dropdown Menu — Landing Page Only */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1.5">
                      <Link 
                        to="/dashboard" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full text-left"
                      >
                        <span className="material-symbols-rounded text-lg">dashboard</span>
                        Go to Dashboard
                      </Link>
                      <button 
                        onClick={handleSwitchAccount}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full text-left"
                      >
                        <span className="material-symbols-rounded text-lg">switch_account</span>
                        Login with Another Account
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-100 dark:border-slate-700 py-1.5">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                      >
                        <span className="material-symbols-rounded text-lg">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Other pages: simple link to dashboard */
              <Link to="/dashboard" className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">{user.name}</span>
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=DBEAFE&color=3B82F6`} 
                     className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 transition-colors" alt="Avatar" />
              </Link>
            )
          ) : (
            <>
              <Link to="/auth" className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600">Login</Link>
              <Link to="/auth" className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-950/60 hover:bg-blue-700 transition-all active:scale-95">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
