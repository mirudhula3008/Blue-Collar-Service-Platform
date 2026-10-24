import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ComingSoon from './pages/ComingSoon';

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
            <Route
              path="/worker/dashboard"
              element={
                <ProtectedRoute roles={['worker']}>
                  <ComingSoon title="Incoming requests" module="Module 3" />
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
