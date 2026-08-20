import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

function Navigation() {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', background: '#0f172a', color: '#fff' }}>
      <Link to="/" style={{ color: '#38bdf8', fontWeight: 'bold', textDecoration: 'none', fontSize: '20px' }}>ArenaElite</Link>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Live Matches</Link>
        {user ? (
          <>
            <span style={{ color: '#94a3b8' }}>{user.name} ({user.role})</span>
            <button onClick={logout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#38bdf8', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<div style={{ padding: '24px' }}><h2>🏆 Public Live Matches & Standings</h2></div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<div style={{ padding: '24px', color: 'red' }}><h2>⛔ 403 Forbidden</h2></div>} />

          <Route element={<ProtectedRoute allowedRoles={['CAPTAIN']} />}>
            <Route path="/captain/dashboard" element={<div style={{ padding: '24px' }}><h2>🏏 Captain Portal</h2></div>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
            <Route path="/organizer/dashboard" element={<div style={{ padding: '24px' }}><h2>📋 Organizer Portal</h2></div>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SCORER']} />}>
            <Route path="/scorer/dashboard" element={<div style={{ padding: '24px' }}><h2>⏱️ Scorer Console</h2></div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}