// Centralized API Base URL Configuration for VJ Express
const defaultUrl = import.meta.env.PROD 
  ? 'https://vj-shopping-world.onrender.com/api' 
  : 'http://localhost:5000/api';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || defaultUrl).replace(/\/$/, '');
