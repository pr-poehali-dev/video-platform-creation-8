import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  channel_description?: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('youbube_token');
    const savedUser = localStorage.getItem('youbube_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch('https://functions.poehali.dev/7002c7dc-25c9-4e63-a7cb-8df782dd4ddb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('youbube_token', data.token);
    localStorage.setItem('youbube_user', JSON.stringify(data.user));
  };

  const register = async (username: string, email: string, password: string, displayName: string) => {
    const response = await fetch('https://functions.poehali.dev/7002c7dc-25c9-4e63-a7cb-8df782dd4ddb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, email, password, display_name: displayName })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('youbube_token', data.token);
    localStorage.setItem('youbube_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('youbube_token');
    localStorage.removeItem('youbube_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
