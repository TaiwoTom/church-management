import apiClient from '@/lib/api-client';
import { Ministry, PaginatedResponse } from '@/types';

// Helper to extract data from API response
const extractData = <T>(response: any): T => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
};

export const ministryService = {
  // Get all ministries
  getMinistries: async (page = 1, limit = 20): Promise<PaginatedResponse<Ministry>> => {
    const response = await apiClient.get('/ministries', { params: { page, limit } });
    const data = extractData<any>(response);

    // Handle both paginated and array responses
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      };
    }

    // If it's already paginated format
    if (data && Array.isArray(data.data)) {
      return data;
    }

    // If data has ministries array
    if (data && Array.isArray(data.ministries)) {
      return {
        data: data.ministries,
        total: data.total || data.ministries.length,
        page: data.page || 1,
        limit: data.limit || data.ministries.length,
        totalPages: data.totalPages || 1,
      };
    }

    return {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };
  },

  // Get ministry by ID
  getMinistryById: async (id: string): Promise<Ministry> => {
    const response = await apiClient.get(`/ministries/${id}`);
    return extractData(response);
  },

  // Create ministry
  createMinistry: async (data: Partial<Ministry>): Promise<Ministry> => {
    const response = await apiClient.post('/ministries', data);
    return extractData(response);
  },

  // Update ministry
  updateMinistry: async (id: string, data: Partial<Ministry>): Promise<Ministry> => {
    const response = await apiClient.put(`/ministries/${id}`, data);
    return extractData(response);
  },

  // Delete ministry
  deleteMinistry: async (id: string): Promise<void> => {
    await apiClient.delete(`/ministries/${id}`);
  },

  // Join ministry
  joinMinistry: async (id: string): Promise<void> => {
    await apiClient.post(`/ministries/${id}/join`);
  },

  // Leave ministry
  leaveMinistry: async (id: string): Promise<void> => {
    await apiClient.post(`/ministries/${id}/leave`);
  },

  // Add member to ministry
  addMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.post(`/ministries/${id}/members`, { userId });
  },

  // Remove member from ministry
  removeMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/ministries/${id}/members/${userId}`);
  },

  // Get ministry statistics
  getMinistryStats: async (): Promise<any> => {
    const response = await apiClient.get('/ministries/stats');
    return extractData(response);
  },
};
