import axios from 'axios';
import useAppStore from 'store/appStore';

const baseURL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const getAuthState = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const savedAuthState =
      localStorage.getItem('auth-state');

    return savedAuthState
      ? JSON.parse(savedAuthState)
      : {};
  } catch {
    localStorage.removeItem('auth-state');
    return {};
  }
};

const axiosInstance = axios.create({
  baseURL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const authState = getAuthState();
    const token = authState?.accessToken;

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      useAppStore.getState().logout();

      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/signin'
      ) {
        window.location.replace('/signin');
      }
    }

    return Promise.reject(error);
  }
);

const useAxios = () => axiosInstance;

export default useAxios;