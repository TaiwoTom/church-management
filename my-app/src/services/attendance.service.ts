import apiClient from '@/lib/api-client';
import { Attendance, AttendanceFilters, AttendanceStats, PaginatedResponse } from '@/types';

export const attendanceService = {
  // Get all attendance records
  getAttendance: async (filters?: AttendanceFilters, page = 1, limit = 50): Promise<PaginatedResponse<Attendance>> => {
    const params = { ...filters, page, limit };
    const response = await apiClient.get('/attendance', { params });
    return response.data;
  },

  // Get attendance by date
  getAttendanceByDate: async (date: string): Promise<Attendance[]> => {
    const response = await apiClient.get(`/attendance/date/${date}`);
    return response.data;
  },

  // Get user attendance
  getUserAttendance: async (userId: string): Promise<Attendance[]> => {
    const response = await apiClient.get(`/attendance/user/${userId}`);
    return response.data;
  },

  // Mark attendance
  markAttendance: async (data: { userId: string; sundayServiceId: string; status: string; notes?: string }): Promise<Attendance> => {
    const response = await apiClient.post('/attendance/mark', data);
    return response.data;
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (attendanceData: Array<{ userId: string; sundayServiceId: string; status: string }>): Promise<Attendance[]> => {
    const response = await apiClient.post('/attendance/bulk', { attendances: attendanceData });
    return response.data;
  },

  // Update attendance
  updateAttendance: async (id: string, data: Partial<Attendance>): Promise<Attendance> => {
    const response = await apiClient.put(`/attendance/${id}`, data);
    return response.data;
  },

  // Delete attendance
  deleteAttendance: async (id: string): Promise<void> => {
    await apiClient.delete(`/attendance/${id}`);
  },

  // Get attendance statistics
  getAttendanceStats: async (): Promise<AttendanceStats> => {
    const response = await apiClient.get('/attendance/stats');
    return response.data;
  },

  // Get attendance analytics
  getAttendanceAnalytics: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = { startDate, endDate };
    const response = await apiClient.get('/attendance/analytics', { params });
    return response.data;
  },
};
