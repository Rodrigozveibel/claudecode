import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { LoginCredentials } from '../types';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (credentials: LoginCredentials) => {
    const result = await authApi.login(credentials);
    login(result.user, result.token, result.refreshToken);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    logout();
    navigate('/login');
    toast.success('Você saiu com sucesso');
  };

  return {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
  };
}
