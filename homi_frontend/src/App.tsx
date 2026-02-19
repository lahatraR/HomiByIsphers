import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { 
  LoginPage, 
  RegisterPage,
  VerifyEmailPage,
  ResendVerificationPage,
  DashboardPage,
  Error404
} from './pages';
import { PrivateRoute, PublicRoute, AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages for code splitting (wrap named exports for React.lazy)
const CreateTaskPage = lazy(() => import('./pages/CreateTaskPage').then(m => ({ default: m.CreateTaskPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const CreateDomicilePage = lazy(() => import('./pages/CreateDomicilePage').then(m => ({ default: m.CreateDomicilePage })));
const DomicilesPage = lazy(() => import('./pages/DomicilesPage').then(m => ({ default: m.DomicilesPage })));
const TaskTimerPage = lazy(() => import('./pages/TaskTimerPage').then(m => ({ default: m.TaskTimerPage })));
const AdminTimeLogsPage = lazy(() => import('./pages/AdminTimeLogsPage').then(m => ({ default: m.AdminTimeLogsPage })));
const MyTimeLogsPage = lazy(() => import('./pages/MyTimeLogsPage').then(m => ({ default: m.MyTimeLogsPage })));
const AdminInvoicesPage = lazy(() => import('./pages/AdminInvoicesPage').then(m => ({ default: m.AdminInvoicesPage })));
const MyInvoicesPage = lazy(() => import('./pages/MyInvoicesPage').then(m => ({ default: m.MyInvoicesPage })));
const CreateInvoicePage = lazy(() => import('./pages/CreateInvoicePage').then(m => ({ default: m.CreateInvoicePage })));
const ManualTimeLogPage = lazy(() => import('./pages/ManualTimeLogPage').then(m => ({ default: m.ManualTimeLogPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then(m => ({ default: m.SupportPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const ActivityPage = lazy(() => import('./pages/ActivityPage').then(m => ({ default: m.ActivityPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminLogsPage = lazy(() => import('./pages/AdminLogsPage').then(m => ({ default: m.AdminLogsPage })));
const AdminContentPage = lazy(() => import('./pages/AdminContentPage').then(m => ({ default: m.AdminContentPage })));
const AdminStatsPage = lazy(() => import('./pages/AdminStatsPage').then(m => ({ default: m.AdminStatsPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const ExportDataPage = lazy(() => import('./pages/ExportDataPage').then(m => ({ default: m.ExportDataPage })));
const TwoFAPage = lazy(() => import('./pages/TwoFAPage').then(m => ({ default: m.TwoFAPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const BadgesPage = lazy(() => import('./pages/BadgesPage').then(m => ({ default: m.BadgesPage })));
const PerformancePage = lazy(() => import('./pages/PerformancePage').then(m => ({ default: m.PerformancePage })));
const RecurringTasksPage = lazy(() => import('./pages/RecurringTasksPage').then(m => ({ default: m.RecurringTasksPage })));
const BudgetPage = lazy(() => import('./pages/BudgetPage').then(m => ({ default: m.BudgetPage })));

// Loading spinner for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-50">
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <span className="text-sm text-surface-400 font-medium tracking-tight-sm">Chargement...</span>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/HomiByIsphers">
        <Suspense fallback={<PageLoader />}>
          <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/resend-verification" element={<ResendVerificationPage />} />
        </Route>

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId/timer" element={<TaskTimerPage />} />
          <Route path="/my-time-logs" element={<MyTimeLogsPage />} />
          <Route path="/my-time-logs/manual" element={<ManualTimeLogPage />} />
          <Route path="/my-invoices" element={<MyInvoicesPage />} />
          {/* New user features */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/export" element={<ExportDataPage />} />
          <Route path="/twofa" element={<TwoFAPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          {/* Onboarding always accessible for logged-in users */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          {/* Admin features (Propriétaire) */}
          <Route element={<AdminRoute />}>
            <Route path="/create-task" element={<CreateTaskPage />} />
            <Route path="/create-domicile" element={<CreateDomicilePage />} />
            <Route path="/domiciles" element={<DomicilesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
            <Route path="/admin/content" element={<AdminContentPage />} />
            <Route path="/admin/stats" element={<AdminStatsPage />} />
            <Route path="/admin/time-logs" element={<AdminTimeLogsPage />} />
            <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
            <Route path="/admin/invoices/create" element={<CreateInvoicePage />} />
            <Route path="/recurring-tasks" element={<RecurringTasksPage />} />
            <Route path="/budgets" element={<BudgetPage />} />
          </Route>
        </Route>

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* 404 Route */}
        <Route path="*" element={<Error404 />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

