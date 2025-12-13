import apiClient from '@/lib/api-client';
import { Attendance, AttendanceFilters, AttendanceStats, PaginatedResponse } from '@/types';

// Helper to extract data from API response
const extractData = <T>(response: any): T => {
  // Handle both { success, data } and direct response formats
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response.data;
};

export const attendanceService = {
  // Get all attendance records
  getAttendance: async (filters?: AttendanceFilters, page = 1, limit = 50): Promise<PaginatedResponse<Attendance>> => {
    const params = { ...filters, page, limit };
    const response = await apiClient.get('/attendance', { params });
    return extractData(response);
  },

  // Get attendance by date
  getAttendanceByDate: async (date: string): Promise<Attendance[]> => {
    const response = await apiClient.get(`/attendance/date/${date}`);
    return extractData(response);
  },

  // Get user attendance
  getUserAttendance: async (userId: string): Promise<Attendance[]> => {
    const response = await apiClient.get(`/attendance/user/${userId}`);
    const data = extractData<Attendance[] | any>(response);
    // Ensure we return an array
    return Array.isArray(data) ? data : (data?.records || data?.attendance || []);
  },

  // Mark attendance
  markAttendance: async (data: { userId: string; serviceId: string; checkInTime?: string }): Promise<Attendance> => {
    const response = await apiClient.post('/attendance', data);
    return extractData(response);
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (attendanceData: Array<{ userId: string; serviceId: string }>): Promise<Attendance[]> => {
    const response = await apiClient.post('/attendance/bulk', { attendances: attendanceData });
    return extractData(response);
  },

  // Update attendance
  updateAttendance: async (id: string, data: Partial<Attendance>): Promise<Attendance> => {
    const response = await apiClient.put(`/attendance/${id}`, data);
    return extractData(response);
  },

  // Delete attendance
  deleteAttendance: async (id: string): Promise<void> => {
    await apiClient.delete(`/attendance/${id}`);
  },

  // Checkout
  checkOut: async (id: string, checkOutTime?: string): Promise<Attendance> => {
    const response = await apiClient.post(`/attendance/${id}/checkout`, { checkOutTime });
    return extractData(response);
  },

  // Get attendance statistics
  getAttendanceStats: async (): Promise<AttendanceStats> => {
    const response = await apiClient.get('/attendance/stats');
    return extractData(response);
  },

  // Get attendance analytics
  getAttendanceAnalytics: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = { startDate, endDate };
    const response = await apiClient.get('/attendance/analytics', { params });
    return extractData(response);
  },

  // Get service attendance
  getServiceAttendance: async (serviceId: string): Promise<Attendance[]> => {
    const response = await apiClient.get('/attendance/service', { params: { serviceId } });
    const data = extractData<Attendance[] | any>(response);
    return Array.isArray(data) ? data : (data?.records || data?.attendance || []);
  },

  // Get user attendance stats
  getUserAttendanceStats: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/attendance/user/${userId}/stats`);
    return extractData(response);
  },
};
