import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { CompareProvider } from '@/context/CompareContext';
import CompareBar from '@/components/CompareBar';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Onboarding from '@/pages/Onboarding';
import SearchProperties from '@/pages/SearchProperties';
import PropertyDetail from '@/pages/PropertyDetail';
import CreateListing from '@/pages/host/CreateListing';
import HostDashboard from '@/pages/host/HostDashboard';
import Messages from '@/pages/Messages';
import MyBookings from '@/pages/MyBookings';
import SavedProperties from '@/pages/SavedProperties';
import Profile from '@/pages/Profile';
import AdminPanel from '@/pages/AdminPanel';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Compare from '@/pages/Compare';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Loading LongStay...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    else if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/search" element={<SearchProperties />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/host/create-listing" element={<CreateListing />} />
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/saved" element={<SavedProperties />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <CompareProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
            <CompareBar />
          </Router>
          <Toaster />
        </CompareProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
