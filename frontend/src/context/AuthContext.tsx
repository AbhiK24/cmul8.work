import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../api/client';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('worksim_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const userData = await auth.me(token);
          setUser(userData);
        } catch {
          // Token invalid, clear it
          localStorage.removeItem('worksim_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await auth.login(email, password);
    localStorage.setItem('worksim_token', response.access_token);
    setToken(response.access_token);
  };

  const register = async (email: string, password: string) => {
    const response = await auth.register(email, password);
    localStorage.setItem('worksim_token', response.access_token);
    setToken(response.access_token);
  };

  const logout = () => {
    localStorage.removeItem('worksim_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
