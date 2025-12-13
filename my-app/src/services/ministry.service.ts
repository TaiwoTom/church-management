import apiClient from '@/lib/api-client';
import { Ministry, PaginatedResponse } from '@/types';

export const ministryService = {
  // Get all ministries
  getMinistries: async (page = 1, limit = 20): Promise<PaginatedResponse<Ministry>> => {
    const response = await apiClient.get('/ministries', { params: { page, limit } });
    return response.data;
  },

  // Get ministry by ID
  getMinistryById: async (id: string): Promise<Ministry> => {
    const response = await apiClient.get(`/ministries/${id}`);
    return response.data;
  },

  // Create ministry
  createMinistry: async (data: Partial<Ministry>): Promise<Ministry> => {
    const response = await apiClient.post('/ministries', data);
    return response.data;
  },

  // Update ministry
  updateMinistry: async (id: string, data: Partial<Ministry>): Promise<Ministry> => {
    const response = await apiClient.put(`/ministries/${id}`, data);
    return response.data;
  },

  // Delete ministry
  deleteMinistry: async (id: string): Promise<void> => {
    await apiClient.delete(`/ministries/${id}`);
  },

  // Join ministry
  joinMinistry: async (id: string): Promise<void> => {
    await apiClient.post(`/ministries/${id}/join`);
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
    return response.data;
  },
};
