import axios from 'axios';

const getAuthState = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const saved = localStorage.getItem('auth-state');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useAxios = () => {
  const authState = getAuthState();
  const token = authState?.accessToken || null;

  const axiosInstance = axios.create({
    baseURL,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined
    }
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
  );

  return axiosInstance;
};

export default useAxios;
