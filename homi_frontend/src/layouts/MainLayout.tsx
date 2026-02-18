import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { UserRoles } from '../types';
import { LanguageSwitcher } from '../components/common';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAdmin = useMemo(() => user?.role === UserRoles.ADMIN, [user]);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/dashboard" 
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                {t('nav.dashboard')}
              </Link>
              <Link 
                to="/tasks" 
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                {t('nav.myTasks')}
              </Link>
              {!isAdmin && (
                <>
                  <Link 
                    to="/my-time-logs" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    {t('nav.myHours')}
                  </Link>
                  <Link 
                    to="/my-time-logs/manual" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    {t('nav.addHours')}
                  </Link>
                  <Link 
                    to="/my-invoices" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    {t('nav.myInvoices')}
                  </Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link 
                    to="/create-task" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    {t('nav.createTask')}
                  </Link>
                  <Link 
                    to="/admin/time-logs" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    {t('nav.timeLogs')}
                  </Link>
                  <Link 
                    to="/admin/invoices" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    {t('nav.invoices')}
                  </Link>
                  <Link 
                    to="/admin/invoices/create" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    {t('nav.createInvoice')}
                  </Link>
                </>
              )}
            </nav>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
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

              <button 
                className="hidden md:block p-2 text-gray-600 hover:text-primary-600 transition-colors relative"
                aria-label={t('nav.notifications')}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-success-500 flex items-center justify-center text-white font-semibold">
                  {getInitials()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-xs text-gray-600 hover:text-red-600 transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
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
              <div className="pb-3 mb-3 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>

              <Link 
                to="/dashboard" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.dashboard')}
              </Link>
              <Link 
                to="/tasks" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.myTasks')}
              </Link>
              {!isAdmin && (
                <>
                  <Link 
                    to="/my-time-logs" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.myHours')}
                  </Link>
                  <Link 
                    to="/my-time-logs/manual" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.addHours')}
                  </Link>
                  <Link 
                    to="/my-invoices" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.myInvoices')}
                  </Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link 
                    to="/create-task" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.createTask')}
                  </Link>
                  <Link 
                    to="/admin/time-logs" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.timeLogs')}
                  </Link>
                  <Link 
                    to="/admin/invoices" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.invoices')}
                  </Link>
                  <Link 
                    to="/admin/invoices/create" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.createInvoice')}
                  </Link>
                </>
              )}

              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
              
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
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
