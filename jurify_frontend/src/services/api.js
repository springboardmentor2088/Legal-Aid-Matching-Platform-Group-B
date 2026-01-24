import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for refresh token logic
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            // If the error is from the login endpoint, don't try to refresh or redirect
            if (originalRequest.url.includes('/auth/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                // No refresh token, force logout
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${BASE_URL}/auth/refresh`, {
                    refreshToken: refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                processQueue(null, accessToken);

                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const api = {
    get: async (endpoint) => {
        const response = await axiosInstance.get(endpoint);
        return response.data;
    },
    post: async (endpoint, data, config = {}) => {
        const response = await axiosInstance.post(endpoint, data, config);
        return response.data;
    },
    put: async (endpoint, data) => {
        const response = await axiosInstance.put(endpoint, data);
        return response.data;
    },
    patch: async (endpoint, data) => {
        const response = await axiosInstance.patch(endpoint, data);
        return response.data;
    },
    delete: async (endpoint) => {
        const response = await axiosInstance.delete(endpoint);
        return response.data;
    },
    getLegalCategories: async () => {
        const response = await axiosInstance.get('/categories');
        return response.data;
    }
};

export default api;

