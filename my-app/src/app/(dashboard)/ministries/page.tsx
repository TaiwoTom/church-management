'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ministryService } from '@/services';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { Card, Button, Loading, Modal } from '@/components/common';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  MapPinIcon,
  UserPlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function MinistryDirectory() {
  const queryClient = useQueryClient();
  const user = useAppSelector(selectUser);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries', search, selectedCategory],
    queryFn: () => ministryService.getMinistries(1, 50),
  });

  const joinMutation = useMutation({
    mutationFn: (ministryId: string) => ministryService.joinMinistry(ministryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      setShowJoinModal(false);
    },
  });

  const categories = ['Worship', 'Youth', 'Outreach', 'Education', 'Support', 'Media'];

  const filteredMinistries = ministries?.data?.filter((ministry) => {
    const matchesSearch = ministry.name.toLowerCase().includes(search.toLowerCase()) ||
      ministry.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || ministry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <Loading fullScreen text="Loading ministries..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Explore Ministries</h1>
        <p className="text-gray-600 mt-2">
          Find the right ministry for you and connect with like-minded believers
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search ministries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Ministry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMinistries && filteredMinistries.length > 0 ? (
          filteredMinistries.map((ministry) => {
            const isMember = ministry.members?.includes(user?.id || '');

            return (
              <Card key={ministry.id} className="flex flex-col">
                {/* Ministry Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  {ministry.category && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {ministry.category}
                    </span>
                  )}
                </div>

                {/* Ministry Info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{ministry.name}</h3>
                <p className="text-gray-600 text-sm flex-1 line-clamp-3">{ministry.description}</p>

                {/* Ministry Details */}
                <div className="mt-4 space-y-2">
                  {ministry.meetingSchedule && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{ministry.meetingSchedule}</span>
                    </div>
                  )}
                  {ministry.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      <span>{ministry.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span>{ministry.members?.length || 0} members</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {isMember ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">You're a member</span>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setSelectedMinistry(ministry);
                        setShowJoinModal(true);
                      }}
                    >
                      <UserPlusIcon className="h-5 w-5 mr-2" />
                      Join Ministry
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No ministries found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Join Ministry Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title={`Join ${selectedMinistry?.name}`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to join the <strong>{selectedMinistry?.name}</strong> ministry?
          </p>

          {selectedMinistry?.meetingSchedule && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Meeting Schedule:</strong> {selectedMinistry.meetingSchedule}
              </p>
              {selectedMinistry.location && (
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Location:</strong> {selectedMinistry.location}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => selectedMinistry && joinMutation.mutate(selectedMinistry.id)}
              isLoading={joinMutation.isPending}
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Join Ministry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
