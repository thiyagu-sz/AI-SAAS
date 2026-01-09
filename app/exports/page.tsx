'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import { 
  Download,
  FileText,
  File,
  Loader2,
  ArrowDown
} from 'lucide-react';
import Link from 'next/link';

interface Export {
  id: string;
  title: string;
  collectionId?: string;
  conversationId?: string;
  type: 'pdf' | 'doc';
  createdAt: string;
  content?: string;
  source: 'collection' | 'chat';
}

export default function ExportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exports, setExports] = useState<Export[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await loadExports();
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const loadExports = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.error('No user found when loading exports');
        setExports([]);
        return;
      }

      const exportsList: Export[] = [];

      // Fetch collection exports (from notes)
      try {
        const { data: collections, error: collectionsError } = await supabase
          .from('collections')
          .select('id, name, created_at')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
        } else if (collections && collections.length > 0) {
          for (const collection of collections) {
            const { data: notes, error: notesError } = await supabase
              .from('notes')
              .select('id, content, created_at')
              .eq('collection_id', collection.id)
              .eq('user_id', currentUser.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (notesError) {
              console.error('Error fetching notes for collection:', collection.id, notesError);
            } else if (notes && notes.length > 0) {
              exportsList.push({
                id: `${collection.id}-pdf`,
                title: collection.name,
                collectionId: collection.id,
                type: 'pdf',
                createdAt: notes[0].created_at,
                content: notes[0].content,
                source: 'collection',
              });
              exportsList.push({
                id: `${collection.id}-doc`,
                title: collection.name,
                collectionId: collection.id,
                type: 'doc',
                createdAt: notes[0].created_at,
                content: notes[0].content,
                source: 'collection',
              });
            }
          }
        }
      } catch (collectionError) {
        console.error('Error processing collection exports:', collectionError);
      }

      // Fetch chat exports
      try {
        const { data: chatExports, error: chatExportsError } = await supabase
          .from('chat_exports')
          .select('id, title, content, type, created_at, conversation_id')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (chatExportsError) {
          // If Supabase returns an empty error object, skip noisy logging
          const keys = Object.keys(chatExportsError || {});
          if (keys.length === 0) {
            console.warn('Warning: Supabase returned an empty error object when fetching chat_exports. Treating as no chat exports.');
          } else {
            // Log useful fields only to avoid dumping large internal objects
            console.error('Error fetching chat exports:', {
              message: (chatExportsError as any).message || null,
              code: (chatExportsError as any).code || null,
              details: (chatExportsError as any).details || null,
              hint: (chatExportsError as any).hint || null,
            });
          }
        }

        // Process chat exports if they exist (even if there was an error, data might still be returned)
        if (chatExports && Array.isArray(chatExports) && chatExports.length > 0) {
          for (const chatExport of chatExports) {
            exportsList.push({
              id: chatExport.id,
              title: chatExport.title,
              conversationId: chatExport.conversation_id,
              type: chatExport.type as 'pdf' | 'doc',
              createdAt: chatExport.created_at,
              content: chatExport.content,
              source: 'chat',
            });
          }
        }
      } catch (chatExportError) {
        // Only log if it's a real error with content (not empty object)
        if (chatExportError && typeof chatExportError === 'object') {
          const errorKeys = Object.keys(chatExportError);
          if (errorKeys.length > 0 || (chatExportError as any).message || (chatExportError as any).stack) {
            console.error('Error processing chat exports:', chatExportError);
          }
        } else if (chatExportError) {
          console.error('Error processing chat exports:', chatExportError);
        }
      }

      // Sort by creation date (newest first)
      exportsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setExports(exportsList);
    } catch (error) {
      // Only log real errors, not empty error objects
      if (error && (error instanceof Error || typeof error === 'object')) {
        const errorObj = error as any;
        if (errorObj.message || errorObj.code || errorObj.stack) {
          console.error('Error loading exports:', error);
        }
      }
      setExports([]);
    }
  };

  const handleExport = async (exportItem: Export) => {
    try {
      if (!exportItem.content || !exportItem.content.trim()) {
        alert('No content available for export');
        return;
      }

      // Clean content (remove markdown bold markers, keep structure)
      const cleanContent = (exportItem.content || '').replace(/\*\*/g, '').trim();

      if (exportItem.type === 'pdf') {
        // PDF export using browser print - clean format
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${exportItem.title}</title>
                <style>
                  @media print {
                    body { margin: 0; padding: 0; }
                  }
                  body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    padding: 60px; 
                    line-height: 1.8; 
                    color: #1a1a1a;
                    background: white;
                    max-width: 800px;
                    margin: 0 auto;
                  }
                  h1 { 
                    color: #1a1a1a; 
                    margin-bottom: 24px;
                    margin-top: 0;
                    font-size: 28px;
                    font-weight: 600;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 12px;
                  }
                  h2 {
                    color: #1a1a1a;
                    margin-top: 32px;
                    margin-bottom: 16px;
                    font-size: 22px;
                    font-weight: 600;
                  }
                  h3 {
                    color: #374151;
                    margin-top: 24px;
                    margin-bottom: 12px;
                    font-size: 18px;
                    font-weight: 600;
                  }
                  p {
                    margin-bottom: 12px;
                    line-height: 1.8;
                  }
                  ul, ol {
                    margin-left: 24px;
                    margin-bottom: 16px;
                    padding-left: 0;
                  }
                  li {
                    margin-bottom: 8px;
                    line-height: 1.7;
                  }
                  pre { 
                    white-space: pre-wrap; 
                    font-family: inherit;
                    line-height: 1.8;
                  }
                  strong {
                    font-weight: 600;
                    color: #1a1a1a;
                  }
                </style>
              </head>
              <body>
                <h1>${exportItem.title}</h1>
                <pre style="font-family: inherit; white-space: pre-wrap;">${cleanContent}</pre>
              </body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 250);
        }
      } else {
        // DOC export - clean format
        const blob = new Blob([cleanContent], { 
          type: 'application/msword' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportItem.title.replace(/[^a-z0-9]/gi, '_')}.${exportItem.type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Export error details:', errorMessage);
      alert(`Failed to export: ${errorMessage}. Please try again.`);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <h1 className="text-2xl font-bold text-gray-900">Exports</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            {exports.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Notes Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {exports.map((exportItem) => (
                        <tr key={exportItem.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {exportItem.type === 'pdf' ? (
                                <FileText className="w-5 h-5 text-red-600" />
                              ) : (
                                <File className="w-5 h-5 text-blue-600" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{exportItem.title}</p>
                                {exportItem.source === 'collection' && exportItem.collectionId && (
                                  <Link
                                    href={`/notes/${exportItem.collectionId}`}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View notes
                                  </Link>
                                )}
                                {exportItem.source === 'chat' && (
                                  <span className="text-xs text-gray-500">From chat</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                              {exportItem.type}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(exportItem.createdAt)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleExport(exportItem)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <ArrowDown className="w-4 h-4" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No exports yet</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Generate notes from your documents to create exportable files.
                  </p>
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Upload Documents
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


