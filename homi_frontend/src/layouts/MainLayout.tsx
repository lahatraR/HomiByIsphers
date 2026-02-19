import React, { useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { UserRoles } from '../types';
import { LanguageSwitcher } from '../components/common';

// Badge environnement — visible seulement en dev
const ENV_LABEL = import.meta.env.VITE_ENV_LABEL as string | undefined;
const showEnvBadge = !import.meta.env.PROD && ENV_LABEL;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isAdmin = useMemo(() => user?.role === UserRoles.ADMIN, [user]);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '?';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user.email?.substring(0, 2) || '??').toUpperCase();
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkClass = (path: string) =>
    `font-medium transition-colors ${isActive(path) ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`;

  const mobileNavLinkClass = (path: string) =>
    `block px-3 py-2 rounded-md font-medium transition-colors ${isActive(path) ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-3">
              <svg 
                className="w-10 h-10" 
                viewBox="0 0 200 200" 
                fill="none"
              >
                <defs>
                  <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path 
                  d="M100 30L40 80V170H80V130H120V170H160V80L100 30Z" 
                  fill="url(#logo-grad)" 
                />
                <circle cx="140" cy="60" r="28" fill="#16a34a" />
                <path 
                  d="M128 60L136 68L154 52" 
                  stroke="white" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeLinejoin="round" 
                />
              </svg>
              <span className="text-xl font-bold text-gray-900">Homi</span>
              {showEnvBadge && (
                <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                  ENV_LABEL === 'LOCAL' 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-orange-100 text-orange-700 border border-orange-300'
                }`}>
                  {ENV_LABEL}
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                {t('nav.dashboard')}
              </Link>
              <Link to="/tasks" className={navLinkClass('/tasks')}>
                {t('nav.myTasks')}
              </Link>
              <Link to="/performance" className={navLinkClass('/performance')}>
                📊 Performance
              </Link>

              {/* User (Exécutant) nav */}
              {!isAdmin && (
                <>
                  <Link to="/my-time-logs" className={navLinkClass('/my-time-logs')}>
                    {t('nav.myHours')}
                  </Link>
                  <Link to="/my-invoices" className={navLinkClass('/my-invoices')}>
                    {t('nav.myInvoices')}
                  </Link>
                </>
              )}

              {/* Admin (Propriétaire) nav */}
              {isAdmin && (
                <>
                  <Link to="/domiciles" className={navLinkClass('/domiciles')}>
                    {t('nav.domiciles')}
                  </Link>
                  <Link to="/admin/time-logs" className={navLinkClass('/admin/time-logs')}>
                    {t('nav.timeLogs')}
                  </Link>
                  <Link to="/admin/invoices" className={navLinkClass('/admin/invoices')}>
                    {t('nav.invoices')}
                  </Link>
                  <Link to="/admin/stats" className={navLinkClass('/admin/stats')}>
                    {t('nav.adminStats')}
                  </Link>
                  <Link to="/recurring-tasks" className={navLinkClass('/recurring-tasks')}>
                    🔄 Récurrences
                  </Link>
                  <Link to="/budgets" className={navLinkClass('/budgets')}>
                    💰 Budget
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Right Section */}
            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {mobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>

              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {/* Search icon */}
              <Link
                to="/search"
                className="hidden md:block p-2 text-gray-600 hover:text-primary-600 transition-colors"
                aria-label={t('nav.search')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Link>

              {/* Notifications bell → links to /notifications */}
              <Link 
                to="/notifications"
                className="hidden md:block p-2 text-gray-600 hover:text-primary-600 transition-colors relative"
                aria-label={t('nav.notifications')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Link>

              {/* User Avatar + Dropdown */}
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-success-500 flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials()}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
                      </div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                          isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isAdmin ? 'Propriétaire' : 'Exécutant'}
                        </span>
                      </div>
                    </div>

                    {/* Mon compte section */}
                    <div className="py-1">
                      <div className="px-4 py-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                        {t('nav.myAccount')}
                      </div>
                      <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        {t('nav.profile')}
                      </Link>
                      <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        {t('nav.settings')}
                      </Link>
                      <Link to="/twofa" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {t('nav.twofa')}
                      </Link>
                      <Link to="/activity" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        {t('nav.activity')}
                      </Link>
                      <Link to="/favorites" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {t('nav.favorites')}
                      </Link>
                      <Link to="/badges" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                          <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                        </svg>
                        {t('nav.badges')}
                      </Link>
                      <Link to="/export" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {t('nav.exportData')}
                      </Link>
                      <Link to="/support" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {t('nav.support')}
                      </Link>
                    </div>

                    {/* Admin section */}
                    {isAdmin && (
                      <div className="py-1 border-t border-gray-100">
                        <div className="px-4 py-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                          {t('nav.administration')}
                        </div>
                        <Link to="/admin/users" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {t('nav.adminUsers')}
                        </Link>
                        <Link to="/admin/logs" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                          </svg>
                          {t('nav.adminLogs')}
                        </Link>
                        <Link to="/admin/content" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3 text-gray-400">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
                          </svg>
                          {t('nav.adminContent')}
                        </Link>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-1">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile User Avatar */}
              <div className="md:hidden w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-success-500 flex items-center justify-center text-white font-semibold">
                {getInitials()}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {/* User info */}
              <div className="pb-3 mb-3 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
                <span className={`mt-1 inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                  isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isAdmin ? 'Propriétaire' : 'Exécutant'}
                </span>
              </div>

              {/* Main nav */}
              <Link to="/dashboard" className={mobileNavLinkClass('/dashboard')}>
                {t('nav.dashboard')}
              </Link>
              <Link to="/tasks" className={mobileNavLinkClass('/tasks')}>
                {t('nav.myTasks')}
              </Link>
              <Link to="/performance" className={mobileNavLinkClass('/performance')}>
                📊 Performance
              </Link>

              {/* User-specific mobile nav */}
              {!isAdmin && (
                <>
                  <Link to="/my-time-logs" className={mobileNavLinkClass('/my-time-logs')}>
                    {t('nav.myHours')}
                  </Link>
                  <Link to="/my-time-logs/manual" className={mobileNavLinkClass('/my-time-logs/manual')}>
                    {t('nav.addHours')}
                  </Link>
                  <Link to="/my-invoices" className={mobileNavLinkClass('/my-invoices')}>
                    {t('nav.myInvoices')}
                  </Link>
                </>
              )}

              {/* Admin-specific mobile nav */}
              {isAdmin && (
                <>
                  <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    {t('nav.administration')}
                  </div>
                  <Link to="/domiciles" className={mobileNavLinkClass('/domiciles')}>
                    {t('nav.domiciles')}
                  </Link>
                  <Link to="/create-task" className={mobileNavLinkClass('/create-task')}>
                    {t('nav.createTask')}
                  </Link>
                  <Link to="/admin/time-logs" className={mobileNavLinkClass('/admin/time-logs')}>
                    {t('nav.timeLogs')}
                  </Link>
                  <Link to="/admin/invoices" className={mobileNavLinkClass('/admin/invoices')}>
                    {t('nav.invoices')}
                  </Link>
                  <Link to="/admin/invoices/create" className={mobileNavLinkClass('/admin/invoices/create')}>
                    {t('nav.createInvoice')}
                  </Link>
                  <Link to="/admin/stats" className={mobileNavLinkClass('/admin/stats')}>
                    {t('nav.adminStats')}
                  </Link>
                  <Link to="/admin/users" className={mobileNavLinkClass('/admin/users')}>
                    {t('nav.adminUsers')}
                  </Link>
                  <Link to="/admin/logs" className={mobileNavLinkClass('/admin/logs')}>
                    {t('nav.adminLogs')}
                  </Link>
                  <Link to="/admin/content" className={mobileNavLinkClass('/admin/content')}>
                    {t('nav.adminContent')}
                  </Link>
                  <Link to="/recurring-tasks" className={mobileNavLinkClass('/recurring-tasks')}>
                    🔄 Tâches récurrentes
                  </Link>
                  <Link to="/budgets" className={mobileNavLinkClass('/budgets')}>
                    💰 Budget & Coûts
                  </Link>
                </>
              )}

              {/* Account section (mobile) */}
              <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                {t('nav.myAccount')}
              </div>
              <Link to="/profile" className={mobileNavLinkClass('/profile')}>
                {t('nav.profile')}
              </Link>
              <Link to="/settings" className={mobileNavLinkClass('/settings')}>
                {t('nav.settings')}
              </Link>
              <Link to="/notifications" className={mobileNavLinkClass('/notifications')}>
                {t('nav.notifications')}
              </Link>
              <Link to="/search" className={mobileNavLinkClass('/search')}>
                {t('nav.search')}
              </Link>
              <Link to="/activity" className={mobileNavLinkClass('/activity')}>
                {t('nav.activity')}
              </Link>
              <Link to="/favorites" className={mobileNavLinkClass('/favorites')}>
                {t('nav.favorites')}
              </Link>
              <Link to="/badges" className={mobileNavLinkClass('/badges')}>
                {t('nav.badges')}
              </Link>
              <Link to="/export" className={mobileNavLinkClass('/export')}>
                {t('nav.exportData')}
              </Link>
              <Link to="/twofa" className={mobileNavLinkClass('/twofa')}>
                {t('nav.twofa')}
              </Link>
              <Link to="/support" className={mobileNavLinkClass('/support')}>
                {t('nav.support')}
              </Link>

              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors mt-2"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
