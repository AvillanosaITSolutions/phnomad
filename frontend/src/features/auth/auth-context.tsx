import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from 'react';
import { apiFetch } from '../../lib/api';
import type { User } from '../../types/models';

const TOKEN_KEY = 'visa_reminder_token';

interface AuthContextValue {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    loginWithGoogleToken: (idToken: string) => Promise<void>;
    setAccessToken: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadMe = useCallback(async (currentToken: string | null) => {
        if (!currentToken) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const profile = await apiFetch<User>('/auth/me', undefined, currentToken);
            setUser(profile);
        } catch {
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMe(token);
    }, [loadMe, token]);

    const loginWithGoogleToken = useCallback(async (idToken: string) => {
        const response = await apiFetch<{ accessToken: string }>(
            '/auth/google',
            {
                method: 'POST',
                body: JSON.stringify({ idToken }),
            },
            null,
        );

        localStorage.setItem(TOKEN_KEY, response.accessToken);
        setToken(response.accessToken);
        await loadMe(response.accessToken);
    }, [loadMe]);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const setAccessToken = useCallback((accessToken: string) => {
        localStorage.setItem(TOKEN_KEY, accessToken);
        setToken(accessToken);
    }, []);

    const value = useMemo(
        () => ({ token, user, isLoading, loginWithGoogleToken, setAccessToken, logout }),
        [isLoading, loginWithGoogleToken, logout, setAccessToken, token, user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
