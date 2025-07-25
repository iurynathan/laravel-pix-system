import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Só redireciona se não estiver já na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Extrai mensagem de erro da resposta da API
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.response?.data?.errors) {
      // Para erros de validação (422)
      const errors = error.response.data.errors;
      const firstError = Object.values(errors)[0];
      error.message = Array.isArray(firstError) ? firstError[0] : firstError;
    }

    return Promise.reject(error);
  }
);
