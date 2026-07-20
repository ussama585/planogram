import { create } from 'zustand';

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem('auth-state');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const useAppStore = create((set) => ({
  user: readStoredAuth(),
  accessToken: readStoredAuth()?.accessToken || '',
  id: readStoredAuth()?.id || null,
  email: readStoredAuth()?.email || '',
  name: readStoredAuth()?.name || '',
  phone: readStoredAuth()?.phone || '',
  refreshToken: readStoredAuth()?.refreshToken || '',
  userStatus: readStoredAuth()?.userStatus || false,
  userType: readStoredAuth()?.userType || '',
  isAuthenticated: Boolean(readStoredAuth()?.accessToken),
  setAuth: (authData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-state', JSON.stringify(authData));
    }

    set({
      user: authData,
      accessToken: authData?.accessToken || '',
      id: authData?.id || null,
      email: authData?.email || '',
      name: authData?.name || '',
      phone: authData?.phone || '',
      refreshToken: authData?.refreshToken || '',
      userStatus: authData?.userStatus || false,
      userType: authData?.userType || '',
      isAuthenticated: Boolean(authData?.accessToken)
    });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-state');
    }

    set({
      user: null,
      accessToken: '',
      id: null,
      email: '',
      name: '',
      phone: '',
      refreshToken: '',
      userStatus: false,
      userType: '',
      isAuthenticated: false
    });
  }
}));

export default useAppStore;
