import apiClient from '@/lib/api-client';
import { SundayService, PaginatedResponse } from '@/types';

export const serviceService = {
  // Get all services
  getServices: async (page = 1, limit = 20): Promise<PaginatedResponse<SundayService>> => {
    const response = await apiClient.get('/sunday-services', { params: { page, limit } });
    return response.data;
  },

  // Get upcoming services
  getUpcomingServices: async (): Promise<SundayService[]> => {
    const response = await apiClient.get('/sunday-services/upcoming');
    return response.data;
  },

  // Get current service
  getCurrentService: async (): Promise<SundayService> => {
    const response = await apiClient.get('/sunday-services/current');
    return response.data;
  },

  // Get service by ID
  getServiceById: async (id: string): Promise<SundayService> => {
    const response = await apiClient.get(`/sunday-services/${id}`);
    return response.data;
  },

  // Create service
  createService: async (data: Partial<SundayService>): Promise<SundayService> => {
    const response = await apiClient.post('/sunday-services', data);
    return response.data;
  },

  // Update service
  updateService: async (id: string, data: Partial<SundayService>): Promise<SundayService> => {
    const response = await apiClient.put(`/sunday-services/${id}`, data);
    return response.data;
  },

  // Mark service as completed
  completeService: async (id: string): Promise<SundayService> => {
    const response = await apiClient.patch(`/sunday-services/${id}/complete`);
    return response.data;
  },

  // Delete service
  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/sunday-services/${id}`);
  },

  // Get service statistics
  getServiceStats: async (): Promise<any> => {
    const response = await apiClient.get('/sunday-services/stats');
    return response.data;
  },
};
