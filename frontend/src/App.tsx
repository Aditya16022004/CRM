import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from './components/ui/Toaster';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProposalBuilderPage } from '@/pages/ProposalBuilderPage';
import { ProposalsListPage } from '@/pages/ProposalsListPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { DevicesPage } from '@/pages/DevicesPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { LoginPage } from '@/pages/LoginPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { ProposalsHistoryPage } from '@/pages/ProposalsHistoryPage';
import { SettingsPage } from './pages/SettingsPage.tsx';

function RequireAuth() {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    {
      element: <RequireAuth />,
      children: [
        {
          path: '/',
          element: <AppLayout />,
          children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: 'dashboard', element: <DashboardPage /> },
            { path: 'proposals', element: <ProposalsListPage /> },
            { path: 'proposals/new', element: <ProposalBuilderPage /> },
            { path: 'history', element: <ProposalsHistoryPage /> },
            { path: 'clients', element: <ClientsPage /> },
            { path: 'devices', element: <DevicesPage /> },
            { path: 'audit', element: <AuditLogsPage /> },
            { path: 'admin/users', element: <UserManagementPage /> },
            { path: 'settings', element: <SettingsPage /> },
          ],
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
