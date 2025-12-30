'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ministryService, userService } from '@/services';
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectUserRole } from '@/store/slices/authSlice';
import { Card, Button, Loading, Modal } from '@/components/common';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  MapPinIcon,
  UserPlusIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface MinistryFormData {
  name: string;
  description: string;
  category: string;
  meetingSchedule: string;
  location: string;
}

interface Member {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

const initialFormData: MinistryFormData = {
  name: '',
  description: '',
  category: '',
  meetingSchedule: '',
  location: '',
};

export default function MinistryDirectory() {
  const queryClient = useQueryClient();
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<MinistryFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<MinistryFormData>>({});

  // Check if user is admin (case-insensitive)
  const isAdmin = userRole?.toLowerCase() === 'admin';

  const { data: ministries, isLoading, error, isError } = useQuery({
    queryKey: ['ministries', search, selectedCategory],
    queryFn: () => ministryService.getMinistries(1, 50),
  });

  // Log errors for debugging
  if (isError) {
    console.error('Error fetching ministries:', error);
  }

  // Fetch ministry details with members when a ministry is selected
  const { data: ministryDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['ministryDetails', selectedMinistry?.id],
    queryFn: () => ministryService.getMinistryById(selectedMinistry?.id),
    enabled: !!selectedMinistry?.id,
  });

  // Fetch all users/members for the Add Member modal
  const { data: allUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(undefined, 1, 100),
    enabled: showAddMemberModal,
  });

  // Filter users based on search
  const filteredUsers = (allUsers?.data || []).filter((user: any) => {
    if (!memberSearch.trim()) return true;
    const searchLower = memberSearch.toLowerCase();
    const firstName = (user.firstName || '').toLowerCase();
    const lastName = (user.lastName || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`;
    return firstName.includes(searchLower) ||
           lastName.includes(searchLower) ||
           fullName.includes(searchLower);
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ ministryId, userId }: { ministryId: string; userId: string }) =>
      ministryService.addMember(ministryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['ministryDetails'] });
      setShowAddMemberModal(false);
      setMemberSearch('');
      setSelectedMember(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MinistryFormData) => ministryService.createMinistry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setShowCreateModal(false);
      setFormData(initialFormData);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MinistryFormData }) =>
      ministryService.updateMinistry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setShowEditModal(false);
      setFormData(initialFormData);
      setSelectedMinistry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ministryService.deleteMinistry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setShowDeleteModal(false);
      setSelectedMinistry(null);
    },
  });

  const categories = ['Worship', 'Youth', 'Outreach', 'Education', 'Support', 'Media'];

  // Default ministries to display when none exist in the database
  const defaultMinistries: any[] = [
    {
      id: 'default-newcomer',
      name: 'New Comer',
      description: 'Welcome to our church family! This group is for first-time visitors and new members.',
      category: 'Support',
      meetingSchedule: 'Sundays after service',
      location: 'Welcome Center',
      members: [],
    },
    {
      id: 'default-worship',
      name: 'Worship Ministry',
      description: 'Leading the congregation in praise and worship through music and song.',
      category: 'Worship',
      meetingSchedule: 'Saturdays at 4:00 PM',
      location: 'Main Sanctuary',
      members: [],
    },
    {
      id: 'default-youth',
      name: 'Youth Ministry',
      description: 'Engaging and empowering young people to grow in faith and community.',
      category: 'Youth',
      meetingSchedule: 'Fridays at 6:00 PM',
      location: 'Youth Hall',
      members: [],
    },
    {
      id: 'default-choir',
      name: 'Choir Ministry',
      description: 'Glorifying God through choral music and special performances.',
      category: 'Worship',
      meetingSchedule: 'Wednesdays at 7:00 PM',
      location: 'Choir Room',
      members: [],
    },
    {
      id: 'default-children',
      name: 'Children Ministry',
      description: 'Nurturing children in the knowledge and love of Jesus Christ.',
      category: 'Education',
      meetingSchedule: 'Sundays at 9:00 AM',
      location: 'Children\'s Wing',
      members: [],
    },
    {
      id: 'default-mens',
      name: 'Men\'s Fellowship',
      description: 'Building strong men of faith through fellowship, prayer, and study.',
      category: 'Support',
      meetingSchedule: 'First Saturday of each month at 8:00 AM',
      location: 'Fellowship Hall',
      members: [],
    },
    {
      id: 'default-womens',
      name: 'Women\'s Ministry',
      description: 'Empowering women to grow spiritually and support one another.',
      category: 'Support',
      meetingSchedule: 'Second Saturday of each month at 10:00 AM',
      location: 'Fellowship Hall',
      members: [],
    },
    {
      id: 'default-outreach',
      name: 'Outreach & Evangelism',
      description: 'Sharing the gospel and serving the community through various outreach programs.',
      category: 'Outreach',
      meetingSchedule: 'Third Saturday of each month at 9:00 AM',
      location: 'Church Grounds',
      members: [],
    },
    {
      id: 'default-media',
      name: 'Media & Tech Ministry',
      description: 'Supporting church services through audio, video, and live streaming.',
      category: 'Media',
      meetingSchedule: 'Sundays at 7:30 AM',
      location: 'Media Booth',
      members: [],
    },
    {
      id: 'default-ushers',
      name: 'Ushers Ministry',
      description: 'Welcoming and assisting members and visitors during church services.',
      category: 'Support',
      meetingSchedule: 'Sundays at 8:00 AM',
      location: 'Church Entrance',
      members: [],
    },
    {
      id: 'default-prayer',
      name: 'Prayer Warriors',
      description: 'Interceding for the church, members, and community through dedicated prayer.',
      category: 'Support',
      meetingSchedule: 'Tuesdays at 6:00 AM',
      location: 'Prayer Room',
      members: [],
    },
  ];

  // Get ministries array from the response, use default ministries if empty
  const apiMinistries = ministries?.data || [];
  const ministriesList = apiMinistries.length > 0 ? apiMinistries : defaultMinistries;

  // Debug logging - can be removed later
  console.log('Ministries from useQuery:', ministries);
  console.log('Processed ministriesList:', ministriesList);

  // Check if a ministry matches the search
  const matchesSearch = (ministry: any) => {
    if (!search.trim()) return false;
    return ministry.name.toLowerCase().includes(search.toLowerCase()) ||
      ministry.description?.toLowerCase().includes(search.toLowerCase());
  };

  const validateForm = (): boolean => {
    const errors: Partial<MinistryFormData> = {};
    if (!formData.name.trim()) {
      errors.name = 'Ministry name is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.category) {
      errors.category = 'Please select a category';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateMinistry = () => {
    if (validateForm()) {
      createMutation.mutate(formData);
    }
  };

  const handleUpdateMinistry = () => {
    if (validateForm() && selectedMinistry) {
      updateMutation.mutate({ id: selectedMinistry.id, data: formData });
    }
  };

  const handleEditClick = (ministry: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMinistry(ministry);
    setFormData({
      name: ministry.name || '',
      description: ministry.description || '',
      category: ministry.category || '',
      meetingSchedule: ministry.meetingSchedule || '',
      location: ministry.location || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (ministry: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMinistry(ministry);
    setShowDeleteModal(true);
  };

  const handleMinistryClick = (ministry: any) => {
    setSelectedMinistry(ministry);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof MinistryFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
  };

  // Get members list from ministry details or selected ministry
  const getMembersList = (): Member[] => {
    if (ministryDetails?.members && Array.isArray(ministryDetails.members)) {
      return ministryDetails.members;
    }
    if (selectedMinistry?.memberDetails && Array.isArray(selectedMinistry.memberDetails)) {
      return selectedMinistry.memberDetails;
    }
    return [];
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading ministries..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header with Create Ministry Button - Always Visible */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ministries</h1>
          <p className="text-gray-600 text-sm">View all ministries and their members</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Ministry
        </button>
      </div>

      {/* Ministry Buttons - Horizontal List */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Select a Ministry</h2>
            <p className="text-xs text-gray-500">
              {ministriesList.length > 0
                ? `${ministriesList.length} ministries available`
                : 'Click "Create Ministry" to add your first ministry'}
            </p>
          </div>
          {/* Search */}
          <div className="relative w-48">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        {isError && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error loading ministries. Please try refreshing the page.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {ministriesList && ministriesList.length > 0 ? (
            ministriesList.map((ministry: any) => {
              const isSelected = selectedMinistry?.id === ministry.id;

              return (
                <button
                  key={ministry.id}
                  onClick={() => handleMinistryClick(ministry)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <UserGroupIcon className="h-4 w-4 mr-1.5" />
                  {ministry.name}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {ministry.members?.length || 0}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="w-full text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <UserGroupIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm font-medium">No ministries created yet</p>
              <p className="text-gray-400 text-xs">Click "Create Ministry" above to add your first ministry</p>
            </div>
          )}
        </div>
      </Card>

      {/* Selected Ministry Members Section */}
      {selectedMinistry && (
        <Card>
          {/* Ministry Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{selectedMinistry.name}</h2>
                {selectedMinistry.category && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {selectedMinistry.category}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{selectedMinistry.description}</p>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                {selectedMinistry.meetingSchedule && (
                  <span className="inline-flex items-center">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {selectedMinistry.meetingSchedule}
                  </span>
                )}
                {selectedMinistry.location && (
                  <span className="inline-flex items-center">
                    <MapPinIcon className="h-3 w-3 mr-1" />
                    {selectedMinistry.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {isAdmin && (
                <>
                  <button
                    onClick={(e) => handleEditClick(selectedMinistry, e)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit ministry"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(selectedMinistry, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete ministry"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors ml-1"
              >
                + Add Member
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="border-t border-gray-200 pt-2">
            <h3 className="text-xs font-medium text-gray-700 mb-2">
              Members ({selectedMinistry.members?.length || 0})
            </h3>

            {loadingDetails ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-1 text-sm">Loading members...</p>
              </div>
            ) : getMembersList().length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {getMembersList().map((member: Member, index: number) => (
                  <div
                    key={member.id || index}
                    className="flex items-center p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-blue-600 text-xs font-medium">
                        {member.firstName?.[0] || '?'}{member.lastName?.[0] || ''}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {member.firstName || 'Unknown'} {member.lastName || ''}
                      </p>
                      {member.email && (
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                <p className="text-gray-500 text-sm">No members yet</p>
                <p className="text-xs text-gray-400">Be the first to join this ministry!</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Placeholder when no ministry is selected but ministries exist */}
      {!selectedMinistry && ministriesList.length > 0 && (
        <Card>
          <div className="text-center py-6">
            <UserGroupIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-600">Select a ministry to view members</h3>
            <p className="text-gray-400 text-xs">Click on any ministry button above to see its details</p>
          </div>
        </Card>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setMemberSearch('');
          setSelectedMember(null);
        }}
        title={`Add Member to ${selectedMinistry?.name}`}
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by Name
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Type first or last name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {loadingUsers ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2 text-sm">Loading members...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user: any) => {
                  const isSelected = selectedMember?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedMember(user)}
                      className={`w-full flex items-center p-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium">
                          {user.firstName?.[0] || '?'}{user.lastName?.[0] || ''}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {user.firstName || 'Unknown'} {user.lastName || ''}
                        </p>
                        {user.email && (
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircleIcon className="h-5 w-5 text-blue-600 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {memberSearch ? 'No members found matching your search' : 'No members available'}
              </div>
            )}
          </div>

          {/* Selected Member Preview */}
          {selectedMember && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Selected:</strong> {selectedMember.firstName} {selectedMember.lastName}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMemberModal(false);
                setMemberSearch('');
                setSelectedMember(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedMinistry && selectedMember) {
                  addMemberMutation.mutate({
                    ministryId: selectedMinistry.id,
                    userId: selectedMember.id,
                  });
                }
              }}
              isLoading={addMemberMutation.isPending}
              disabled={!selectedMember}
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Ministry Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Ministry"
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ministry Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter ministry name"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                formErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the ministry's purpose and activities"
              rows={3}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none ${
                formErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                formErrors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {formErrors.category && (
              <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>
            )}
          </div>

          {/* Meeting Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Schedule
            </label>
            <input
              type="text"
              name="meetingSchedule"
              value={formData.meetingSchedule}
              onChange={handleChange}
              placeholder="e.g., Every Sunday at 9:00 AM"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Main Sanctuary, Room 101"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateMinistry}
              isLoading={createMutation.isPending}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Ministry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Ministry Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setSelectedMinistry(null);
        }}
        title="Edit Ministry"
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ministry Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter ministry name"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                formErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the ministry's purpose and activities"
              rows={3}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none ${
                formErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                formErrors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {formErrors.category && (
              <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>
            )}
          </div>

          {/* Meeting Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Schedule
            </label>
            <input
              type="text"
              name="meetingSchedule"
              value={formData.meetingSchedule}
              onChange={handleChange}
              placeholder="e.g., Every Sunday at 9:00 AM"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Main Sanctuary, Room 101"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              resetForm();
              setSelectedMinistry(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateMinistry}
              isLoading={updateMutation.isPending}
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMinistry(null);
        }}
        title="Delete Ministry"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-red-800">
              Are you sure you want to delete <strong>{selectedMinistry?.name}</strong>?
              This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => {
              setShowDeleteModal(false);
              setSelectedMinistry(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedMinistry && deleteMutation.mutate(selectedMinistry.id)}
              isLoading={deleteMutation.isPending}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Ministry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
