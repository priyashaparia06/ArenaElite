import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CAPTAIN', district: '', organizationName: '' });
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Create Account</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 8 }} />
        <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 8 }} />
        <input placeholder="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 8 }} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ padding: 8 }}>
          <option value="CAPTAIN">Team Captain</option>
          <option value="ORGANIZER">Tournament Organizer</option>
          <option value="SCORER">Official Scorer</option>
        </select>
        {form.role === 'ORGANIZER' && (
          <input placeholder="Organization Name" required value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} style={{ padding: 8 }} />
        )}
        <input placeholder="District (e.g. Rajkot)" required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={{ padding: 8 }} />
        <input type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ padding: 8 }} />
        <button type="submit" style={{ padding: 10, background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4 }}>Register</button>
      </form>
      <p style={{ marginTop: 15 }}>Already registered? <Link to="/login">Login</Link></p>
    </div>
  );
}