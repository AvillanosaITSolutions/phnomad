import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth-context';

export function AdminRoute() {
    const { token, user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-8 text-center text-slate-600">Loading...</div>;
    }

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (user?.role?.toLowerCase() !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
