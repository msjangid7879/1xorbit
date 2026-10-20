import axios from 'axios';

const api = axios.create({
  baseURL: 'https://base001-backend.onrender.com', // ✅ Direct live backend URL
});

export default api;