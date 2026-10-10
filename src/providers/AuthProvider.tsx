import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null | any; // allow custom user
  isAdmin: boolean;
  isKawasdal: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isKawasdal: false,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isKawasdal, setIsKawasdal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionStr = localStorage.getItem('appSession');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setUser(session.user);
        setIsAdmin(session.user?.role === 'admin');
        setIsKawasdal(session.user?.role === 'kawasdal');
      } catch (e) {
        localStorage.removeItem('appSession');
      }
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
    setIsKawasdal(false);
    localStorage.removeItem('appSession');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isKawasdal, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
