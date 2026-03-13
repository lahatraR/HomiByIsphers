import React, { useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { UserRoles } from '../types';
import {
  LanguageSwitcher,
  IconHome, IconTaskCheck, IconBarChart, IconClock, IconFileText,
  IconMapPin, IconActivity, IconRefresh, IconDollar, IconUsers,
  IconFileLogs, IconLayers, IconPlus, IconUser, IconSettings,
  IconBell, IconSearch, IconHeart, IconAward, IconDownload,
  IconLock, IconHelpCircle, IconPlusCircle, IconFilePlus,
  IconLogOut, IconMenu, IconX, IconChevronDown,
} from '../components/common';

// Badge environnement — visible seulement en dev
const ENV_LABEL = import.meta.env.VITE_ENV_LABEL as string | undefined;
const showEnvBadge = !import.meta.env.PROD && ENV_LABEL;

/** Nav icon size: sm (16px) for all navigation contexts */
const N = 'w-4 h-4';

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
    if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
    return '??';
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkClass = (path: string) =>
    `relative font-medium text-sm transition-colors duration-150 inline-flex items-center gap-1.5 ${isActive(path) ? 'text-primary-600 dark:text-primary-400' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'}`;

  const mobileNavLinkClass = (path: string) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${isActive(path) ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-[#262628] hover:text-surface-900 dark:hover:text-white'}`;

  return (
    <div className="min-h-[100dvh] bg-surface-50 dark:bg-[#111113]">
      {/* Header */}
      <header className="glass-strong dark:!bg-[#1a1a1c]/95 border-b border-surface-200/60 dark:border-[#3a3a3c]/60 sticky top-0 z-50 shadow-xs">
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
              <span className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">Homi</span>
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
            <nav className="hidden md:flex items-center space-x-5">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <IconHome className={N} />
                {t('nav.dashboard')}
              </Link>
              <Link to="/tasks" className={navLinkClass('/tasks')}>
                <IconTaskCheck className={N} />
                {t('nav.myTasks')}
              </Link>
              <Link to="/performance" className={navLinkClass('/performance')}>
                <IconBarChart className={N} />
                {t('nav.performance', 'Performance')}
              </Link>

              {/* User (Exécutant) nav */}
              {!isAdmin && (
                <>
                  <Link to="/my-time-logs" className={navLinkClass('/my-time-logs')}>
                    <IconClock className={N} />
                    {t('nav.myHours')}
                  </Link>
                  <Link to="/my-invoices" className={navLinkClass('/my-invoices')}>
                    <IconFileText className={N} />
                    {t('nav.myInvoices')}
                  </Link>
                </>
              )}

              {/* Admin (Propriétaire) nav */}
              {isAdmin && (
                <>
                  <Link to="/domiciles" className={navLinkClass('/domiciles')}>
                    <IconMapPin className={N} />
                    {t('nav.domiciles')}
                  </Link>
                  <Link to="/admin/time-logs" className={navLinkClass('/admin/time-logs')}>
                    <IconClock className={N} />
                    {t('nav.timeLogs')}
                  </Link>
                  <Link to="/admin/invoices" className={navLinkClass('/admin/invoices')}>
                    <IconFileText className={N} />
                    {t('nav.invoices')}
                  </Link>
                  <Link to="/admin/stats" className={navLinkClass('/admin/stats')}>
                    <IconActivity className={N} />
                    {t('nav.adminStats')}
                  </Link>
                  <Link to="/recurring-tasks" className={navLinkClass('/recurring-tasks')}>
                    <IconRefresh className={N} />
                    {t('nav.recurringTasks', 'Récurrences')}
                  </Link>
                  <Link to="/budgets" className={navLinkClass('/budgets')}>
                    <IconDollar className={N} />
                    {t('nav.budgets', 'Budget')}
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Right Section */}
            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden icon-touch text-surface-500 hover:text-surface-900 transition-colors duration-150 rounded-lg hover:bg-surface-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? t('nav.closeMenu', 'Fermer le menu') : t('nav.openMenu', 'Ouvrir le menu')}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen
                  ? <IconX className="w-6 h-6" />
                  : <IconMenu className="w-6 h-6" />
                }
              </button>

              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {/* Search icon */}
              <Link
                to="/search"
                className="hidden md:flex icon-touch icon-interactive text-surface-500 hover:text-surface-900 rounded-lg hover:bg-surface-100"
                aria-label={t('nav.search')}
              >
                <IconSearch className={N} />
              </Link>

              {/* Notifications bell → links to /notifications */}
              <Link
                to="/notifications"
                className="hidden md:flex icon-touch icon-interactive text-surface-500 hover:text-surface-900 rounded-lg hover:bg-surface-100 relative"
                aria-label={t('nav.notifications')}
              >
                <IconBell className={N} />
              </Link>

              {/* User Avatar + Dropdown */}
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-surface-100 transition-all duration-150"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-success-500 flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials()}
                  </div>
                  <IconChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1c1c1e] rounded-xl border border-surface-200/60 dark:border-[#3a3a3c] py-1.5 z-50 animate-scale-in origin-top-right shadow-float" role="menu">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-surface-100 dark:border-[#2c2c2e]">
                      <div className="text-sm font-semibold text-surface-900 dark:text-white">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.firstName || t('nav.user', 'Utilisateur'))}
                      </div>
                      <div className="mt-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full tracking-wide ${
                          isAdmin ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200' : 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200'
                        }`}>
                          {isAdmin ? t('roles.owner', 'Propriétaire') : t('roles.executor', 'Exécutant')}
                        </span>
                      </div>
                    </div>

                    {/* Mon compte section */}
                    <div className="py-1" role="group" aria-label={t('nav.myAccount')}>
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase text-surface-400 tracking-wider">
                        {t('nav.myAccount')}
                      </div>
                      <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                        <IconUser className="w-4 h-4 mr-3 text-surface-400" />
                        {t('nav.profile')}
                      </Link>
                      <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                        <IconSettings className="w-4 h-4 mr-3 text-surface-400" />
                        {t('nav.settings')}
                      </Link>
                      <Link to="/twofa" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                        <IconLock className="w-4 h-4 mr-3 text-surface-400" />
                        {t('nav.twofa')}
                      </Link>
                      <Link to="/activity" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                        <IconActivity className="w-4 h-4 mr-3 text-surface-400" />
                        {t('nav.activity')}
                      </Link>
                      <Link to="/favorites" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                        <IconHeart className="w-4 h-4 mr-3 text-surface-400" />
                        {t('nav.favorites')}
                      </Link>
                      <Link to="/badges" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                        <IconAward className="w-4 h-4 mr-3 text-surface-400" />
                        {t('nav.badges')}
                      </Link>
                      <Link to="/export" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                        <IconDownload className="w-4 h-4 mr-3 text-surface-400" />
                        {t('nav.exportData')}
                      </Link>
                      <Link to="/support" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                        <IconHelpCircle className="w-4 h-4 mr-3 text-surface-400" />
                        {t('nav.support')}
                      </Link>
                    </div>

                    {/* Admin section */}
                    {isAdmin && (
                      <div className="py-1 border-t border-surface-100" role="group" aria-label={t('nav.administration')}>
                        <div className="px-4 py-1.5 text-[10px] font-semibold uppercase text-surface-400 tracking-wider">
                          {t('nav.administration')}
                        </div>
                        <Link to="/admin/users" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                          <IconUsers className="w-4 h-4 mr-3 text-surface-400" />
                          {t('nav.adminUsers')}
                        </Link>
                        <Link to="/admin/logs" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                          <IconFileLogs className="w-4 h-4 mr-3 text-surface-400" />
                          {t('nav.adminLogs')}
                        </Link>
                        <Link to="/admin/content" className="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors duration-150 rounded-lg mx-1" role="menuitem">
                          <IconLayers className="w-4 h-4 mr-3 text-surface-400" />
                          {t('nav.adminContent')}
                        </Link>
                      </div>
                    )}

                    {/* Logout */}
                    <div className="border-t border-surface-100 pt-1 mt-1">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 rounded-lg mx-1"
                        role="menuitem"
                      >
                        <IconLogOut className="w-4 h-4 mr-3" />
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
          <div className="md:hidden border-t border-surface-200/60 dark:border-[#3a3a3c]/60 bg-white dark:bg-[#1a1a1c] animate-fade-in-down max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
            <div className="px-4 py-3 pb-6 space-y-0.5">
              {/* User info */}
              <div className="pb-3 mb-3 border-b border-surface-100 dark:border-[#2c2c2e]">
                <div className="text-sm font-semibold text-surface-900 dark:text-white">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.firstName || t('nav.user', 'Utilisateur'))}
                </div>
                <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full tracking-wide ${
                  isAdmin ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200' : 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200'
                }`}>
                  {isAdmin ? t('roles.owner', 'Propriétaire') : t('roles.executor', 'Exécutant')}
                </span>
              </div>

              {/* Main nav */}
              <Link to="/dashboard" className={mobileNavLinkClass('/dashboard')}>
                <IconHome className={N} />
                {t('nav.dashboard')}
              </Link>
              <Link to="/tasks" className={mobileNavLinkClass('/tasks')}>
                <IconTaskCheck className={N} />
                {t('nav.myTasks')}
              </Link>
              <Link to="/performance" className={mobileNavLinkClass('/performance')}>
                <IconBarChart className={N} />
                {t('nav.performance', 'Performance')}
              </Link>

              {/* User-specific mobile nav */}
              {!isAdmin && (
                <>
                  <Link to="/my-time-logs" className={mobileNavLinkClass('/my-time-logs')}>
                    <IconClock className={N} />
                    {t('nav.myHours')}
                  </Link>
                  <Link to="/my-time-logs/manual" className={mobileNavLinkClass('/my-time-logs/manual')}>
                    <IconPlusCircle className={N} />
                    {t('nav.addHours')}
                  </Link>
                  <Link to="/my-invoices" className={mobileNavLinkClass('/my-invoices')}>
                    <IconFileText className={N} />
                    {t('nav.myInvoices')}
                  </Link>
                </>
              )}

              {/* Admin-specific mobile nav */}
              {isAdmin && (
                <>
                  <div className="pt-3 pb-1.5 px-3 text-[10px] font-semibold uppercase text-surface-400 tracking-wider">
                    {t('nav.administration')}
                  </div>
                  <Link to="/domiciles" className={mobileNavLinkClass('/domiciles')}>
                    <IconMapPin className={N} />
                    {t('nav.domiciles')}
                  </Link>
                  <Link to="/create-task" className={mobileNavLinkClass('/create-task')}>
                    <IconPlus className={N} />
                    {t('nav.createTask')}
                  </Link>
                  <Link to="/admin/time-logs" className={mobileNavLinkClass('/admin/time-logs')}>
                    <IconClock className={N} />
                    {t('nav.timeLogs')}
                  </Link>
                  <Link to="/admin/invoices" className={mobileNavLinkClass('/admin/invoices')}>
                    <IconFileText className={N} />
                    {t('nav.invoices')}
                  </Link>
                  <Link to="/admin/invoices/create" className={mobileNavLinkClass('/admin/invoices/create')}>
                    <IconFilePlus className={N} />
                    {t('nav.createInvoice')}
                  </Link>
                  <Link to="/admin/stats" className={mobileNavLinkClass('/admin/stats')}>
                    <IconActivity className={N} />
                    {t('nav.adminStats')}
                  </Link>
                  <Link to="/admin/users" className={mobileNavLinkClass('/admin/users')}>
                    <IconUsers className={N} />
                    {t('nav.adminUsers')}
                  </Link>
                  <Link to="/admin/logs" className={mobileNavLinkClass('/admin/logs')}>
                    <IconFileLogs className={N} />
                    {t('nav.adminLogs')}
                  </Link>
                  <Link to="/admin/content" className={mobileNavLinkClass('/admin/content')}>
                    <IconLayers className={N} />
                    {t('nav.adminContent')}
                  </Link>
                  <Link to="/recurring-tasks" className={mobileNavLinkClass('/recurring-tasks')}>
                    <IconRefresh className={N} />
                    {t('nav.recurringTasks', 'Tâches récurrentes')}
                  </Link>
                  <Link to="/budgets" className={mobileNavLinkClass('/budgets')}>
                    <IconDollar className={N} />
                    {t('nav.budgets', 'Budget & Coûts')}
                  </Link>
                </>
              )}

              {/* Account section (mobile) */}
              <div className="pt-3 pb-1.5 px-3 text-[10px] font-semibold uppercase text-surface-400 tracking-wider">
                {t('nav.myAccount')}
              </div>
              <Link to="/profile" className={mobileNavLinkClass('/profile')}>
                <IconUser className={N} />
                {t('nav.profile')}
              </Link>
              <Link to="/settings" className={mobileNavLinkClass('/settings')}>
                <IconSettings className={N} />
                {t('nav.settings')}
              </Link>
              <Link to="/notifications" className={mobileNavLinkClass('/notifications')}>
                <IconBell className={N} />
                {t('nav.notifications')}
              </Link>
              <Link to="/search" className={mobileNavLinkClass('/search')}>
                <IconSearch className={N} />
                {t('nav.search')}
              </Link>
              <Link to="/activity" className={mobileNavLinkClass('/activity')}>
                <IconActivity className={N} />
                {t('nav.activity')}
              </Link>
              <Link to="/favorites" className={mobileNavLinkClass('/favorites')}>
                <IconHeart className={N} />
                {t('nav.favorites')}
              </Link>
              <Link to="/badges" className={mobileNavLinkClass('/badges')}>
                <IconAward className={N} />
                {t('nav.badges')}
              </Link>
              <Link to="/export" className={mobileNavLinkClass('/export')}>
                <IconDownload className={N} />
                {t('nav.exportData')}
              </Link>
              <Link to="/twofa" className={mobileNavLinkClass('/twofa')}>
                <IconLock className={N} />
                {t('nav.twofa')}
              </Link>
              <Link to="/support" className={mobileNavLinkClass('/support')}>
                <IconHelpCircle className={N} />
                {t('nav.support')}
              </Link>

              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors duration-150 mt-2"
              >
                <IconLogOut className={N} />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="section-container py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};
