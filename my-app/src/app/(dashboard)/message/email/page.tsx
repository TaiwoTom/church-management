'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailService, userService } from '@/services';
import { Card, Button, Loading } from '@/components/common';
import {
  PaperAirplaneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const churchGroups = [
  { value: 'all', label: 'All Members' },
  { value: 'newcomer', label: 'Newcomers' },
  { value: 'women', label: 'Women Group' },
  { value: 'men', label: 'Men Group' },
  { value: 'youth', label: 'Youth Group' },
  { value: 'children', label: 'Children Ministry' },
  { value: 'choir', label: 'Choir' },
  { value: 'usher', label: 'Ushers' },
  { value: 'staff', label: 'Staff Only' },
];

export default function MessageEmailPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    recipientGroup: '',
    subject: '',
    body: '',
  });
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({}, 1, 500),
  });

  const { data: emailStats, isLoading: statsLoading } = useQuery({
    queryKey: ['emailStats'],
    queryFn: emailService.getEmailStats,
  });

  const { data: recentEmails, isLoading: emailsLoading } = useQuery({
    queryKey: ['recentEmails'],
    queryFn: () => emailService.getEmails(1, 10),
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: { recipients: string[]; subject: string; body: string }) => {
      return emailService.sendBroadcast(data);
    },
    onSuccess: () => {
      setShowSuccess(true);
      setFormData({ recipientGroup: '', subject: '', body: '' });
      setAttachedImages([]);
      setImagePreviews([]);
      setTimeout(() => setShowSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['emailStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentEmails'] });
    },
    onError: (error: any) => {
      console.error('Failed to send email:', error);
    },
  });

  const getRecipientsForGroup = (group: string): string[] => {
    if (!users?.data) return [];

    if (group === 'all') {
      return users.data.map(u => u.email).filter(Boolean);
    }

    // Filter users by role/group
    return users.data
      .filter(u => {
        if (group === 'staff') {
          return u.role?.toLowerCase() === 'staff' || u.role?.toLowerCase() === 'admin';
        }
        if (group === 'newcomer') {
          return u.role?.toLowerCase() === 'newcomer';
        }
        // For other groups, check ministries or group field
        if (u.group?.toLowerCase() === group.toLowerCase()) {
          return true;
        }
        return u.ministries?.some(m => {
          const ministryName = typeof m === 'string' ? m : m.name;
          return ministryName?.toLowerCase().includes(group.toLowerCase());
        });
      })
      .map(u => u.email)
      .filter(Boolean);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientGroup) {
      newErrors.recipientGroup = 'Please select a recipient group';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.body.trim()) {
      newErrors.body = 'Message body is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length + attachedImages.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setAttachedImages(prev => [...prev, ...imageFiles]);

    // Create previews
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const recipients = getRecipientsForGroup(formData.recipientGroup);
    if (recipients.length === 0) {
      setErrors({ recipientGroup: 'No recipients found for this group' });
      return;
    }

    // For now, include image references in body (backend should handle image uploads separately)
    let bodyWithImages = formData.body;
    if (attachedImages.length > 0) {
      bodyWithImages += `\n\n[${attachedImages.length} image(s) attached]`;
    }

    sendBroadcastMutation.mutate({
      recipients,
      subject: formData.subject,
      body: bodyWithImages,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const recipientCount = formData.recipientGroup
    ? getRecipientsForGroup(formData.recipientGroup).length
    : 0;

  const stats = [
    {
      name: 'Total Sent',
      value: emailStats?.totalSent || 0,
      icon: PaperAirplaneIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Delivered',
      value: emailStats?.delivered || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending',
      value: emailStats?.pending || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Failed',
      value: emailStats?.failed || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
    },
  ];

  if (statsLoading || emailsLoading) {
    return <Loading fullScreen text="Loading email center..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header & Stats Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Send Email</h1>
          <p className="text-gray-600 text-sm">Send emails to church groups and members</p>
        </div>
        <div className="flex gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                <div className={`${stat.color} p-1 rounded mr-2`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.name}</p>
                  <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <p className="font-medium text-green-800 text-sm">Email Sent Successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Compose Form */}
        <div className="lg:col-span-2">
          <Card title="Compose Email">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Recipient Group & Subject - Same Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Recipient Group <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserGroupIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      name="recipientGroup"
                      value={formData.recipientGroup}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 appearance-none bg-white ${
                        errors.recipientGroup ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a group</option>
                      {churchGroups.map(group => (
                        <option key={group.value} value={group.value}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.recipientGroup && (
                    <p className="mt-1 text-xs text-red-500">{errors.recipientGroup}</p>
                  )}
                  {formData.recipientGroup && (
                    <p className="mt-1 text-xs text-blue-600">
                      {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Email subject"
                      className={`w-full pl-8 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 ${
                        errors.subject ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.subject && (
                    <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  rows={5}
                  className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 resize-none ${
                    errors.body ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.body && (
                  <p className="mt-1 text-xs text-red-500">{errors.body}</p>
                )}
              </div>

              {/* Image Upload & Submit - Same Row */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <PhotoIcon className="h-4 w-4 mr-1" />
                  Attach Images
                </button>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-10 w-10 object-cover rounded border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex-1" />

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={sendBroadcastMutation.isPending}
                >
                  Send Email
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Recent Emails Sidebar */}
        <div className="space-y-3">
          <Card title="Recent Emails">
            <div className="space-y-2">
              {recentEmails?.data && recentEmails.data.length > 0 ? (
                recentEmails.data.slice(0, 4).map((email) => (
                  <div
                    key={email.id}
                    className="p-2 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-xs truncate flex-1">
                        {email.subject}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full ml-2 ${
                          email.status === 'SENT'
                            ? 'bg-green-100 text-green-800'
                            : email.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {email.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 truncate">To: {email.to}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(email.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-2 text-sm">No recent emails</p>
              )}
            </div>
          </Card>

          {/* Tips Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div className="flex items-start">
              <svg className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-blue-800">Tips</h3>
                <ul className="mt-1 text-xs text-blue-700 space-y-0.5">
                  <li>• Keep subject lines concise</li>
                  <li>• Use images sparingly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
