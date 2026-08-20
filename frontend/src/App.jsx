import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CaptainDashboard from './pages/CaptainDashboard.jsx'; // <--- Import here

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: '#0f172a', color: '#fff' }}>
      <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>ArenaElite</Link>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {user?.role === 'CAPTAIN' && (
          <Link to="/captain/dashboard" style={{ color: '#38bdf8', textDecoration: 'none' }}>My Teams</Link>
        )}
        {user ? (
          <>
            <span style={{ color: '#94a3b8' }}>{user.name} ({user.role})</span>
            <button onClick={logout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#38bdf8', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<div style={{ padding: 24 }}><h2>🏆 Public Live Match Center & Standings (Guest Mode)</h2></div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<div style={{ padding: 24, color: 'red' }}><h2>⛔ 403 Forbidden</h2></div>} />

          {/* Captain Portal */}
          <Route element={<ProtectedRoute allowedRoles={['CAPTAIN']} />}>
            <Route path="/captain/dashboard" element={<CaptainDashboard />} />
          </Route>

          {/* Placeholders for upcoming phases */}
          <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
            <Route path="/organizer/dashboard" element={<div style={{ padding: 24 }}><h2>📋 Organizer Portal: Phase 3</h2></div>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SCORER']} />}>
            <Route path="/scorer/dashboard" element={<div style={{ padding: 24 }}><h2>⏱️ Scorer Console: Phase 5</h2></div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}