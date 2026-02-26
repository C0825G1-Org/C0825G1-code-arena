import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api',
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
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Sau khi xóa token, thường frontend sẽ tự đá về login qua state auth
        } else if (error.response?.status === 403) {
            // Lỗi forbidden từ API
            window.location.href = '/err/403';
        } else if (error.response?.status >= 500) {
            // Lỗi server crash
            window.location.href = '/err/500';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
