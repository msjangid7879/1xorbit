import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://3dwgwpg9v6mpvi4iaxsfhthn.189.72.155.182.sslip.io/api',
});

export default api;
