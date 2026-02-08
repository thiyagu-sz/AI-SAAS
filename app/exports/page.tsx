'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import FeedbackButton from '@/app/components/FeedbackButton';
import StatusModal from '@/app/components/StatusModal';
import { 
  Download,
  FileText,
  File,
  Loader2,
  ArrowDown,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import { copyToClipboard, extractTextFromMarkdown } from '@/app/lib/clipboard';

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
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
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
        setStatusModal({
          show: true,
          type: 'warning',
          title: 'No Content',
          message: 'No content available for export',
        });
        return;
      }

      // Clean content (remove markdown bold markers, keep structure)
      const cleanContent = (exportItem.content || '').replace(/\*\*/g, '').trim();

      // Create PDF directly
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font and styling
      doc.setFont('helvetica');
      
      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(exportItem.title, 20, 20);
      
      // Add a line under title
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      
      // Add content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Split content into lines that fit the page width
      const pageWidth = 170; // 210mm - 20mm margins on each side
      const lineHeight = 7;
      const maxLinesPerPage = 38; // Approximate lines per page
      
      const lines = doc.splitTextToSize(cleanContent, pageWidth);
      let yPosition = 35;
      let currentPage = 1;
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > 280) { // Near bottom of page
          doc.addPage();
          currentPage++;
          yPosition = 20;
        }
        doc.text(lines[i], 20, yPosition);
        yPosition += lineHeight;
      }
      
      // Add page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i} of ${totalPages}`, 105, 290, { align: 'center' });
      }
      
      // Save the PDF
      const filename = `${exportItem.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error exporting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Export error details:', errorMessage);
      setStatusModal({
        show: true,
        type: 'error',
        title: 'Export Failed',
        message: `Failed to export: ${errorMessage}. Please try again.`,
      });
    }
  };

  const handleCopy = async (exportItem: Export) => {
    if (!exportItem.content || exportItem.content.trim().length === 0) {
      setStatusModal({
        show: true,
        type: 'warning',
        title: 'Nothing to Copy',
        message: 'No content available to copy.',
      });
      return;
    }

    if (copyingId) return;
    setCopyingId(exportItem.id);

    try {
      // Extract plain text from markdown while preserving structure
      const plainText = extractTextFromMarkdown(exportItem.content);
      const result = await copyToClipboard(plainText);
      
      setStatusModal({
        show: true,
        type: result.success ? 'success' : 'error',
        title: result.success ? 'Copied' : 'Copy Failed',
        message: result.message,
      });
    } catch (error) {
      console.error('Copy error:', error);
      setStatusModal({
        show: true,
        type: 'error',
        title: 'Copy Failed',
        message: 'Unable to copy right now. Please try again.',
      });
    } finally {
      setCopyingId(null);
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
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {exports.map((exportItem) => (
                    <div key={exportItem.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {exportItem.type === 'pdf' ? (
                            <FileText className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <File className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{exportItem.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                                {exportItem.type}
                              </span>
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
                            <p className="text-xs text-gray-500 mt-1">{formatDate(exportItem.createdAt)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleExport(exportItem)}
                          className="flex items-center justify-center w-9 h-9 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          <ArrowDown className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleCopy(exportItem)}
                                  disabled={copyingId === exportItem.id || !exportItem.content || exportItem.content.trim().length === 0}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                    copyingId === exportItem.id || !exportItem.content || exportItem.content.trim().length === 0
                                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {copyingId === exportItem.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Copying...
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4" />
                                      Copy
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleExport(exportItem)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No exports yet</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Generate notes from your documents to create exportable files.
                  </p>
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
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

      {/* Floating Feedback Button */}
      <FeedbackButton userId={user?.id} userEmail={user?.email} />

      {/* Status Modal */}
      <StatusModal
        show={statusModal.show}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}


