import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard.jsx';
import CaptainDashboard from './pages/CaptainDashboard.jsx';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#0284c7',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '20px',
            letterSpacing: '0.5px',
          }}
        >
          <span>🏆</span>
          <span>ARENA<span style={{ color: '#0f172a' }}>ELITE</span></span>
        </Link>

        <Link
          to="/"
          style={{
            color: '#475569',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Tournaments
        </Link>
      </div>

      {/* Role-Specific Navigation Links */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        {user?.role === 'ADMIN' && (
          <Link
            to="/admin/dashboard"
            style={{
              background: '#f3e8ff',
              border: '1px solid #e9d5ff',
              color: '#7e22ce',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            🛡️ Admin Console
          </Link>
        )}

        {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
          <Link
            to="/organizer/dashboard"
            style={{
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            📋 Organizer Portal
          </Link>
        )}

        {(user?.role === 'CAPTAIN' || user?.role === 'ADMIN') && (
          <Link
            to="/captain/dashboard"
            style={{
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ⚽ Captain Portal
          </Link>
        )}

        {/* User Account or Auth CTA */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {user.role} {user.organizationName ? `• ${user.organizationName}` : ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              to="/login"
              style={{
                color: '#475569',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                padding: '6px 12px',
              }}
            >
              Log In
            </Link>
            <Link
              to="/register"
              style={{
                background: '#0284c7',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: 6,
              }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Portal */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/unauthorized"
            element={
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <h2 style={{ color: '#dc2626', fontSize: '24px' }}>⛔ 403 Forbidden</h2>
                <p style={{ color: '#64748b', marginTop: 8 }}>
                  You do not have permission to view this section.
                </p>
                <Link to="/" style={{ display: 'inline-block', marginTop: 16 }}>
                  Return to Home
                </Link>
              </div>
            }
          />

          {/* Admin Console */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Organizer Portal */}
          <Route element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']} />}>
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          </Route>

          {/* Captain Portal */}
          <Route element={<ProtectedRoute allowedRoles={['CAPTAIN', 'ADMIN']} />}>
            <Route path="/captain/dashboard" element={<CaptainDashboard />} />
          </Route>

          {/* Scorer Console (Upcoming) */}
          <Route element={<ProtectedRoute allowedRoles={['SCORER', 'ADMIN']} />}>
            <Route
              path="/scorer/dashboard"
              element={
                <div style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 600, margin: '40px auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <span style={{ fontSize: '36px' }}>⏱️</span>
                  <h2 style={{ color: '#0284c7', marginTop: 12 }}>Field Scorer Console</h2>
                  <p style={{ color: '#64748b', marginTop: 8 }}>
                    Low-latency live scoring and match clock engine will activate when fixtures are scheduled.
                  </p>
                </div>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}