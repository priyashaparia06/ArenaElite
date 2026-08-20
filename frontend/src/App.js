import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder Pages
const PublicFeed = () => <h2>Public Live Matches & Tournaments (Guest Mode)</h2>;
const Login = () => <h2>Login Form</h2>;
const Register = () => <h2>Register Form</h2>;
const CaptainDashboard = () => <h2>Captain Dashboard: My Teams & Rosters</h2>;
const OrganizerDashboard = () => <h2>Organizer Dashboard: Tournaments & Fixtures</h2>;
const ScorerConsole = () => <h2>Scorer Live Scoring Console</h2>;
const AdminPanel = () => <h2>Admin Governance & Analytics</h2>;

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - No login required */}
          <Route path="/" element={<PublicFeed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Captain Only */}
          <Route element={<ProtectedRoute allowedRoles={['CAPTAIN']} />}>
            <Route path="/captain/dashboard" element={<CaptainDashboard />} />
          </Route>

          {/* Organizer Only */}
          <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          </Route>

          {/* Scorer Only */}
          <Route element={<ProtectedRoute allowedRoles={['SCORER']} />}>
            <Route path="/scorer/match/:id" element={<ScorerConsole />} />
          </Route>

          {/* Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/panel" element={<AdminPanel />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}