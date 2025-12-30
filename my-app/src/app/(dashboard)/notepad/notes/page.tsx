'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Loading } from '@/components/common';
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import apiClient from '@/lib/api-client';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotepadNotesPage() {
  const queryClient = useQueryClient();

  const [currentNote, setCurrentNote] = useState({
    id: '',
    title: '',
    content: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch all notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes'],
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

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (note: { id?: string; title: string; content: string }) => {
      if (note.id) {
        const response = await apiClient.put(`/notes/${note.id}`, {
          title: note.title,
          content: note.content,
        });
        return response.data;
      } else {
        const response = await apiClient.post('/notes', {
          title: note.title,
          content: note.content,
        });
        return response.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setLastSaved(new Date());
      if (!currentNote.id && data?.id) {
        setCurrentNote(prev => ({ ...prev, id: data.id }));
      }
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiClient.delete(`/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setCurrentNote({ id: '', title: '', content: '' });
      setIsEditing(false);
      setSuccessMessage('Note deleted successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    if (currentNote.title || currentNote.content) {
      const timer = setTimeout(() => {
        if (currentNote.title && currentNote.content) {
          saveNoteMutation.mutate({
            id: currentNote.id || undefined,
            title: currentNote.title,
            content: currentNote.content,
          });
        }
      }, 2000); // Auto-save after 2 seconds of inactivity

      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [currentNote.title, currentNote.content]);

  const handleNewNote = () => {
    setCurrentNote({ id: '', title: '', content: '' });
    setIsEditing(true);
    setLastSaved(null);
  };

  const handleSelectNote = (note: Note) => {
    setCurrentNote({
      id: note.id,
      title: note.title,
      content: note.content,
    });
    setIsEditing(true);
    setLastSaved(new Date(note.updatedAt));
  };

  const handleSave = () => {
    if (!currentNote.title.trim()) {
      alert('Please enter a title for your note');
      return;
    }
    saveNoteMutation.mutate({
      id: currentNote.id || undefined,
      title: currentNote.title,
      content: currentNote.content,
    });
    setSuccessMessage('Note saved successfully');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleDelete = () => {
    if (currentNote.id && confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(currentNote.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading notes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-600">Create and manage your notes</p>
        </div>
        <Button variant="primary" onClick={handleNewNote}>
          + New Note
        </Button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
          <p className="font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes List */}
        <div className="lg:col-span-1">
          <Card title="Your Notes">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {notes && notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      currentNote.id === note.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {note.title || 'Untitled'}
                        </p>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {note.content?.substring(0, 50) || 'No content'}...
                        </p>
                      </div>
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {formatDate(note.updatedAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No notes yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "New Note" to create one</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Note Editor */}
        <div className="lg:col-span-2">
          <Card>
            {isEditing ? (
              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    value={currentNote.title}
                    onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Note title..."
                    className="w-full text-2xl font-bold text-gray-900 border-0 border-b border-gray-200 pb-2 focus:outline-none focus:border-blue-500 placeholder-gray-400"
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <textarea
                    value={currentNote.content}
                    onChange={(e) => setCurrentNote(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Start writing your note..."
                    rows={16}
                    className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    {saveNoteMutation.isPending ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : lastSaved ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                        Last saved: {lastSaved.toLocaleTimeString()}
                      </>
                    ) : (
                      <>
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Editing...
                      </>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    {currentNote.id && (
                      <Button
                        variant="outline"
                        onClick={handleDelete}
                        isLoading={deleteNoteMutation.isPending}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-5 w-5 mr-2" />
                        Delete
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      isLoading={saveNoteMutation.isPending}
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Save Note
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a note or create a new one
                </h3>
                <p className="text-gray-500 mb-6">
                  Your notes will be automatically saved as you type
                </p>
                <Button variant="primary" onClick={handleNewNote}>
                  + Create New Note
                </Button>
              </div>
            )}
          </Card>

          {/* Tips Card */}
          {isEditing && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Auto-Save Enabled</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Your notes are automatically saved after 2 seconds of inactivity.
                    You can also click "Save Note" to save immediately.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
