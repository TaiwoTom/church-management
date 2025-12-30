'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services';
import { Card, Loading } from '@/components/common';
import {
  CalendarIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface AttendanceRecord {
  id?: string;
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    ministries?: Array<{ id: string; name: string }>;
  };
  date?: string;
  status?: string;
  checkInTime?: string;
}

interface PersonOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ministries: Array<{ id: string; name: string }>;
}

export default function PeopleHistoryPage() {
  const currentDate = new Date();
  const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);

  const [startDate, setStartDate] = useState(
    `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}`
  );
  const [endDate, setEndDate] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [personSearch, setPersonSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const personSearchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (personSearchRef.current && !personSearchRef.current.contains(event.target as Node)) {
        setShowPersonDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Convert month picker values to date strings
  const startDateString = `${startDate}-01`;
  const endDateString = (() => {
    const [year, month] = endDate.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `${endDate}-${String(lastDay).padStart(2, '0')}`;
  })();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendanceHistory', startDateString, endDateString],
    queryFn: () => attendanceService.getAttendanceAnalytics(startDateString, endDateString),
  });

  const { data: allAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['allAttendance', startDateString, endDateString],
    queryFn: () => attendanceService.getAttendance({ startDate: startDateString, endDate: endDateString }, 1, 500),
  });

  // Ensure we have an array
  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    if (!allAttendance) return [];
    if (Array.isArray(allAttendance)) return allAttendance;
    if (allAttendance.data && Array.isArray(allAttendance.data)) return allAttendance.data;
    return [];
  }, [allAttendance]);

  // Get unique people from attendance records for the dropdown
  const uniquePeople: PersonOption[] = useMemo(() => {
    const peopleMap = new Map<string, PersonOption>();
    attendanceRecords.forEach(record => {
      if (record.user?.id && !peopleMap.has(record.user.id)) {
        peopleMap.set(record.user.id, {
          id: record.user.id,
          firstName: record.user.firstName || '',
          lastName: record.user.lastName || '',
          email: record.user.email || '',
          ministries: record.user.ministries || [],
        });
      }
    });
    return Array.from(peopleMap.values());
  }, [attendanceRecords]);

  // Filter people based on search term
  const filteredPeople = useMemo(() => {
    if (!personSearch.trim()) return uniquePeople;
    const search = personSearch.toLowerCase();
    return uniquePeople.filter(person =>
      person.firstName.toLowerCase().includes(search) ||
      person.lastName.toLowerCase().includes(search) ||
      person.email.toLowerCase().includes(search)
    );
  }, [uniquePeople, personSearch]);

  // Calculate attendance stats per person
  const personAttendanceStats = useMemo(() => {
    const stats = new Map<string, { total: number; present: number; ministries: Array<{ id: string; name: string }> }>();

    attendanceRecords.forEach(record => {
      if (record.user?.id) {
        const existing = stats.get(record.user.id) || { total: 0, present: 0, ministries: [] };
        existing.total += 1;
        if (record.status?.toLowerCase() === 'present' || record.status?.toLowerCase() === 'late') {
          existing.present += 1;
        }
        if (record.user.ministries && record.user.ministries.length > 0) {
          existing.ministries = record.user.ministries;
        }
        stats.set(record.user.id, existing);
      }
    });

    return stats;
  }, [attendanceRecords]);

  // Filter records based on selected person and status
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const matchesPerson = !selectedPerson || record.user?.id === selectedPerson.id;
      const matchesStatus = statusFilter === 'all' || record.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesPerson && matchesStatus;
    });
  }, [attendanceRecords, selectedPerson, statusFilter]);

  // Generate month options for dropdowns
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 36; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Present
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Absent
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Late
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getAttendanceRate = (userId: string) => {
    const stats = personAttendanceStats.get(userId);
    if (!stats || stats.total === 0) return '0%';
    const rate = Math.round((stats.present / stats.total) * 100);
    return `${rate}%`;
  };

  const getMinistryCount = (userId: string) => {
    const stats = personAttendanceStats.get(userId);
    return stats?.ministries?.length || 0;
  };

  const getMinistryList = (userId: string) => {
    const stats = personAttendanceStats.get(userId);
    if (!stats?.ministries || stats.ministries.length === 0) return 'None';
    return stats.ministries.map(m => m.name).join(', ');
  };

  const handleSelectPerson = (person: PersonOption) => {
    setSelectedPerson(person);
    setPersonSearch(`${person.firstName} ${person.lastName}`);
    setShowPersonDropdown(false);
  };

  const handleClearPerson = () => {
    setSelectedPerson(null);
    setPersonSearch('');
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Date', 'Status', 'Check-in Time', 'Ministries Count', 'Attendance Rate', 'Ministries'];
    const rows = filteredRecords.map(record => [
      `${record.user?.firstName || ''} ${record.user?.lastName || ''}`.trim(),
      record.user?.email || '',
      record.date ? new Date(record.date).toLocaleDateString() : '',
      record.status || '',
      record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '',
      record.user?.id ? getMinistryCount(record.user.id).toString() : '0',
      record.user?.id ? getAttendanceRate(record.user.id) : '0%',
      record.user?.id ? getMinistryList(record.user.id) : 'None',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || attendanceLoading) {
    return <Loading fullScreen text="Loading attendance history..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">People History</h1>
          <p className="text-gray-600 text-sm">View attendance records for a specific time period</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
          Export
        </button>
      </div>

      {/* Filters - All in one row */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          {/* From Date */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
            <select
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* To Date */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
            <select
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Person Search */}
          <div className="flex-[2] min-w-[200px] relative" ref={personSearchRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search Person</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Name..."
                value={personSearch}
                onChange={(e) => {
                  setPersonSearch(e.target.value);
                  setShowPersonDropdown(true);
                  if (!e.target.value) setSelectedPerson(null);
                }}
                onFocus={() => setShowPersonDropdown(true)}
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
              />
              {selectedPerson && (
                <button onClick={handleClearPerson} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <XCircleIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {showPersonDropdown && filteredPeople.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredPeople.map(person => (
                  <div
                    key={person.id}
                    onClick={() => handleSelectPerson(person)}
                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${selectedPerson?.id === person.id ? 'bg-blue-50' : ''}`}
                  >
                    <p className="font-medium text-gray-900 text-sm">{person.firstName} {person.lastName}</p>
                    <p className="text-xs text-gray-500">{person.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 appearance-none bg-white"
            >
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </div>

          {/* Records Count */}
          <div className="flex items-center text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
            <span className="font-medium text-blue-900">{filteredRecords.length}</span>
            <span className="ml-1">records</span>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ministries
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          <span className="text-gray-600 font-medium">
                            {record.user?.firstName?.[0]}{record.user?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {record.user?.firstName} {record.user?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {record.date ? new Date(record.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit',
                      }) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {getStatusBadge(record.status || '')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800" title={record.user?.id ? getMinistryList(record.user.id) : 'None'}>
                        {record.user?.id ? getMinistryCount(record.user.id) : 0}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.user?.id && parseInt(getAttendanceRate(record.user.id)) >= 75
                          ? 'bg-green-100 text-green-800'
                          : record.user?.id && parseInt(getAttendanceRate(record.user.id)) >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.user?.id ? getAttendanceRate(record.user.id) : '0%'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center">
                    <UserGroupIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">No attendance records found</p>
                    <p className="text-gray-400 text-xs">Try adjusting your date range or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <div className="ml-2">
              <p className="text-xs text-green-700">Present</p>
              <p className="text-lg font-bold text-green-900">
                {filteredRecords.filter(r => r.status?.toLowerCase() === 'present').length}
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center">
            <ClockIcon className="h-6 w-6 text-yellow-600" />
            <div className="ml-2">
              <p className="text-xs text-yellow-700">Late</p>
              <p className="text-lg font-bold text-yellow-900">
                {filteredRecords.filter(r => r.status?.toLowerCase() === 'late').length}
              </p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center">
            <XCircleIcon className="h-6 w-6 text-red-600" />
            <div className="ml-2">
              <p className="text-xs text-red-700">Absent</p>
              <p className="text-lg font-bold text-red-900">
                {filteredRecords.filter(r => r.status?.toLowerCase() === 'absent').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
