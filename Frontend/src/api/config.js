const API_BASE_URL = 'http://localhost:5001/api';

export const endpoints = {
    auth: {
        login: `${API_BASE_URL}/auth/login`,
        register: `${API_BASE_URL}/auth/register`,
    },
    books: {
        list: `${API_BASE_URL}/books`,
        details: (id) => `${API_BASE_URL}/books/${id}`,
        create: `${API_BASE_URL}/books`,
        update: (id) => `${API_BASE_URL}/books/${id}`,
        delete: (id) => `${API_BASE_URL}/books/${id}`,
    },
    requests: {
        list: `${API_BASE_URL}/requests`,
        create: `${API_BASE_URL}/requests`,
        update: (id) => `${API_BASE_URL}/requests/${id}`,
        delete: (id) => `${API_BASE_URL}/requests/${id}`,
    },
    admin: {
        dashboard: `${API_BASE_URL}/admin/dashboard`,
        users: `${API_BASE_URL}/admin/users`,
    }
};

export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}; 