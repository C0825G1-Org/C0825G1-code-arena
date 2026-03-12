import axios from 'axios';

const axiosClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thêm token vào các request (ngoại trừ login/register có thể không có token)
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Xử lý chung các lỗi Response (như 401 Unauthorized -> Đăng xuất)
axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const requestUrl = error.config?.url || '';
        const isAuthRequest = requestUrl.startsWith('/auth/');

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } else if (error.response?.status === 423) {
            // Tài khoản bị khoá
            window.dispatchEvent(new Event('auth:locked'));
        } else if (error.response?.status === 403 && !isAuthRequest) {
            window.location.href = '/err/403';
        } else if (error.response?.status >= 500 && !isAuthRequest) {
            window.location.href = '/err/500';
        }
        return Promise.reject(error);
    }
);

export { axiosClient };
export default axiosClient;
