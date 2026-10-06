import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAdmin, RequireAuth } from '../auth/RequireAuth';
import { AppShell } from './AppShell';
import { Login } from '../pages/Login';
import { Placeholder } from '../pages/Placeholder';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/brand" replace /> },
          { path: 'brand', element: <Placeholder title="My brand" phase={1} /> },
          { path: 'assets', element: <Placeholder title="My assets" phase={1} /> },
          { path: 'ask', element: <Placeholder title="Ask for something" phase={2} /> },
          { path: 'requests', element: <Placeholder title="My requests" phase={2} /> },
          { path: 'accesses', element: <Placeholder title="Accesses" phase={3} /> },
          {
            element: <RequireAdmin />,
            children: [{ path: 'team', element: <Placeholder title="Team" phase={4} /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
