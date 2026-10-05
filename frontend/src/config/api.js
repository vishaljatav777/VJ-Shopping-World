// Centralized API Base URL Configuration for VJ Express
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // Runtime guard: If running on a live hosted domain (not localhost/127.0.0.1)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // If envUrl is missing or points to localhost, force production Render backend
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return 'https://vj-shopping-world-backend.onrender.com/api';
    }
    return envUrl;
  }

  // Local development mode
  return envUrl || (import.meta.env.PROD ? 'https://vj-shopping-world-backend.onrender.com/api' : 'http://localhost:5000/api');
};

export const API_BASE_URL = getApiBaseUrl().replace(/\/$/, '');
