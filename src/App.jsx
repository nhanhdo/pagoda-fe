import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import RippleEffect from './components/RippleEffect/RippleEffect';
import CustomCursor from './components/CustomCursor/CustomCursor';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './pages/Home/HomePage';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import PersonnelList from './pages/Personnel/PersonnelList';
import PersonnelDetail from './pages/Personnel/PersonnelDetail';
import DutySchedulePage from './pages/DutySchedule/DutySchedulePage';
import WorkAssignmentPage from './pages/WorkAssignment/WorkAssignmentPage';
import TrainingPage from './pages/Training/TrainingPage';
import BuddhistFollowerPage from './pages/BuddhistFollower/BuddhistFollowerPage';
import RewardDisciplinePage from './pages/RewardDiscipline/RewardDisciplinePage';
import DepartmentPage from './pages/Department/DepartmentPage';
import NewsPage from './pages/News/NewsPage';
import UserManagementPage from './pages/Users/UserManagementPage';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/app/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Trang chủ công khai */}
      <Route path="/" element={<HomePage />} />

      {/* Đăng nhập — nếu đã login thì vào app */}
      <Route
        path="/login"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
      />

      {/* Toàn bộ app quản lý — yêu cầu đăng nhập */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard"          element={<Dashboard />} />
        <Route path="personnel"          element={<PersonnelList />} />
        <Route path="personnel/:id"      element={<PersonnelDetail />} />
        <Route path="departments"        element={<DepartmentPage />} />
        <Route path="duty-schedule"      element={<DutySchedulePage />} />
        <Route path="work-assignment"    element={<WorkAssignmentPage />} />
        <Route path="training"           element={<TrainingPage />} />
        <Route path="buddhist-followers" element={<BuddhistFollowerPage />} />
        <Route path="reward-discipline"  element={<RewardDisciplinePage />} />
        <Route path="news"               element={<NewsPage />} />
        <Route path="users"              element={<AdminRoute><UserManagementPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomCursor />
        <RippleEffect />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
