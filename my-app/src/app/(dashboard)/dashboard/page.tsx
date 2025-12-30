'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectUserRole } from '@/store/slices/authSlice';
import { attendanceService, serviceService } from '@/services';
import { Card, Loading } from '@/components/common';
import {
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { UserRole } from '@/types';
import apiClient from '@/lib/api-client';

// Helper to check if user role matches allowed roles (case-insensitive)
const roleMatches = (userRole: string | UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  const normalizedUserRole = String(userRole).toLowerCase();
  return allowedRoles.some(role => String(role).toLowerCase() === normalizedUserRole);
};

export default function MemberDashboard() {
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);

  const isStaffOrAdmin = roleMatches(userRole, [UserRole.STAFF, UserRole.ADMIN]);

  const { data: currentService, isLoading: serviceLoading } = useQuery({
    queryKey: ['currentService'],
    queryFn: serviceService.getCurrentService,
  });

  const { data: userAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['userAttendance', user?.id],
    queryFn: () => attendanceService.getUserAttendance(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: attendanceStats, isLoading: statsLoading } = useQuery({
    queryKey: ['attendanceStats'],
    queryFn: attendanceService.getAttendanceStats,
    enabled: isStaffOrAdmin,
  });

  const { data: recentNotes, isLoading: notesLoading } = useQuery({
    queryKey: ['recentNotes'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/notes', { params: { limit: 5 } });
        const data = response.data;
        return Array.isArray(data) ? data : (data?.data || []);
      } catch {
        return [];
      }
    },
    enabled: isStaffOrAdmin,
  });

  const isLoading = serviceLoading || attendanceLoading || (isStaffOrAdmin && (statsLoading || notesLoading));

  // Ensure userAttendance is an array
  const attendanceList = Array.isArray(userAttendance) ? userAttendance : [];

  // Calculate attendance rate
  const attendanceRate = attendanceList.length > 0
    ? Math.round((attendanceList.filter(a => a.status === 'PRESENT').length / attendanceList.length) * 100)
    : 0;

  const stats = isStaffOrAdmin ? [
    {
      name: 'Today\'s Check-ins',
      value: attendanceStats?.todayCount || 0,
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Members',
      value: attendanceStats?.totalMembers || 0,
      icon: UserGroupIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Average Attendance',
      value: `${attendanceStats?.averageAttendance || 0}%`,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'This Week',
      value: attendanceStats?.weekCount || 0,
      icon: CheckCircleIcon,
      color: 'bg-orange-500',
    },
  ] : [
    {
      name: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: ChartBarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Services Attended',
      value: attendanceList.filter(a => a.status === 'PRESENT').length,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Ministries Joined',
      value: user?.ministries?.length || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Member Since',
      value: user?.dateJoined
        ? new Date(user.dateJoined).getFullYear()
        : 'N/A',
      icon: ClockIcon,
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return <Loading fullScreen text="Loading your dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="mt-1 text-blue-100">
          {isStaffOrAdmin
            ? 'Manage your church operations from here'
            : 'Here\'s what\'s happening at church this week'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="flex items-center space-x-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Staff/Admin Quick Actions */}
      {isStaffOrAdmin && (
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/people/checkin"
              className="flex flex-col items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
            >
              <ClipboardDocumentCheckIcon className="h-10 w-10 text-blue-600 mb-3" />
              <span className="text-sm font-medium text-gray-700">Check-in</span>
              <span className="text-xs text-gray-500 mt-1">Register attendance</span>
            </Link>
            <Link
              href="/message/email"
              className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-100"
            >
              <EnvelopeIcon className="h-10 w-10 text-purple-600 mb-3" />
              <span className="text-sm font-medium text-gray-700">Send Email</span>
              <span className="text-xs text-gray-500 mt-1">Message groups</span>
            </Link>
            <Link
              href="/message/text"
              className="flex flex-col items-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
            >
              <DevicePhoneMobileIcon className="h-10 w-10 text-green-600 mb-3" />
              <span className="text-sm font-medium text-gray-700">Send SMS</span>
              <span className="text-xs text-gray-500 mt-1">Text members</span>
            </Link>
            <Link
              href="/notepad/notes"
              className="flex flex-col items-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-100"
            >
              <PencilSquareIcon className="h-10 w-10 text-orange-600 mb-3" />
              <span className="text-sm font-medium text-gray-700">New Note</span>
              <span className="text-xs text-gray-500 mt-1">Create a note</span>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Service / Check-in Status */}
        <Card title={isStaffOrAdmin ? "Today's Service" : "Current Service"}>
          {currentService ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {currentService.theme || 'Sunday Service'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(currentService.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-green-700 text-sm font-medium">Active</span>
                  </div>
                </div>
              </div>
              {isStaffOrAdmin && (
                <Link
                  href="/people/checkin"
                  className="block w-full text-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Go to Check-in
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No active service at the moment</p>
            </div>
          )}
        </Card>

        {/* Recent Notes (Staff/Admin) or Attendance History (Members) */}
        {isStaffOrAdmin ? (
          <Card title="Recent Notes">
            <div className="space-y-3">
              {recentNotes && recentNotes.length > 0 ? (
                recentNotes.slice(0, 4).map((note: any) => (
                  <div
                    key={note.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {note.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No notes yet</p>
                </div>
              )}
            </div>
            <Link
              href="/notepad/notes"
              className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              View All Notes
            </Link>
          </Card>
        ) : (
          <Card title="Your Attendance">
            <div className="space-y-3">
              {attendanceList.length > 0 ? (
                attendanceList.slice(0, 4).map((attendance, index) => (
                  <div
                    key={attendance.id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        attendance.status === 'PRESENT' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {attendance.status === 'PRESENT' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ClockIcon className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {attendance.service?.theme || 'Sunday Service'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attendance.date && new Date(attendance.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      attendance.status === 'PRESENT'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {attendance.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No attendance records yet</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Staff/Admin - History Links */}
      {isStaffOrAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/people/history"
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">People History</p>
                <p className="text-sm text-gray-500">View check-in records</p>
              </div>
            </div>
          </Link>
          <Link
            href="/notepad/history"
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">Notes History</p>
                <p className="text-sm text-gray-500">View past notes</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">Manage members</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Member Quick Actions */}
      {!isStaffOrAdmin && (
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/profile"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <UserGroupIcon className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Update Profile</span>
            </Link>
            <Link
              href="/sermons"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <DocumentTextIcon className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Browse Sermons</span>
            </Link>
            <Link
              href="/services"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ClockIcon className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">View Services</span>
            </Link>
            <Link
              href="/ministries"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <UserGroupIcon className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Join Ministry</span>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
