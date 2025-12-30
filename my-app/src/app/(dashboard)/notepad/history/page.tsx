'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Loading } from '@/components/common';
import {
  DocumentTextIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import apiClient from '@/lib/api-client';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotepadHistoryPage() {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);

  const [startDate, setStartDate] = useState(
    `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}`
  );
  const [endDate, setEndDate] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState({ title: '', content: '' });

  // Fetch all notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ['notesHistory'],
    queryFn: async (): Promise<Note[]> => {
      try {
        const response = await apiClient.get('/notes');
        const data = response.data;
        return Array.isArray(data) ? data : (data?.data || []);
      } catch {
        return [];
      }
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const response = await apiClient.put(`/notes/${id}`, { title, content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notesHistory'] });
      setIsEditing(false);
      setSelectedNote(null);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiClient.delete(`/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notesHistory'] });
      setSelectedNote(null);
    },
  });

  // Filter notes by date range and search term
  const filteredNotes = useMemo(() => {
    if (!notes) return [];

    const startDateObj = new Date(`${startDate}-01`);
    const [endYear, endMonth] = endDate.split('-').map(Number);
    const endDateObj = new Date(endYear, endMonth, 0); // Last day of the month

    return notes.filter(note => {
      const noteDate = new Date(note.createdAt);
      const matchesDateRange = noteDate >= startDateObj && noteDate <= endDateObj;
      const matchesSearch = searchTerm === '' ||
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDateRange && matchesSearch;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, startDate, endDate, searchTerm]);

  // Generate month options
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

  const formatDate = (dateString: string, short = false) => {
    if (short) {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      });
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleView = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(false);
  };

  const handleEdit = (note: Note) => {
    setSelectedNote(note);
    setEditContent({ title: note.title, content: note.content });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedNote) {
      updateNoteMutation.mutate({
        id: selectedNote.id,
        title: editContent.title,
        content: editContent.content,
      });
    }
  };

  const handleDelete = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const closeModal = () => {
    setSelectedNote(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading notes history..." />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notes History</h1>
          <p className="text-gray-600 text-sm">View and edit your past notes</p>
        </div>
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
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
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
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Notes Count */}
          <div className="flex items-center text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
            <span className="font-medium text-blue-900">{filteredNotes.length}</span>
            <span className="ml-1">notes</span>
          </div>
        </div>
      </Card>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm truncate flex-1 pr-2">
                  {note.title || 'Untitled'}
                </h3>
                <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {note.content || 'No content'}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">{formatDate(note.updatedAt, true)}</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleView(note)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="View"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(note)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="bg-white border border-gray-200 rounded-lg text-center py-6">
              <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <h3 className="text-sm font-medium text-gray-900">No notes found</h3>
              <p className="text-xs text-gray-500">Try adjusting your date range or search terms</p>
            </div>
          </div>
        )}
      </div>

      {/* View/Edit Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Note' : 'View Note'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editContent.title}
                      onChange={(e) => setEditContent(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      value={editContent.content}
                      onChange={(e) => setEditContent(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {selectedNote.title || 'Untitled'}
                  </h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedNote.content || 'No content'}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    <p>Created: {formatDate(selectedNote.createdAt)}</p>
                    <p>Last updated: {formatDate(selectedNote.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              {isEditing ? (
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                  isLoading={updateNoteMutation.isPending}
                >
                  Save Changes
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditContent({ title: selectedNote.title, content: selectedNote.content });
                    setIsEditing(true);
                  }}
                >
                  <PencilSquareIcon className="h-5 w-5 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
