import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  LoginPage, 
  DashboardPage, 
  CreateTaskPage, 
  TasksPage, 
  CreateDomicilePage, 
  DomicilesPage, 
  TaskTimerPage, 
  RegisterPage,
  VerifyEmailPage,
  ResendVerificationPage,
  AdminTimeLogsPage,
  MyTimeLogsPage,
  AdminInvoicesPage,
  MyInvoicesPage,
  CreateInvoicePage,
  ManualTimeLogPage,
  ProfilePage,
  NotificationsPage,
  SupportPage,
  SettingsPage,
  FavoritesPage,
  ActivityPage,
  AdminUsersPage,
  AdminLogsPage,
  AdminContentPage,
  AdminStatsPage,
  OnboardingPage,
  ExportDataPage,
  TwoFAPage,
  SearchPage,
  BadgesPage,
  Error404
} from './pages';
import { PrivateRoute, PublicRoute, AdminRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter basename="/HomiByIsphers">
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
          </Route>
        </Route>

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* 404 Route */}
        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

