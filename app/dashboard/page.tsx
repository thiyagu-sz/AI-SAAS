'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import FeedbackButton from '@/app/components/FeedbackButton';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  Upload as UploadIcon, 
  Search, 
  Bell,
  FolderPlus,
  FolderOpen,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  name: string;
  status: string;
  created_at: string;
  fileCount?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string; count: number }[]>([]);
  const [savedFolders, setSavedFolders] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalDocuments: 0,
    topicsGenerated: 0,
    lastStudySession: 'No study sessions yet',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await fetchDocuments();
      await loadSavedFolders();
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const loadSavedFolders = async () => {
    try {
      const saved = localStorage.getItem('savedFolders');
      if (saved) {
        setSavedFolders(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Error loading saved folders:', error);
    }
  };

  const toggleSaveFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder click
    const newSaved = new Set(savedFolders);
    if (newSaved.has(folderId)) {
      newSaved.delete(folderId);
    } else {
      newSaved.add(folderId);
    }
    setSavedFolders(newSaved);
    localStorage.setItem('savedFolders', JSON.stringify(Array.from(newSaved)));
  };

  const fetchDocuments = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) return;

      // Fetch stats with error handling
      const [documentsResult, collectionsResult, notesResult] = await Promise.all([
        // Total documents count
        supabase
          .from('documents')
          .select('id, created_at', { count: 'exact', head: true })
          .eq('user_id', currentUser.id),
        
        // Collections (folders)
        supabase
          .from('collections')
          .select('id, name, created_at')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false }),
        
        // Total notes count
        supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', currentUser.id),
      ]);

      // Handle errors gracefully
      if (collectionsResult.error) {
        console.error('Collections query error:', collectionsResult.error);
        if (collectionsResult.error.code === 'PGRST116' || collectionsResult.error.message?.includes('does not exist')) {
          console.warn('Collections table does not exist yet. Please run the SQL schema from SUPABASE_SCHEMA.md');
          setFolders([]);
          setStats({
            totalDocuments: documentsResult.count || 0,
            topicsGenerated: 0,
            lastStudySession: 'No study sessions yet',
          });
          setDocuments([]);
          return;
        }
      }

      // Get total documents count
      const totalDocuments = documentsResult.count || 0;

      // Get total notes count (handle error)
      const topicsGenerated = notesResult.error ? 0 : (notesResult.count || 0);

      // Get last study session (most recent collection or document)
      let lastStudySession = 'No study sessions yet';
      if (collectionsResult.data && collectionsResult.data.length > 0) {
        const lastCollection = collectionsResult.data[0];
        const lastDate = new Date(lastCollection.created_at);
        const now = new Date();
        const diffMs = now.getTime() - lastDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) lastStudySession = 'Just now';
        else if (diffMins < 60) lastStudySession = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
        else if (diffHours < 24) lastStudySession = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        else if (diffDays === 1) lastStudySession = 'Yesterday';
        else lastStudySession = `${diffDays} days ago`;
      }

      setStats({
        totalDocuments,
        topicsGenerated,
        lastStudySession,
      });

      // Fetch collections with document counts (from document_collections)
      if (collectionsResult.data && collectionsResult.data.length > 0) {
        const collectionsWithCounts = await Promise.all(
          collectionsResult.data.map(async (collection) => {
            try {
              const { count, error: countError } = await supabase
                .from('document_collections')
                .select('*', { count: 'exact', head: true })
                .eq('collection_id', collection.id)
                .eq('user_id', currentUser.id);
              
              if (countError) {
                console.warn(`Error getting count for collection ${collection.id}:`, countError);
              }
              
              return {
                id: collection.id,
                name: collection.name,
                count: count || 0,
              };
            } catch (error) {
              console.error(`Error processing collection ${collection.id}:`, error);
              return {
                id: collection.id,
                name: collection.name,
                count: 0,
              };
            }
          })
        );
        setFolders(collectionsWithCounts);
      } else {
        setFolders([]);
      }

      // Fetch recent activity (collections with their status)
      const { data: recentCollections, error: recentError } = await supabase
        .from('collections')
        .select('id, name, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentError && recentCollections && recentCollections.length > 0) {
        // Get status for each collection (check if notes exist)
        const collectionsWithStatus = await Promise.all(
          recentCollections.map(async (collection: any) => {
            try {
              const { data: notesData, error: notesError } = await supabase
                .from('notes')
                .select('id')
                .eq('collection_id', collection.id)
                .limit(1);
              
              if (notesError) {
                console.warn(`Error checking notes for collection ${collection.id}:`, notesError);
              }

              const { count, error: countError } = await supabase
                .from('document_collections')
                .select('*', { count: 'exact', head: true })
                .eq('collection_id', collection.id)
                .eq('user_id', currentUser.id);

              if (countError) {
                console.warn(`Error getting file count for collection ${collection.id}:`, countError);
              }
              
              const status = notesData && notesData.length > 0 ? 'completed' : 'processing';
              const fileCount = count || 0;

              return {
                id: collection.id,
                name: collection.name,
                status,
                created_at: collection.created_at,
                fileCount,
              };
            } catch (error) {
              console.error(`Error processing collection ${collection.id}:`, error);
              return {
                id: collection.id,
                name: collection.name,
                status: 'processing',
                created_at: collection.created_at,
                fileCount: 0,
              };
            }
          })
        );
        setDocuments(collectionsWithStatus as any);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'analyzed':
        return 'text-purple-600 bg-purple-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
      case 'analyzed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48 lg:w-64"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalDocuments}</h3>
              <p className="text-sm text-gray-600">Total Documents</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.topicsGenerated}</h3>
              <p className="text-sm text-gray-600">Topics Generated</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.lastStudySession}</h3>
              <p className="text-sm text-gray-600">Last Study Session</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
                <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Study Materials
                </h2>
                <p className="text-gray-600 mb-6">
                  Drag & drop PDFs, PPTs, or DOCs here to instantly generate AI summaries
                </p>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  <UploadIcon className="w-5 h-5" />
                  Browse Files
                </Link>
              </div>

              {/* Folders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Folders</h3>
                  <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <FolderPlus className="w-4 h-4" />
                    New folder
                  </button>
                </div>
                <div className="space-y-3">
                  {folders.length > 0 ? (
                    folders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => router.push(`/notes/${folder.id}`)}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                              <p className="text-sm text-gray-500">{folder.count} {folder.count === 1 ? 'file' : 'files'}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => toggleSaveFolder(folder.id, e)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            title={savedFolders.has(folder.id) ? 'Unsave folder' : 'Save folder'}
                          >
                            {savedFolders.has(folder.id) ? (
                              <BookmarkCheck className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Bookmark className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No collections yet</p>
                      <p className="text-xs mt-1">Create your first collection by uploading documents</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {documents.length > 0 ? (
                  documents.map((doc) => {
                    const timeAgo = (() => {
                      const date = new Date(doc.created_at);
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
                    })();

                    return (
                      <div 
                        key={doc.id} 
                        onClick={() => router.push(`/notes/${doc.id}`)}
                        className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${getStatusColor(doc.status || 'pending')}`}>
                          {getStatusIcon(doc.status || 'pending')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {doc.fileCount || 0} {doc.fileCount === 1 ? 'file' : 'files'} • {timeAgo}
                          </p>
                          <p className={`text-xs mt-1 ${getStatusColor(doc.status || 'pending')} inline-block px-2 py-0.5 rounded`}>
                            {doc.status === 'completed' && 'Completed'}
                            {doc.status === 'processing' && 'Processing'}
                            {doc.status === 'failed' && 'Failed'}
                            {!doc.status && 'Pending'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No notes yet. Upload your first document.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>

      {/* Floating Feedback Button */}
      <FeedbackButton userId={user?.id} userEmail={user?.email} />
    </div>
  );
}

