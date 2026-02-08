'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import FeedbackButton from '@/app/components/FeedbackButton';
import StatusModal from '@/app/components/StatusModal';
import { 
  Upload as UploadIcon, 
  FileText, 
  X, 
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  type: 'pdf' | 'ppt' | 'pptx' | 'docx';
  file?: File;
}

interface RecentUpload {
  id: string;
  name: string;
  fileCount: number;
  uploadedAt: string;
  status: 'processing' | 'completed';
}

type FormatType = 'key-points' | 'main-concepts' | 'exam-points' | 'short-notes' | 'speech-notes' | 'presentation-notes' | 'summary' | 'mcqs' | 'quick-test';

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [outputFormat, setOutputFormat] = useState<FormatType>('key-points');
  const [wordCount, setWordCount] = useState(100);
  const [customWordCount, setCustomWordCount] = useState('');
  const [statusModal, setStatusModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success',
  });

  const formatOptions: Array<{ value: FormatType; label: string }> = [
    { value: 'key-points', label: 'Key Points' },
    { value: 'main-concepts', label: 'Main Concepts' },
    { value: 'exam-points', label: 'Exam Points' },
    { value: 'short-notes', label: 'Short Notes' },
    { value: 'speech-notes', label: 'Speech Notes' },
    { value: 'presentation-notes', label: 'Presentation Notes' },
    { value: 'summary', label: 'Summary' },
    { value: 'mcqs', label: 'MCQs' },
    { value: 'quick-test', label: 'Quick Test' },
  ];

  const fetchRecentUploads = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) return;

      // Fetch recent collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (collectionsError) {
        console.error('Collections query error:', collectionsError);
        // If table doesn't exist, just set empty array
        if (collectionsError.code === 'PGRST116' || collectionsError.message?.includes('does not exist')) {
          console.warn('Collections table does not exist yet. Please run the SQL schema from SUPABASE_SCHEMA.md');
          setRecentUploads([]);
          return;
        }
        throw collectionsError;
      }

      if (collections && collections.length > 0) {
        // Get file count and status for each collection
        const collectionsWithDetails = await Promise.all(
          collections.map(async (collection) => {
            try {
              // Get file count from document_collections
              const { count, error: countError } = await supabase
                .from('document_collections')
                .select('*', { count: 'exact', head: true })
                .eq('collection_id', collection.id)
                .eq('user_id', currentUser.id);

              if (countError) {
                console.warn(`Error getting file count for collection ${collection.id}:`, countError);
              }

              // Check if notes exist (completed status)
              const { data: notesData, error: notesError } = await supabase
                .from('notes')
                .select('id')
                .eq('collection_id', collection.id)
                .eq('user_id', currentUser.id)
                .limit(1);

              if (notesError) {
                console.warn(`Error checking notes for collection ${collection.id}:`, notesError);
              }

              const status: 'processing' | 'completed' = notesData && notesData.length > 0 ? 'completed' : 'processing';

              return {
                id: collection.id,
                name: collection.name,
                fileCount: count || 0,
                uploadedAt: collection.created_at,
                status,
              };
            } catch (error) {
              console.error(`Error processing collection ${collection.id}:`, error);
              // Return a basic version if there's an error
              return {
                id: collection.id,
                name: collection.name,
                fileCount: 0,
                uploadedAt: collection.created_at,
                status: 'processing' as const,
              };
            }
          })
        );

        setRecentUploads(collectionsWithDetails);
      } else {
        setRecentUploads([]);
      }
    } catch (error) {
      console.error('Error fetching recent uploads:', error);
      // Set empty array on error to prevent UI issues
      setRecentUploads([]);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await fetchRecentUploads();
      setLoading(false);
    };

    checkAuth();
  }, [router, fetchRecentUploads]);

  const getFileType = (fileName: string): 'pdf' | 'ppt' | 'pptx' | 'docx' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'ppt') return 'ppt';
    if (ext === 'pptx') return 'pptx';
    if (ext === 'docx') return 'docx';
    return 'pdf';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const handleCollectionSubmit = async () => {
    if (!collectionName.trim()) {
      setStatusModal({
        show: true,
        title: 'Collection Name Required',
        message: 'Please enter a name for your study collection to keep things organized.',
        type: 'warning'
      });
      return;
    }

    if (selectedFiles.length === 0) {
      return;
    }

    setShowCollectionModal(false);
    setIsUploading(true);

    // Create upload file entries
    const filesToUpload = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const,
      type: getFileType(file.name),
      file,
    }));

    setUploadingFiles(filesToUpload);

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Please log in to upload files');
      }

      const formData = new FormData();
      formData.append('collectionName', collectionName.trim());
      formData.append('outputType', outputFormat);
      formData.append('wordCount', (customWordCount || wordCount).toString());
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || 'Upload failed';
        const errorDetails = error.details ? `\n\n${error.details}` : '';
        const errorList = error.errors ? `\n\nErrors:\n${error.errors.map((e: string) => `- ${e}`).join('\n')}` : '';
        throw new Error(`${errorMessage}${errorDetails}${errorList}`);
      }

      const result = await response.json();
      
      console.log('📦 Upload response:', result);

      // Update progress to 100% for all files
      setUploadingFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'completed' as const, progress: 100 }))
      );

      // Check if notes were saved
      if (result.notesSaved === false) {
        console.warn('⚠️ Notes were generated but not saved:', result.error);
        setStatusModal({
          show: true,
          title: 'Notes Not Saved',
          message: `Upload complete, but notes could not be saved. ${result.error || 'Please check if the notes table exists in Supabase.'}`,
          type: 'error'
        });
      } else if (result.notesId) {
        console.log('✅ Notes saved successfully! ID:', result.notesId);
      }

      // Clear after 2 seconds and redirect
      setTimeout(() => {
        setUploadingFiles([]);
        setSelectedFiles([]);
        setCollectionName('');
        setShowCollectionModal(false);
        fetchRecentUploads();
        
        // Navigate to notes page if collection ID is available and notes were saved
        if (result.collection?.id && result.notesSaved) {
          router.push(`/notes/${result.collection.id}`);
        } else if (result.collection?.id) {
          // Still navigate to notes page even if notes weren't saved (they might be generating)
          router.push(`/notes/${result.collection.id}`);
        } else {
          router.push('/dashboard');
        }
        
        if (result.notesSaved) {
          // Don't show alert if navigating to notes page
        }
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error' as const }))
      );
      setStatusModal({
        show: true,
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`File ${file.name} is too large. Maximum size is 50MB.`);
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${file.name} is not a supported format. Please upload PDF, PPT, PPTX, or DOCX files.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setStatusModal({
        show: true,
        title: 'File Selection Issues',
        message: errors.join('\n'),
        type: 'warning'
      });
    }

    if (validFiles.length === 0) return;

    // Check limits
    if (validFiles.length > 10) {
      setStatusModal({
        show: true,
        title: 'Too Many Files',
        message: 'Maximum 10 files allowed at once. Please select fewer files.',
        type: 'warning'
      });
      return;
    }

    setSelectedFiles(validFiles);
    setShowCollectionModal(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const cancelUpload = (uploadId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
  };

  const getFileIconColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'text-red-600';
      case 'ppt':
      case 'pptx':
        return 'text-orange-600';
      case 'docx':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex overflow-hidden lg:ml-0">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-48 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Upload Study Materials</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Import your documents to generate AI summaries and quizzes
            </p>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 md:p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Drop PDFs or PPTs here
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-2">
                Max file size 50MB. Supported formats: .pdf, .ppt, .pptx, .docx<br className="hidden sm:block" />
                <span className="sm:hidden"> • </span>You can upload up to 10 files at once
              </p>
              <label className="inline-flex items-center gap-2 bg-black text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors cursor-pointer text-sm sm:text-base">
                <UploadIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Browse Files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
              <div className="mt-8 space-y-4">
                {uploadingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`${getFileIconColor(file.type)} flex-shrink-0`}>
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">
                            {file.progress}%
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatFileSize((file.size * file.progress) / 100)} of {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {file.status === 'uploading' && (
                          <button
                            onClick={() => cancelUpload(file.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-600" />
                          </button>
                        )}
                        {file.status === 'completed' && (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Recent Uploads */}
        <aside className="hidden lg:block w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
          <div className="space-y-3">
            {recentUploads.length > 0 ? (
              recentUploads.map((upload) => (
                <div
                  key={upload.id}
                  onClick={() => router.push(`/notes/${upload.id}`)}
                  className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  {upload.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{upload.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(upload.uploadedAt)} • {upload.fileCount} {upload.fileCount === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent uploads</p>
            )}
          </div>
          {recentUploads.length > 0 && (
            <>
              <Link
                href="/dashboard"
                className="block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
              <p className="mt-4 text-xs text-gray-500">
                Showing {recentUploads.length} {recentUploads.length === 1 ? 'collection' : 'collections'}
              </p>
            </>
          )}


        </aside>
      </div>

      {/* Mobile Recent Uploads - Bottom drawer on mobile */}
      {recentUploads.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 max-h-40 sm:max-h-48 overflow-y-auto shadow-lg z-30 safe-area-bottom">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Recent Uploads</h3>
          <div className="space-y-2">
            {recentUploads.slice(0, 3).map((upload) => (
              <div
                key={upload.id}
                onClick={() => router.push(`/notes/${upload.id}`)}
                className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                {upload.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{upload.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(upload.uploadedAt)} • {upload.fileCount} {upload.fileCount === 1 ? 'file' : 'files'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collection Name Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-md max-h-[80vh] overflow-y-auto safe-area-bottom">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Create Study Notes Collection
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Enter a name for this collection (e.g., &quot;Neural Networks &ndash; Unit 3&quot;)
            </p>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4 text-base sm:text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCollectionSubmit();
                } else if (e.key === 'Escape') {
                  setShowCollectionModal(false);
                  setSelectedFiles([]);
                  setCollectionName('');
                }
              }}
            />
            
            {/* Output Format Selection */}
            <div className="mb-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">How do you want the output?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setOutputFormat(option.value)}
                    className={`px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                      outputFormat === option.value
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Word count:</label>
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 200].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setWordCount(count);
                        setCustomWordCount('');
                      }}
                      className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-colors ${
                        wordCount === count && !customWordCount
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom"
                    value={customWordCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomWordCount(val);
                      if (val) setWordCount(parseInt(val) || 100);
                    }}
                    className="w-20 px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowCollectionModal(false);
                  setSelectedFiles([]);
                  setCollectionName('');
                }}
                disabled={isUploading}
                className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleCollectionSubmit}
                disabled={!collectionName.trim() || isUploading}
                className="flex-1 sm:flex-none bg-black text-white px-4 py-2.5 sm:py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isUploading ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center sm:text-left">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
            </p>
          </div>
        </div>
      )}

      {/* Status Modal */}
      <StatusModal
        show={statusModal.show}
        type={statusModal.type as any}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal(prev => ({ ...prev, show: false }))}
      />

      {/* Floating Feedback Button */}
      <FeedbackButton userId={user?.id} userEmail={user?.email} />
    </div>
  );
}

