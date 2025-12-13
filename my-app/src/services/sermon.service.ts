import apiClient from '@/lib/api-client';
import { Sermon, SermonFilters, PaginatedResponse } from '@/types';

export const sermonService = {
  // Get all sermons
  getSermons: async (filters?: SermonFilters, page = 1, limit = 20): Promise<PaginatedResponse<Sermon>> => {
    const params = { ...filters, page, limit };
    const response = await apiClient.get('/sermons', { params });
    return response.data;
  },

  // Get recent sermons
  getRecentSermons: async (limit = 10): Promise<Sermon[]> => {
    const response = await apiClient.get('/sermons/recent', { params: { limit } });
    return response.data;
  },

  // Get sermons by series
  getSermonsBySeries: async (series: string): Promise<Sermon[]> => {
    const response = await apiClient.get(`/sermons/series/${series}`);
    return response.data;
  },

  // Get sermon by ID
  getSermonById: async (id: string): Promise<Sermon> => {
    const response = await apiClient.get(`/sermons/${id}`);
    return response.data;
  },

  // Create sermon
  createSermon: async (data: Partial<Sermon>): Promise<Sermon> => {
    const response = await apiClient.post('/sermons', data);
    return response.data;
  },

  // Update sermon
  updateSermon: async (id: string, data: Partial<Sermon>): Promise<Sermon> => {
    const response = await apiClient.put(`/sermons/${id}`, data);
    return response.data;
  },

  // Publish sermon
  publishSermon: async (id: string, published: boolean): Promise<Sermon> => {
    const response = await apiClient.patch(`/sermons/${id}/publish`, { published });
    return response.data;
  },

  // Delete sermon
  deleteSermon: async (id: string): Promise<void> => {
    await apiClient.delete(`/sermons/${id}`);
  },

  // Track sermon view
  trackView: async (id: string): Promise<void> => {
    await apiClient.post(`/sermons/${id}/view`);
  },

  // Track sermon download
  trackDownload: async (id: string): Promise<void> => {
    await apiClient.post(`/sermons/${id}/download`);
  },

  // Get sermon statistics
  getSermonStats: async (): Promise<any> => {
    const response = await apiClient.get('/sermons/stats');
    return response.data;
  },

  // Export sermon as PDF
  exportSermonPDF: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/sermons/${id}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
};
