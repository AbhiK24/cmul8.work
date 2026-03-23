import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth, b2cAuth } from '../api/client';

// B2B User (Employer)
interface User {
  id: string;
  email: string;
}

// B2C User (Individual)
interface B2CUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  job_role: string | null;
  experience_level: string | null;
}

type UserType = 'b2b' | 'b2c' | null;

interface AuthContextType {
  // B2B (Employer)
  user: User | null;
  token: string | null;
  // B2C (Individual)
  b2cUser: B2CUser | null;
  b2cToken: string | null;
  // Common
  userType: UserType;
  isLoading: boolean;
  // B2B methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  // B2C methods
  setB2CToken: (token: string) => void;
  // Common methods
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // B2B State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('worksim_token')
  );

  // B2C State
  const [b2cUser, setB2CUser] = useState<B2CUser | null>(null);
  const [b2cToken, setB2CTokenState] = useState<string | null>(() =>
    localStorage.getItem('worksim_b2c_token')
  );

  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load B2B user
  useEffect(() => {
    async function loadB2BUser() {
      if (token) {
        try {
          const userData = await auth.me(token);
          setUser(userData);
          setUserType('b2b');
        } catch {
          localStorage.removeItem('worksim_token');
          setToken(null);
        }
      }
    }
    loadB2BUser();
  }, [token]);

  // Load B2C user
  useEffect(() => {
    async function loadB2CUser() {
      if (b2cToken) {
        try {
          const userData = await b2cAuth.me(b2cToken);
          setB2CUser(userData);
          setUserType('b2c');
        } catch {
          localStorage.removeItem('worksim_b2c_token');
          setB2CTokenState(null);
        }
      }
      setIsLoading(false);
    }
    loadB2CUser();
  }, [b2cToken]);

  // B2B login
  const login = async (email: string, password: string) => {
    const response = await auth.login(email, password);
    localStorage.setItem('worksim_token', response.access_token);
    setToken(response.access_token);
    setUserType('b2b');
  };

  // B2B register
  const register = async (email: string, password: string) => {
    const response = await auth.register(email, password);
    localStorage.setItem('worksim_token', response.access_token);
    setToken(response.access_token);
    setUserType('b2b');
  };

  // B2C set token (from OAuth callback)
  const setB2CToken = (newToken: string) => {
    localStorage.setItem('worksim_b2c_token', newToken);
    setB2CTokenState(newToken);
    setUserType('b2c');
  };

  // Logout (both B2B and B2C)
  const logout = () => {
    // Clear B2B
    localStorage.removeItem('worksim_token');
    setToken(null);
    setUser(null);
    // Clear B2C
    localStorage.removeItem('worksim_b2c_token');
    setB2CTokenState(null);
    setB2CUser(null);
    // Reset type
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      b2cUser,
      b2cToken,
      userType,
      isLoading,
      login,
      register,
      setB2CToken,
      logout
    }}>
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
