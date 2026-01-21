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
  ManualTimeLogPage
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
          <Route path="/create-task" element={<CreateTaskPage />} />
          <Route path="/create-domicile" element={<CreateDomicilePage />} />
          <Route path="/domiciles" element={<DomicilesPage />} />
          <Route path="/tasks/:taskId/timer" element={ <TaskTimerPage /> } />
          <Route path="/my-time-logs" element={<MyTimeLogsPage />} />
          <Route path="/my-time-logs/manual" element={<ManualTimeLogPage />} />
          <Route path="/my-invoices" element={<MyInvoicesPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/time-logs" element={<AdminTimeLogsPage />} />
            <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
            <Route path="/admin/invoices/create" element={<CreateInvoicePage />} />
          </Route>
        </Route>

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

