import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth-context';

export function ProtectedRoute() {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-8 text-center text-slate-600">Loading...</div>;
    }

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
