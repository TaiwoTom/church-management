'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService, ministryService } from '@/services';
import { Card, Button } from '@/components/common';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface CheckInFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ministry: string;
}

// Default ministries (same as in ministries page)
const defaultMinistries = [
  { id: 'default-newcomer', name: 'New Comer' },
  { id: 'default-worship', name: 'Worship Ministry' },
  { id: 'default-youth', name: 'Youth Ministry' },
  { id: 'default-choir', name: 'Choir Ministry' },
  { id: 'default-children', name: 'Children Ministry' },
  { id: 'default-mens', name: "Men's Fellowship" },
  { id: 'default-womens', name: "Women's Ministry" },
  { id: 'default-outreach', name: 'Outreach & Evangelism' },
  { id: 'default-media', name: 'Media & Tech Ministry' },
  { id: 'default-ushers', name: 'Ushers Ministry' },
  { id: 'default-prayer', name: 'Prayer Warriors' },
];

export default function PeopleCheckInPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CheckInFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ministry: '',
  });

  // Fetch ministries from API
  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => ministryService.getMinistries(1, 50),
  });

  // Get ministries list - use API data or fall back to defaults
  const apiMinistries = ministries?.data || [];
  const ministriesList = apiMinistries.length > 0 ? apiMinistries : defaultMinistries;
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<CheckInFormData>>({});

  const checkInMutation = useMutation({
    mutationFn: async (data: CheckInFormData) => {
      // For now, we'll create a simple attendance record
      // The backend should handle creating/finding the user
      const response = await attendanceService.markAttendance({
        userId: '', // Backend should handle guest check-ins
        serviceId: 'current', // Backend should get current service
        checkInTime: new Date().toISOString(),
      });
      return response;
    },
    onSuccess: () => {
      setShowSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        ministry: '',
      });
      setTimeout(() => setShowSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error: any) => {
      console.error('Check-in failed:', error);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckInFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.ministry) {
      newErrors.ministry = 'Please select a ministry';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      checkInMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof CheckInFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">People Check-in</h1>
          <p className="text-gray-600">Register attendance for church members and visitors</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <p className="font-medium text-green-800 text-sm">Check-in Successful!</p>
          </div>
        )}

        {/* Check-in Form */}
        <Card title="Check-in Form">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email and Phone Fields - Same Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Ministry Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ministry <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="ministry"
                value={formData.ministry}
                onChange={handleChange}
                className={`w-full pl-10 pr-8 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 appearance-none bg-white ${
                  errors.ministry ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a ministry</option>
                {ministriesList.map((ministry: any) => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.ministry && (
              <p className="mt-1 text-xs text-red-500">{errors.ministry}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-center">
            <Button
              type="submit"
              variant="primary"
              isLoading={checkInMutation.isPending}
            >
              Submit Check-in
            </Button>
          </div>
        </form>
        </Card>
      </div>
    </div>
  );
}
