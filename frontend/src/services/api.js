import axios from 'axios';

const api = axios.create({
  baseURL: 'https://base001-backend.onrender.com/api', // ✅ Clean Fix: yahan hi /api add kar do
});

export default api;