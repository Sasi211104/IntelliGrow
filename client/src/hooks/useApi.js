import { useAuth } from "@clerk/clerk-react";

export const useApi = () => {
    const { getToken } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    const fetcher = async (url, options = {}) => {
        const token = await getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const res = await fetch(`${API_URL}${url}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const error = new Error(errorData.error || 'API request failed');
            error.response = {
                status: res.status,
                data: errorData
            };
            throw error;
        }

        return res.json();
    };

    return {
        get: (url) => fetcher(url, { method: 'GET' }),
        post: (url, body) => fetcher(url, { method: 'POST', body: JSON.stringify(body) }),
        put: (url, body) => fetcher(url, { method: 'PUT', body: JSON.stringify(body) }),
        delete: (url) => fetcher(url, { method: 'DELETE' }),
    };
};
