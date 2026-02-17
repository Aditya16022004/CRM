import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data as { accessToken: string };
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),
    adminLogin: (email: string, password: string) => apiClient.post('/auth/admin/login', { email, password }),
    logout: () => apiClient.post('/auth/logout'),
    refresh: () => apiClient.post('/auth/refresh'),
    me: () => apiClient.get('/auth/me'),
  },

  notifications: {
    list: () => apiClient.get('/notifications'),
    markRead: () => apiClient.post('/notifications/read'),
    clear: () => apiClient.post('/notifications/clear'),
  },

  profile: {
    requestChange: (fields: string[], reason?: string) =>
      apiClient.post('/profile/request-change', { fields, reason }),
    listRequests: () => apiClient.get('/profile/requests'),
    decideRequest: (id: string, action: 'APPROVE' | 'DENY') =>
      apiClient.post(`/profile/requests/${id}/decision`, { action }),
    updateSelf: (data: any) => apiClient.post('/profile/update', data),
    myApproval: () => apiClient.get('/profile/approval'),
  },

  users: {
    list: () => apiClient.get('/users'),
    create: (data: any) => apiClient.post('/users', data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
    promote: (id: string) => apiClient.post(`/users/${id}/promote`),
    demote: (id: string) => apiClient.post(`/users/${id}/demote`),
  },

  devices: {
    getAll: (params?: any) => apiClient.get('/devices', { params }),
    getById: (id: string) => apiClient.get(`/devices/${id}`),
    create: (data: any) => apiClient.post('/devices', data),
    update: (id: string, data: any) => apiClient.put(`/devices/${id}`, data),
    delete: (id: string) => apiClient.delete(`/devices/${id}`),
  },

  clients: {
    getAll: (params?: any) => apiClient.get('/clients', { params }),
    getById: (id: string) => apiClient.get(`/clients/${id}`),
    create: (data: any) => apiClient.post('/clients', data),
    update: (id: string, data: any) => apiClient.put(`/clients/${id}`, data),
    delete: (id: string) => apiClient.delete(`/clients/${id}`),
  },

  proposals: {
    getAll: (params?: any) => apiClient.get('/proposals', { params }),
    getById: (id: string) => apiClient.get(`/proposals/${id}`),
    create: (data: any) => apiClient.post('/proposals', data),
    update: (id: string, data: any) => apiClient.put(`/proposals/${id}`, data),
    delete: (id: string) => apiClient.delete(`/proposals/${id}`),
    updateStatus: (id: string, status: string) =>
      apiClient.patch(`/proposals/${id}/status`, { status }),
    markPreviewed: (id: string) =>
      apiClient.patch(`/proposals/${id}/previewed`),
  },

  audit: {
    getAll: (params?: any) => apiClient.get('/audit', { params }),
    getByEntity: (entity: string, recordId: string) =>
      apiClient.get(`/audit/${entity}/${recordId}`),
  },

  dashboard: {
    getSummary: () => apiClient.get('/dashboard/summary'),
  },
};

export default apiClient;
