import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAdmin, RequireAuth } from '../auth/RequireAuth';
import { AppShell } from './AppShell';
import { Landing } from './Landing';
import { RouteError } from '../components/RouteError';
import { Login } from '../pages/Login';
import { MyBrand } from '../pages/MyBrand';
import { BrandBrain } from '../pages/BrandBrain';
import { MyAssets } from '../pages/MyAssets';
import { MyApps } from '../pages/MyApps';
import { Calendar } from '../pages/Calendar';
import { MyPlan } from '../pages/MyPlan';
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
import { AdminWhatsapp } from '../pages/admin/Whatsapp';
import { Accesses } from '../pages/Accesses';
import { PublicReview } from '../pages/PublicReview';
import { PublicUpload } from '../pages/PublicUpload';
import { PublicShowcase } from '../pages/PublicShowcase';
import { Settings } from '../pages/Settings';
import { Onboarding } from '../pages/Onboarding';
import { Report } from '../pages/Report';
import { AdminOnboarding } from '../pages/admin/Onboarding';
import { AdminBilling } from '../pages/admin/Billing';
import { AdminCosts } from '../pages/admin/Costs';
import { AdminAiHealth } from '../pages/admin/AiHealth';
import { Pay, PaySuccess } from '../pages/Pay';
import { AdminToday } from '../pages/admin/Today';
import { Learn, LearnLesson } from '../pages/Learn';
import { AdminCriterio } from '../pages/admin/Criterio';
import { AdminStudio } from '../pages/admin/Studio';
import { Connect } from '../pages/Connect';
import { Account } from '../pages/Account';
import { OpenFile } from '../pages/OpenFile';
export const router = createBrowserRouter([
    { path: '/login', element: _jsx(Login, {}), errorElement: _jsx(RouteError, {}) },
    { path: '/p/:token', element: _jsx(PublicProposal, {}), errorElement: _jsx(RouteError, {}) },
    { path: '/r/:token', element: _jsx(PublicReview, {}), errorElement: _jsx(RouteError, {}) },
    { path: '/u/:token', element: _jsx(PublicUpload, {}), errorElement: _jsx(RouteError, {}) },
    { path: '/s/:token', element: _jsx(PublicShowcase, {}), errorElement: _jsx(RouteError, {}) },
    {
        element: _jsx(RequireAuth, {}),
        errorElement: _jsx(RouteError, {}),
        children: [
            // Consent for the remote Braindy connector (Claude): outside the app shell, like the login.
            { path: 'conectar', element: _jsx(Connect, {}) },
            { path: 'open/:brandId/:assetId', element: _jsx(OpenFile, {}) },
            {
                element: _jsx(AppShell, {}),
                children: [
                    { index: true, element: _jsx(Landing, {}) },
                    { path: 'home', element: _jsx(Home, {}) },
                    { path: 'brand', element: _jsx(MyBrand, {}) },
                    { path: 'brand/docs', element: _jsx(Navigate, { to: "/brand/visual", replace: true }) },
                    { path: 'brand/brain', element: _jsx(BrandBrain, {}) },
                    { path: 'brand/:view', element: _jsx(MyBrand, {}) },
                    { path: 'assets', element: _jsx(MyAssets, {}) },
                    { path: 'apps', element: _jsx(MyApps, {}) },
                    { path: 'calendar', element: _jsx(Calendar, {}) },
                    { path: 'research', element: _jsx(MyResearch, {}) },
                    { path: 'ask', element: _jsx(Navigate, { to: "/requests?new=1", replace: true }) },
                    { path: 'requests', element: _jsx(Requests, {}) },
                    { path: 'requests/approve', element: _jsx(BatchApprove, {}) },
                    { path: 'requests/:id', element: _jsx(RequestDetail, {}) },
                    { path: 'accesses', element: _jsx(Accesses, {}) },
                    { path: 'settings', element: _jsx(Settings, {}) },
                    { path: 'onboarding', element: _jsx(Onboarding, {}) },
                    { path: 'report', element: _jsx(Report, {}) },
                    { path: 'learn', element: _jsx(Learn, {}) },
                    { path: 'learn/:id', element: _jsx(LearnLesson, {}) },
                    { path: 'plan', element: _jsx(MyPlan, {}) },
                    { path: 'account', element: _jsx(Account, {}) },
                    { path: 'pay', element: _jsx(Pay, {}) },
                    { path: 'pay/success', element: _jsx(PaySuccess, {}) },
                    {
                        element: _jsx(RequireAdmin, {}),
                        children: [
                            { path: 'admin/today', element: _jsx(AdminToday, {}) },
                            { path: 'admin/studio', element: _jsx(AdminStudio, {}) },
                            { path: 'admin/brands', element: _jsx(AdminBrands, {}) },
                            { path: 'admin/criterio', element: _jsx(AdminCriterio, {}) },
                            { path: 'admin/proposals', element: _jsx(AdminProposals, {}) },
                            { path: 'admin/proposals/:id', element: _jsx(ProposalDetail, {}) },
                            { path: 'team', element: _jsx(AdminTeam, {}) },
                            { path: 'admin/whatsapp', element: _jsx(AdminWhatsapp, {}) },
                            { path: 'admin/onboarding', element: _jsx(AdminOnboarding, {}) },
                            { path: 'admin/billing', element: _jsx(AdminBilling, {}) },
                            { path: 'admin/costs', element: _jsx(AdminCosts, {}) },
                            { path: 'admin/ai', element: _jsx(AdminAiHealth, {}) },
                        ],
                    },
                ],
            },
        ],
    },
    { path: '*', element: _jsx(Navigate, { to: "/", replace: true }) },
]);
