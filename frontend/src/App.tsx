import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './features/auth/auth-context';
import { ProtectedRoute } from './features/auth/protected-route';
import { LandingPage } from './pages/landing-page';
import { OnboardingPage } from './pages/onboarding-page';
import { DashboardPage } from './pages/dashboard-page';
import { SettingsPage } from './pages/settings-page';
import { AuthCallbackPage } from './pages/auth-callback-page';
import { TopUpPage } from './pages/topup-page';

function RootLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-canvas">
        <Outlet />
      </div>
    </AuthProvider>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'topup', element: <TopUpPage /> },
          { path: 'onboarding', element: <OnboardingPage /> },
          { path: 'visas/:id/edit', element: <OnboardingPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
