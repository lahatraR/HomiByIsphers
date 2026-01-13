import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, DashboardPage, CreateTaskPage, TasksPage } from './pages';
import { PrivateRoute, PublicRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/create-task" element={<CreateTaskPage />} />
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

