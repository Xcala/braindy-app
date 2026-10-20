import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAdmin, RequireAuth } from '../auth/RequireAuth';
import { AppShell } from './AppShell';
import { Login } from '../pages/Login';
import { Placeholder } from '../pages/Placeholder';
import { MyBrand } from '../pages/MyBrand';
import { MyAssets } from '../pages/MyAssets';
import { AdminBrands } from '../pages/admin/Brands';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/brand" replace /> },
          { path: 'brand', element: <MyBrand /> },
          { path: 'assets', element: <MyAssets /> },
          { path: 'ask', element: <Placeholder title="nav.ask" phase={2} /> },
          { path: 'requests', element: <Placeholder title="nav.requests" phase={2} /> },
          { path: 'accesses', element: <Placeholder title="nav.accesses" phase={3} /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: 'admin/brands', element: <AdminBrands /> },
              { path: 'team', element: <Placeholder title="nav.team" phase={4} /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
