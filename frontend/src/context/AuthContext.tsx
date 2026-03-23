import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

// Consumer email domains that indicate B2C users
const CONSUMER_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com',
  'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com',
  'protonmail.com', 'proton.me',
  'zoho.com',
  'mail.com',
  'gmx.com', 'gmx.net',
  'yandex.com', 'yandex.ru',
  'qq.com', '163.com', '126.com',
  'tutanota.com',
  'fastmail.com',
  'hey.com',
];

function isConsumerEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return CONSUMER_DOMAINS.includes(domain);
}

// User types
interface ClerkUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

type UserType = 'b2b' | 'b2c' | null;

interface AuthContextType {
  // Current user (from Clerk)
  user: ClerkUser | null;
  // User type based on email domain
  userType: UserType;
  // Clerk token for API calls
  token: string | null;
  // Loading states
  isLoading: boolean;
  isClerkLoaded: boolean;
  // For backwards compatibility
  b2cUser: ClerkUser | null;
  b2cToken: string | null;
  // Methods
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Clerk state
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { getToken: getClerkToken, signOut: clerkSignOut } = useClerkAuth();

  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Clerk user to our user format
  const user: ClerkUser | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName,
    avatar_url: clerkUser.imageUrl,
  } : null;

  // Determine user type based on email domain
  const userType: UserType = user
    ? (isConsumerEmail(user.email) ? 'b2c' : 'b2b')
    : null;

  // Load token from Clerk
  useEffect(() => {
    async function loadToken() {
      if (clerkUser && isClerkLoaded) {
        try {
          const clerkToken = await getClerkToken();
          setToken(clerkToken);
        } catch (e) {
          console.error('Failed to get Clerk token:', e);
        }
      }
      if (isClerkLoaded) {
        setIsLoading(false);
      }
    }
    loadToken();
  }, [clerkUser, isClerkLoaded, getClerkToken]);

  // Get fresh token (for API calls)
  const getToken = async (): Promise<string | null> => {
    if (!clerkUser) return null;
    try {
      return await getClerkToken();
    } catch {
      return null;
    }
  };

  // Logout
  const logout = async () => {
    await clerkSignOut();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      token,
      isLoading,
      isClerkLoaded,
      // Backwards compatibility
      b2cUser: userType === 'b2c' ? user : null,
      b2cToken: userType === 'b2c' ? token : null,
      // Methods
      logout,
      getToken,
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
