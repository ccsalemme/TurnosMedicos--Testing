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
import { logger } from '../lib/logger';
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
      logger.debug('AuthContext bootstrap iniciado', { hasToken: !!token });
      if (!token) {
        logger.debug('No hay token, saltando bootstrap');
        setLoading(false);
        return;
      }

      try {
        logger.info('Obteniendo perfil del usuario autenticado');
        const profile = await api.me(token);
        logger.logAuthEvent('Usuario autenticado', profile.id);
        setUser(profile);
      } catch (err) {
        logger.error('Error obteniendo perfil del usuario', err instanceof Error ? err : undefined);
        persistToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    logger.info('Intentando login', { email: input.email });
    try {
      const result = await api.login(input);
      logger.logAuthEvent('Login exitoso', result.user.id);
      logger.info('Usuario autenticado', { 
        userId: result.user.id, 
        role: result.user.role,
        email: result.user.email 
      });
      persistToken(result.accessToken);
      setUser(result.user);
    } catch (error) {
      logger.error('Error en login', error instanceof Error ? error : undefined, { email: input.email });
      throw error;
    }
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
      logger.info('Registrando nuevo paciente', { email: input.email });
      try {
        const result = await api.registerPatient(input);
        logger.logAuthEvent('Registro exitoso', result.user.id);
        logger.info('Paciente registrado', { userId: result.user.id, email: result.user.email });
        persistToken(result.accessToken);
        setUser(result.user);
      } catch (error) {
        logger.error('Error en registro', error instanceof Error ? error : undefined, { email: input.email });
        throw error;
      }
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
        logger.warn('Intento de actualizar perfil sin token');
        return;
      }

      logger.info('Actualizando perfil de usuario', { fields: Object.keys(input) });
      try {
        const updated = await api.updateMyProfile(token, input);
        logger.info('Perfil actualizado exitosamente', { userId: updated.id });
        setUser(updated);
      } catch (error) {
        logger.error('Error actualizando perfil', error instanceof Error ? error : undefined);
        throw error;
      }
    },
    [token]
  );

  const logout = useCallback(() => {
    logger.logAuthEvent('Logout', user?.id);
    logger.info('Usuario cerrando sesión');
    persistToken(null);
    setUser(null);
  }, [user]);

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
