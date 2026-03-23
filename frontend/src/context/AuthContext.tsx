import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { auth } from '../api/client';

// B2B User (Employer)
interface User {
  id: string;
  email: string;
}

// B2C User (Individual) - from Clerk
interface B2CUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

type UserType = 'b2b' | 'b2c' | null;

interface AuthContextType {
  // B2B (Employer)
  user: User | null;
  token: string | null;
  // B2C (Individual) - Clerk
  b2cUser: B2CUser | null;
  b2cToken: string | null;
  isClerkLoaded: boolean;
  // Common
  userType: UserType;
  isLoading: boolean;
  // B2B methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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

  // Clerk B2C state
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { getToken: getClerkToken, signOut: clerkSignOut } = useClerkAuth();

  const [b2cToken, setB2CToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Clerk user to B2CUser
  const b2cUser: B2CUser | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName,
    avatar_url: clerkUser.imageUrl,
  } : null;

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
      setIsLoading(false);
    }
    loadB2BUser();
  }, [token]);

  // Load B2C token from Clerk
  useEffect(() => {
    async function loadClerkToken() {
      if (clerkUser && isClerkLoaded) {
        try {
          const token = await getClerkToken();
          setB2CToken(token);
          setUserType('b2c');
        } catch (e) {
          console.error('Failed to get Clerk token:', e);
        }
      }
      if (isClerkLoaded) {
        setIsLoading(false);
      }
    }
    loadClerkToken();
  }, [clerkUser, isClerkLoaded, getClerkToken]);

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

  // Logout (both B2B and B2C)
  const logout = async () => {
    // Clear B2B
    localStorage.removeItem('worksim_token');
    setToken(null);
    setUser(null);

    // Clear B2C (Clerk)
    if (clerkUser) {
      await clerkSignOut();
    }
    setB2CToken(null);

    // Reset type
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      b2cUser,
      b2cToken,
      isClerkLoaded,
      userType,
      isLoading,
      login,
      register,
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
