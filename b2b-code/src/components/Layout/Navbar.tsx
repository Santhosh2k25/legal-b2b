import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, User, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useSearch } from '../../contexts/SearchContext';
import LanguageSelector from '../LanguageSelector';
import SearchResults from '../SearchResults';
import { useState, useEffect, useRef } from 'react';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { performSearch, clearSearch, searchQuery } = useSearch();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user) {
      setUserDisplayName(user.displayName || user.email?.split('@')[0] || 'My Profile');
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Reset states when route changes
    setIsProfileOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const handleSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        clearSearch();
      }
    }, 300);
  };

  const handleClearSearch = () => {
    clearSearch();
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
  };

  const handleProfileClick = () => {
    if (!isProfileOpen) {
      setIsProfileOpen(true);
      navigate('/settings');
    } else {
      setIsProfileOpen(false);
      navigate(-1);
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 h-16 flex items-center px-4 lg:px-8 ${className || ''}`}
    >
      <div className="flex-1 flex items-center">
        <div className="flex items-center space-x-2">
          <img 
            src="https://i.postimg.cc/tC44YgWz/logo-new.png" 
            alt="LegalAI ERP Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-primary-300 to-primary-500 bg-clip-text text-transparent">
            OCTOGENIE Legal
          </span>
        </div>
        
        <div className="ml-4 lg:ml-8 flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('search') || 'Search...'}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm lg:text-base"
            />
            <Search className="absolute left-3 top-2.5 h-5 text-gray-500" aria-hidden="true" />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-2.5 p-1 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
              </button>
            )}
            <div className="absolute w-full mt-1 bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
              <SearchResults />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <LanguageSelector />
        <div ref={notificationRef} className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-800 rounded-lg relative"
          >
            <Bell className="w-5 h-5 text-gray-400" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-xl border border-gray-800 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-800">
                <h3 className="text-sm font-medium text-gray-300">{t('common.notifications')}</h3>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  {t('common.noNotifications') || 'No new notifications'}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification: any, index: number) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-gray-800 cursor-pointer"
                    >
                      <p className="text-sm text-gray-300">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-gray-800" />
        <div ref={profileRef}>
          <button 
          onClick={handleProfileClick}
          className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline text-gray-300">{userDisplayName || 'My Profile'}</span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;