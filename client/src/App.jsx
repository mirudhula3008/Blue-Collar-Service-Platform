import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerListing from './pages/WorkerListing';
import WorkerDetail from './pages/WorkerDetail';
import BookingForm from './pages/BookingForm';
import MyBookings from './pages/MyBookings';
import WorkerRequests from './pages/WorkerRequests';
import WorkerJobs from './pages/WorkerJobs';
import ReviewPage from './pages/ReviewPage';
import WorkerReviews from './pages/WorkerReviews';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminWorkers from './pages/AdminWorkers';
import AdminWorkerDetail from './pages/AdminWorkerDetail';
import AdminCustomers from './pages/AdminCustomers';
import AdminBookings from './pages/AdminBookings';
import PaymentPage from './pages/PaymentPage';
import EarningsDashboard from './pages/EarningsDashboard';

const guard = (roles, element) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

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
            <Route path="/profile" element={guard(['customer', 'worker'], <Profile />)} />

            {/* Module 2 — Service Discovery and Maps (browsing is public; booking needs login) */}
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/workers" element={<WorkerListing />} />
            <Route path="/workers/:id" element={<WorkerDetail />} />

            {/* Module 3 — Booking System */}
            <Route path="/book/:workerId" element={guard(['customer'], <BookingForm />)} />
            <Route path="/bookings" element={guard(['customer'], <MyBookings />)} />
            <Route path="/worker/dashboard" element={guard(['worker'], <WorkerRequests />)} />
            <Route path="/worker/jobs" element={guard(['worker'], <WorkerJobs />)} />

            {/* Module 4 — Reviews, Ratings and Admin */}
            <Route path="/review/:bookingId" element={guard(['customer'], <ReviewPage />)} />
            <Route path="/worker/reviews" element={guard(['worker'], <WorkerReviews />)} />
            <Route path="/admin" element={guard(['admin'], <AdminDashboard />)} />
            <Route path="/admin/users" element={guard(['admin'], <AdminUsers />)} />
            <Route path="/admin/workers" element={guard(['admin'], <AdminWorkers />)} />
            <Route path="/admin/workers/:id" element={guard(['admin'], <AdminWorkerDetail />)} />
            <Route path="/admin/customers" element={guard(['admin'], <AdminCustomers />)} />
            <Route path="/admin/bookings" element={guard(['admin'], <AdminBookings />)} />

            {/* Payments and earnings */}
            <Route path="/payment/:bookingId" element={guard(['customer'], <PaymentPage />)} />
            <Route path="/worker/earnings" element={guard(['worker'], <EarningsDashboard />)} />

            <Route path="*" element={<p className="p-8 text-center">Page not found</p>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
