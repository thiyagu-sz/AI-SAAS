'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import { 
  FolderOpen, 
  BookmarkCheck,
  Loader2,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface SavedFolder {
  id: string;
  name: string;
  count: number;
  created_at: string;
}

export default function SavedItemsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedFolders, setSavedFolders] = useState<SavedFolder[]>([]);
  const [savedFolderIds, setSavedFolderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await loadSavedFolders();
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const loadSavedFolders = async () => {
    try {
      // Load saved folder IDs from localStorage
      const saved = localStorage.getItem('savedFolders');
      const savedIds = saved ? new Set(JSON.parse(saved)) : new Set<string>();
      setSavedFolderIds(savedIds);

      if (savedIds.size === 0) {
        setSavedFolders([]);
        return;
      }

      // Fetch folder details from Supabase
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: collections, error } = await supabase
        .from('collections')
        .select('id, name, created_at')
        .eq('user_id', currentUser.id)
        .in('id', Array.from(savedIds));

      if (error) {
        console.error('Error fetching saved folders:', error);
        setSavedFolders([]);
        return;
      }

      if (collections && collections.length > 0) {
        // Get file counts for each collection
        const foldersWithCounts = await Promise.all(
          collections.map(async (collection) => {
            try {
              const { count, error: countError } = await supabase
                .from('document_collections')
                .select('*', { count: 'exact', head: true })
                .eq('collection_id', collection.id)
                .eq('user_id', currentUser.id);

              if (countError && countError.code !== 'PGRST116') {
                console.warn(`Error getting file count for collection ${collection.id}:`, countError);
              }

              return {
                id: collection.id,
                name: collection.name,
                count: count || 0,
                created_at: collection.created_at,
              };
            } catch (error) {
              console.error(`Error processing collection ${collection.id}:`, error);
              return {
                id: collection.id,
                name: collection.name,
                count: 0,
                created_at: collection.created_at,
              };
            }
          })
        );

        setSavedFolders(foldersWithCounts);
      } else {
        setSavedFolders([]);
      }
    } catch (error) {
      console.error('Error loading saved folders:', error);
      setSavedFolders([]);
    }
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

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            {savedFolders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => router.push(`/notes/${folder.id}`)}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FolderOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {folder.count} {folder.count === 1 ? 'file' : 'files'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimeAgo(folder.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="p-2">
                        <BookmarkCheck className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookmarkCheck className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved items yet</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Save folders from the Dashboard to access them quickly here.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


