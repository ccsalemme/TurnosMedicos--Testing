import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { api } from '../lib/api';
import { User } from '../types/domain';

const TOKEN_KEY = 'tm_access_token';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  registerPatient: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    document: string;
    birthDate: string;
    phone: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateMyProfile: (input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthDate?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persistToken = (nextToken: string | null) => {
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    const profile = await api.me(token);
    setUser(profile);
  }, [token]);

  useEffect(() => {
    const bootstrap = async () => {
      console.log('[AuthContext] Bootstrap - Token actual:', token);
      if (!token) {
        console.log('[AuthContext] No hay token, saltando bootstrap');
        setLoading(false);
        return;
      }

      try {
        console.log('[AuthContext] Obteniendo perfil del usuario...');
        const profile = await api.me(token);
        console.log('[AuthContext] Perfil obtenido:', profile);
        setUser(profile);
      } catch (err) {
        console.error('[AuthContext] Error obteniendo perfil:', err);
        persistToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    console.log('[AuthContext] Intentando login con email:', input.email);
    const result = await api.login(input);
    console.log('[AuthContext] Login exitoso, token:', result.accessToken.substring(0, 20) + '...');
    console.log('[AuthContext] Usuario recibido:', result.user);
    persistToken(result.accessToken);
    setUser(result.user);
    console.log('[AuthContext] Estado actualizado - Usuario:', result.user);
  }, []);

  const registerPatient = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      document: string;
      birthDate: string;
      phone: string;
    }) => {
      const result = await api.registerPatient(input);
      persistToken(result.accessToken);
      setUser(result.user);
    },
    []
  );

  const updateMyProfile = useCallback(
    async (input: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      birthDate?: string;
    }) => {
      if (!token) {
        return;
      }

      const updated = await api.updateMyProfile(token, input);
      setUser(updated);
    },
    [token]
  );

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      registerPatient,
      refreshUser,
      updateMyProfile,
      logout
    }),
    [login, loading, logout, refreshUser, registerPatient, token, updateMyProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
};
