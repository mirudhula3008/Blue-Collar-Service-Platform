import { Link, Navigate, Route, Routes } from 'react-router-dom';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerListing from './pages/WorkerListing';
import WorkerDetail from './pages/WorkerDetail';

// Module 1 will add the landing/auth routes; other modules add theirs here.
export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="font-bold text-lg text-blue-700">
            Blue-Collar <span className="text-slate-800">Services</span>
          </Link>
          <nav className="text-sm">
            <Link to="/dashboard" className="text-slate-600 hover:text-blue-700">
              Services
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/workers" element={<WorkerListing />} />
          <Route path="/workers/:id" element={<WorkerDetail />} />
          <Route path="*" element={<p className="p-8 text-center">Page not found</p>} />
        </Routes>
      </main>
    </div>
  );
}
