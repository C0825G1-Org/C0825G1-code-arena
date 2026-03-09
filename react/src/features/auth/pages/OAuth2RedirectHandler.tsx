import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../hooks/useAuth';

export const OAuth2RedirectHandler = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleLoginSuccess } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const regToken = searchParams.get('regToken');

        if (token) {
            try {
                // Decode the full AuthToken to extract user info
                // We assume the token has id, username, fullName, email, role claims
                // But normally we'd decode it, or call a /me endpoint
                const decoded: any = jwtDecode(token);

                // Because we rely on the backend token structure, we extract authorities mapping if any, 
                // but since the backend only built claims with authorities, we might need a quick fallback.
                const userObj = {
                    id: decoded.id || 0,
                    username: decoded.sub,
                    email: decoded.email || '',
                    fullName: decoded.fullName || '',
                    role: decoded.authorities ? decoded.authorities[0].authority : (decoded.role || 'user'),
                    avatarUrl: decoded.avatarUrl || null
                };

                handleLoginSuccess({ ...userObj, token }, `Welcome back, ${userObj.fullName}!`);
            } catch (e) {
                toast.error('Token không hợp lệ!');
                navigate('/login');
            }
        } else if (regToken) {
            // New user from Google! Must complete profile.
            // Save the regToken safely to session storage
            sessionStorage.setItem('oauth2_reg_token', regToken);
            toast.info('Vui lòng hoàn thiện hồ sơ để tiếp tục.');
            navigate('/complete-profile');
        } else {
            toast.error('Đăng nhập thất bại.');
            navigate('/login');
        }
    }, [searchParams, navigate, handleLoginSuccess]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-white text-xl animate-pulse">
                Đang xử lý đăng nhập...
            </div>
        </div>
    );
};
