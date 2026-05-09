import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../api/clientApi';

export const AuthContext = createContext(null);

/**
 * Hook pratique — à utiliser dans tous les composants à la place de useContext(AuthContext)
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  }
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true pendant la vérification initiale du token stocké
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ─── Récupère le profil utilisateur depuis l'API ──────────────────────────
  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/accounts/me/');
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  // ─── Vérification du token au démarrage ───────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  // ─── Connexion ────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    const { data } = await api.post('/auth/login/', { email, password });

    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // Le backend renvoie déjà l'objet user dans la réponse (CustomTokenObtainPairSerializer)
    if (data.user) {
      setUser(data.user);
    } else {
      await fetchMe();
    }

    return data;
  }, [fetchMe]);

  // ─── Inscription ──────────────────────────────────────────────────────────
  const register = useCallback(async (payload) => {
    setAuthError(null);
    const { data } = await api.post('/accounts/register/', payload);
    return data;
  }, []);

  // ─── Déconnexion ──────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        // Blackliste le token côté serveur
        await api.post('/accounts/logout/', { refresh: refreshToken });
      }
    } catch {
      // Ignorer les erreurs réseau lors du logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      // Rediriger vers connexion si pas déjà dessus
      if (!window.location.pathname.includes('/connexion')) {
        window.location.href = '/connexion';
      }
    }
  }, []);

  // ─── Mise à jour du profil ────────────────────────────────────────────────
  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.patch('/accounts/me/', payload);
    setUser(data);
    return data;
  }, []);

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    fetchMe,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
