import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://base001-backend.onrender.com' // ✅ Aapki live backend URL
    : 'http://localhost:5000',
});

export default api;