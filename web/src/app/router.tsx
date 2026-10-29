import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAdmin, RequireAuth } from '../auth/RequireAuth';
import { AppShell } from './AppShell';
import { Landing } from './Landing';
import { RouteError } from '../components/RouteError';
import { Login } from '../pages/Login';
import { MyBrand } from '../pages/MyBrand';
import { MyAssets } from '../pages/MyAssets';
import { MyApps } from '../pages/MyApps';
import { MyResearch } from '../pages/MyResearch';
import { AdminBrands } from '../pages/admin/Brands';
import { AdminProposals } from '../pages/admin/Proposals';
import { ProposalDetail } from '../pages/admin/ProposalDetail';
import { PublicProposal } from '../pages/PublicProposal';
import { Requests } from '../pages/Requests';
import { RequestDetail } from '../pages/RequestDetail';
import { BatchApprove } from '../pages/BatchApprove';
import { Home } from '../pages/Home';
import { AdminTeam } from '../pages/admin/Team';
import { Accesses } from '../pages/Accesses';
import { PublicReview } from '../pages/PublicReview';
import { Settings } from '../pages/Settings';
import { Onboarding } from '../pages/Onboarding';
import { Report } from '../pages/Report';
import { AdminOnboarding } from '../pages/admin/Onboarding';
import { AdminBilling } from '../pages/admin/Billing';
import { Pay, PaySuccess } from '../pages/Pay';
import { AdminToday } from '../pages/admin/Today';
import { Learn, LearnLesson } from '../pages/Learn';
import { AdminCriterio } from '../pages/admin/Criterio';
import { AdminStudio } from '../pages/admin/Studio';
import { Connect } from '../pages/Connect';

export const router = createBrowserRouter([
  { path: '/login', element: <Login />, errorElement: <RouteError /> },
  { path: '/p/:token', element: <PublicProposal />, errorElement: <RouteError /> },
  { path: '/r/:token', element: <PublicReview />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      // Consent for the remote Braindy connector (Claude): outside the app shell, like the login.
      { path: 'conectar', element: <Connect /> },
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Landing /> },
          { path: 'home', element: <Home /> },
          { path: 'brand', element: <MyBrand /> },
          { path: 'assets', element: <MyAssets /> },
          { path: 'apps', element: <MyApps /> },
          { path: 'research', element: <MyResearch /> },
          { path: 'ask', element: <Navigate to="/requests#ask" replace /> },
          { path: 'requests', element: <Requests /> },
          { path: 'requests/approve', element: <BatchApprove /> },
          { path: 'requests/:id', element: <RequestDetail /> },
          { path: 'accesses', element: <Accesses /> },
          { path: 'settings', element: <Settings /> },
          { path: 'onboarding', element: <Onboarding /> },
          { path: 'report', element: <Report /> },
          { path: 'learn', element: <Learn /> },
          { path: 'learn/:id', element: <LearnLesson /> },
          { path: 'pay', element: <Pay /> },
          { path: 'pay/success', element: <PaySuccess /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: 'admin/today', element: <AdminToday /> },
              { path: 'admin/studio', element: <AdminStudio /> },
              { path: 'admin/brands', element: <AdminBrands /> },
              { path: 'admin/criterio', element: <AdminCriterio /> },
              { path: 'admin/proposals', element: <AdminProposals /> },
              { path: 'admin/proposals/:id', element: <ProposalDetail /> },
              { path: 'team', element: <AdminTeam /> },
              { path: 'admin/onboarding', element: <AdminOnboarding /> },
              { path: 'admin/billing', element: <AdminBilling /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
