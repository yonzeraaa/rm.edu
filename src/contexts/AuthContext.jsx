import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      console.log('AuthContext: Login attempt with:', credentials);
      const response = await authService.login(credentials);
      console.log('AuthContext: Login response:', response);

      if (response && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return { success: true };
      } else {
        console.error('AuthContext: Invalid login response:', response);
        return { 
          success: false, 
          error: 'Resposta inválida do servidor' 
        };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data.error || 'Credenciais inválidas'
        };
      }
      return { 
        success: false, 
        error: 'Erro ao fazer login. Por favor, tente novamente.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('AuthContext: Register attempt with:', userData);
      const response = await authService.register(userData);
      console.log('AuthContext: Register response:', response);

      if (response && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return { success: true };
      } else {
        console.error('AuthContext: Invalid register response:', response);
        return { 
          success: false, 
          error: 'Resposta inválida do servidor' 
        };
      }
    } catch (error) {
      console.error('AuthContext: Register error:', error);
      if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data.error || 'Erro ao criar conta'
        };
      }
      return { 
        success: false, 
        error: 'Erro ao criar conta. Por favor, tente novamente.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
