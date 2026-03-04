import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { UserHomePage } from '../features/user/home/pages/UserHomePage';
import { ListPage as UserProblemListPage } from '../features/user/problem/ListPage';
import { ModDashboardPage } from '../features/moderator/dashboard/pages/ModDashboardPage';
import { ContestManagementPage } from '../features/moderator/contests/pages/ContestManagementPage';
import { ListPage as ModeratorProblemListPage } from '../features/moderator/problem/ListPage';
import { CreatePage as ModeratorProblemCreatePage } from '../features/moderator/problem/CreatePage';
import { EditPage as ModeratorProblemEditPage } from '../features/moderator/problem/EditPage';
import { CreatePage as ModeratorTestcaseCreatePage } from '../features/moderator/testcase/CreatePage';
import { AdminDashboardPage } from '../features/admin/dashboard/pages/AdminDashboardPage';
import { MonitorPanelPage } from '../features/moderator/contests/pages/MonitorPanelPage';
import { ContestResultsPage } from '../features/moderator/contests/pages/result/ContestResultsPage';
import { OAuth2RedirectHandler } from '../features/auth/pages/OAuth2RedirectHandler';
import { CompleteProfilePage } from '../features/auth/pages/CompleteProfilePage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { CodeEditorPage } from '../features/user/code-editor';
import { UserContestsPage } from '../features/user/contests/pages/UserContestsPage';
import { UserContestDetailPage } from '../features/user/contests/pages/UserContestDetailPage';
import { UserContestResultsPage } from '../features/user/contests/pages/UserContestResultsPage';
import { LeaderboardPage } from '../features/user/leaderboard/pages/LeaderboardPage';

// Error Pages
import { Error400Page } from '../features/errors/pages/Error400Page';
import { Error403Page } from '../features/errors/pages/Error403Page';
import { Error404Page } from '../features/errors/pages/Error404Page';
import { Error500Page } from '../features/errors/pages/Error500Page';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    if (!isAuthenticated || !user) {
        return <Navigate to="/err/403" replace />;
    }

    const userRole = user.role?.replace('ROLE_', '').toUpperCase() || '';
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/err/403" replace />;
    }

    return children;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    if (isAuthenticated && user) {
        const userRole = user.role?.replace('ROLE_', '').toUpperCase() || '';
        if (userRole === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
        if (userRole === 'MODERATOR') return <Navigate to="/moderator/dashboard" replace />;
        return <Navigate to="/home" replace />;
    }

    return children;
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <LandingPage />
    },
    {
        path: '/login',
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        )
    },
    {
        path: '/register',
        element: (
            <PublicRoute>
                <RegisterPage />
            </PublicRoute>
        )
    },
    {
        path: '/forgot-password',
        element: (
            <PublicRoute>
                <ForgotPasswordPage />
            </PublicRoute>
        )
    },
    {
        path: '/oauth2/redirect',
        element: (
            <PublicRoute>
                <OAuth2RedirectHandler />
            </PublicRoute>
        )
    },
    {
        path: '/complete-profile',
        element: (
            <PublicRoute>
                <CompleteProfilePage />
            </PublicRoute>
        )
    },
    {
        path: '/home',
        element: (
            <ProtectedRoute allowedRoles={['USER', 'MODERATOR', 'ADMIN']}>
                <UserHomePage />
            </ProtectedRoute>
        )
    },
    {
        path: '/contests',
        element: (
            <ProtectedRoute allowedRoles={['USER', 'MODERATOR', 'ADMIN']}>
                <UserContestsPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/problems',
        element: <UserProblemListPage />
    },
    {
        path: '/contests/:id',
        element: (
            <ProtectedRoute allowedRoles={['USER', 'MODERATOR', 'ADMIN']}>
                <UserContestDetailPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/contests/:id/results',
        element: (
            <ProtectedRoute allowedRoles={['USER', 'MODERATOR', 'ADMIN']}>
                <UserContestResultsPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/leaderboard',
        element: (
            <ProtectedRoute allowedRoles={['USER', 'MODERATOR', 'ADMIN']}>
                <LeaderboardPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/moderator/dashboard',
        element: (
            <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <ModDashboardPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/moderator/contests',
        element: (
            <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <ContestManagementPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/moderator/contests/:id/monitor',
        element: (
            <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <MonitorPanelPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/moderator/problems',
        element: (
            <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <ModeratorProblemListPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/moderator/contests/:id/results',
        element: (
            <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <ContestResultsPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/moderator/problems/create',
        element: (
            <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <ModeratorProblemCreatePage />
            </ProtectedRoute>
        )
    },
    {
        path: '/moderator/problems/edit/:id',
        element: (
            <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <ModeratorProblemEditPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/moderator/testcases',
        element: (
            <ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <ModeratorTestcaseCreatePage />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/dashboard',
        element: (
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/code-editor/:problemId',
        element: <CodeEditorPage /> // Mở tạm để dev, hoặc sẽ cho vào ProtectedRoute sau
    },
    {
        path: '/err/400',
        element: <Error400Page />
    },
    {
        path: '/err/403',
        element: <Error403Page />
    },
    {
        path: '/err/500',
        element: <Error500Page />
    },
    {
        path: '*',
        element: <Error404Page />
    }
]);
