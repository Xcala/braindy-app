import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAdmin, RequireAuth } from '../auth/RequireAuth';
import { AppShell } from './AppShell';
import { Login } from '../pages/Login';
import { MyBrand } from '../pages/MyBrand';
import { MyAssets } from '../pages/MyAssets';
import { AdminBrands } from '../pages/admin/Brands';
import { AdminProposals } from '../pages/admin/Proposals';
import { ProposalDetail } from '../pages/admin/ProposalDetail';
import { PublicProposal } from '../pages/PublicProposal';
import { Ask } from '../pages/Ask';
import { Requests } from '../pages/Requests';
import { RequestDetail } from '../pages/RequestDetail';
import { BatchApprove } from '../pages/BatchApprove';
import { Home } from '../pages/Home';
import { AdminTeam } from '../pages/admin/Team';
import { Accesses } from '../pages/Accesses';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/p/:token', element: <PublicProposal /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/home" replace /> },
          { path: 'home', element: <Home /> },
          { path: 'brand', element: <MyBrand /> },
          { path: 'assets', element: <MyAssets /> },
          { path: 'ask', element: <Ask /> },
          { path: 'requests', element: <Requests /> },
          { path: 'requests/approve', element: <BatchApprove /> },
          { path: 'requests/:id', element: <RequestDetail /> },
          { path: 'accesses', element: <Accesses /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: 'admin/brands', element: <AdminBrands /> },
              { path: 'admin/proposals', element: <AdminProposals /> },
              { path: 'admin/proposals/:id', element: <ProposalDetail /> },
              { path: 'team', element: <AdminTeam /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
