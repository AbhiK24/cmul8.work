import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

// Check if Clerk is properly configured
const CLERK_AVAILABLE = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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

interface OrgInfo {
  org_id: string;
  name: string;
  slug: string;
  role: 'admin' | 'member';
}

type UserType = 'b2b' | 'b2c' | null;

interface AuthContextType {
  // Current user (from Clerk)
  user: ClerkUser | null;
  // User type based on email domain
  userType: UserType;
  // Clerk token for API calls
  token: string | null;
  // Organization info (for B2B users)
  org: OrgInfo | null;
  hasOrg: boolean;
  // Loading states
  isLoading: boolean;
  isClerkLoaded: boolean;
  // For backwards compatibility
  b2cUser: ClerkUser | null;
  b2cToken: string | null;
  // Methods
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Inner provider that uses Clerk hooks (only rendered when Clerk is available)
function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { getToken: getClerkToken, signOut: clerkSignOut } = useClerkAuth();

  const [token, setToken] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgInfo | null>(null);
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

  // Fetch org info from backend
  const fetchOrgInfo = async (clerkToken: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://shell-production-7135.up.railway.app';
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${clerkToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.org) {
          setOrg(data.org);
        } else {
          setOrg(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch org info:', e);
    }
  };

  // Load token from Clerk and fetch org info
  useEffect(() => {
    async function loadToken() {
      if (clerkUser && isClerkLoaded) {
        try {
          const clerkToken = await getClerkToken();
          setToken(clerkToken);
          // Fetch org info for B2B users
          const email = clerkUser.primaryEmailAddress?.emailAddress || '';
          if (!isConsumerEmail(email) && clerkToken) {
            await fetchOrgInfo(clerkToken);
          }
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

  // Refresh org info
  const refreshOrg = async () => {
    const clerkToken = await getToken();
    if (clerkToken) {
      await fetchOrgInfo(clerkToken);
    }
  };

  // Logout
  const logout = async () => {
    await clerkSignOut();
    setToken(null);
    setOrg(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      token,
      org,
      hasOrg: !!org,
      isLoading,
      isClerkLoaded,
      // Backwards compatibility
      b2cUser: userType === 'b2c' ? user : null,
      b2cToken: userType === 'b2c' ? token : null,
      // Methods
      logout,
      getToken,
      refreshOrg,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Fallback provider when Clerk is not configured
function FallbackAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{
      user: null,
      userType: null,
      token: null,
      org: null,
      hasOrg: false,
      isLoading: false,
      isClerkLoaded: false,
      b2cUser: null,
      b2cToken: null,
      logout: async () => {},
      getToken: async () => null,
      refreshOrg: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use Clerk if configured, otherwise use fallback
  if (CLERK_AVAILABLE) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }
  console.warn('Clerk not configured - authentication disabled');
  return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
