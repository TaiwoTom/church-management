'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { attendanceService, serviceService, sermonService, ministryService } from '@/services';
import { Card, Loading } from '@/components/common';
import {
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function MemberDashboard() {
  const user = useAppSelector(selectUser);

  const { data: upcomingServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['upcomingServices'],
    queryFn: serviceService.getUpcomingServices,
  });

  const { data: recentSermons, isLoading: sermonsLoading } = useQuery({
    queryKey: ['recentSermons'],
    queryFn: () => sermonService.getRecentSermons(5),
  });

  const { data: ministries, isLoading: ministriesLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => ministryService.getMinistries(1, 10),
  });

  const { data: userAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['userAttendance', user?.id],
    queryFn: () => attendanceService.getUserAttendance(user?.id || ''),
    enabled: !!user?.id,
  });

  const isLoading = servicesLoading || sermonsLoading || ministriesLoading || attendanceLoading;

  // Ensure userAttendance is an array
  const attendanceList = Array.isArray(userAttendance) ? userAttendance : [];

  // Calculate attendance rate
  const attendanceRate = attendanceList.length > 0
    ? Math.round((attendanceList.filter(a => a.status === 'PRESENT').length / attendanceList.length) * 100)
    : 0;

  const stats = [
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
      name: 'Years as Member',
      value: user?.dateJoined
        ? Math.floor((Date.now() - new Date(user.dateJoined).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0,
      icon: CalendarIcon,
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
        <p className="mt-1 text-blue-100">Here's what's happening at church this week</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Services */}
        <Card title="Upcoming Services" className="lg:col-span-1">
          <div className="space-y-4">
            {upcomingServices && upcomingServices.length > 0 ? (
              upcomingServices.slice(0, 3).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <CalendarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{service.theme || 'Sunday Service'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(service.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming services</p>
            )}
          </div>
          <Link
            href="/services"
            className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
          >
            View All Services
          </Link>
        </Card>

        {/* Recent Sermons */}
        <Card title="Recent Sermons" className="lg:col-span-1">
          <div className="space-y-4">
            {recentSermons && recentSermons.length > 0 ? (
              recentSermons.slice(0, 3).map((sermon) => (
                <div
                  key={sermon.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{sermon.title}</p>
                      <p className="text-sm text-gray-500">{sermon.speaker}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(sermon.date).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sermons available</p>
            )}
          </div>
          <Link
            href="/sermons"
            className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
          >
            View All Sermons
          </Link>
        </Card>
      </div>

      {/* Ministries Section */}
      <Card title="Explore Ministries">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ministries?.data && ministries.data.length > 0 ? (
            ministries.data.slice(0, 6).map((ministry) => (
              <div
                key={ministry.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{ministry.name}</p>
                    <p className="text-xs text-gray-500">{ministry.members?.length || 0} members</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-gray-500 text-center py-4">No ministries available</p>
          )}
        </div>
        <Link
          href="/ministries"
          className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
        >
          View All Ministries
        </Link>
      </Card>

      {/* Quick Actions */}
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
            <CalendarIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">View Calendar</span>
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
    </div>
  );
}
