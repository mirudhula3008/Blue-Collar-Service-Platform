import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ComingSoon from './pages/ComingSoon';
import BookingForm from './pages/BookingForm';
import MyBookings from './pages/MyBookings';
import WorkerRequests from './pages/WorkerRequests';
import WorkerJobs from './pages/WorkerJobs';

export default function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Module 1 — Authentication and User Management */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['customer', 'worker']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Placeholders — replaced by Modules 2, 3 and 4 when merged */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['customer']}>
                  <ComingSoon title="Customer dashboard" module="Module 2" />
                </ProtectedRoute>
              }
            />

            {/* Module 3 — Booking System */}
            <Route
              path="/book/:workerId"
              element={
                <ProtectedRoute roles={['customer']}>
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute roles={['customer']}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/dashboard"
              element={
                <ProtectedRoute roles={['worker']}>
                  <WorkerRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/jobs"
              element={
                <ProtectedRoute roles={['worker']}>
                  <WorkerJobs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ComingSoon title="Admin dashboard" module="Module 4" />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<p className="p-8 text-center">Page not found</p>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
