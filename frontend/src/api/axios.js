import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatically attaches the JWT token from localStorage to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('arena_token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;