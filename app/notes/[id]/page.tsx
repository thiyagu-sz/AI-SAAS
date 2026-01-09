'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import {
  FileText,
  Download,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  X,
  FileDown,
} from 'lucide-react';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export default function NotesViewerPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [exporting, setExporting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await fetchCollectionData();
      setLoading(false);
    };

    checkAuth();
  }, [router, collectionId]);

  // Auto-refresh/poll for notes if they don't exist yet
  useEffect(() => {
    if (!note && collection && !loading && collectionId) {
      // Start polling every 3 seconds if notes don't exist
      setIsPolling(true);
      let pollCount = 0;
      const maxPolls = 40; // 2 minutes (40 * 3 seconds)
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`Polling for notes... (attempt ${pollCount}/${maxPolls})`);
        try {
          await fetchCollectionData();
        } catch (error) {
          console.error('Error during polling:', error);
        }
        
        // Stop if we've polled too many times
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setIsPolling(false);
          console.log('Stopped polling after maximum attempts');
        }
      }, 3000); // Check every 3 seconds

      return () => {
        clearInterval(pollInterval);
      };
    } else if (note) {
      // Stop polling once notes are found
      setIsPolling(false);
    }
  }, [note, collection, loading, collectionId]);

  const fetchCollectionData = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser || !collectionId) {
        setLoading(false);
        return;
      }

      // Fetch collection
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .eq('user_id', currentUser.id)
        .single();

      if (collectionError || !collectionData) {
        console.error('Collection not found:', collectionError);
        if (collectionError?.code === 'PGRST116' || collectionError?.message?.includes('does not exist')) {
          console.warn('Collections table does not exist yet. Please run the SQL schema from SUPABASE_SCHEMA.md');
        }
        router.push('/dashboard');
        setLoading(false);
        return;
      }

      setCollection(collectionData);

      // Fetch notes (don't use .single() as it throws if no notes exist)
      // Try to select common fields and be tolerant of different schemas
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('id, content, body, note, text, created_at, user_id')
        .eq('collection_id', collectionId)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (notesError) {
        // If table doesn't exist, that's okay - notes might still be generating
        if (notesError.code === 'PGRST116' || notesError.message?.includes('does not exist')) {
          console.warn('Notes table does not exist yet. Please run the SQL schema from SUPABASE_SCHEMA.md');
        } else {
          console.error('Error fetching notes:', notesError);
        }
        // Don't set note if there's an error
      } else if (notesData && notesData.length > 0) {
        // Determine the content field flexibly
        const raw = notesData[0] as any;
        const content = raw.content ?? raw.body ?? raw.note ?? raw.text ?? '';

        if (content && content.trim().length > 0) {
          console.log('✅ Notes found!', notesData[0].id);
          setNote({ id: raw.id, content, created_at: raw.created_at });
          setIsPolling(false);
        } else {
          console.log('Notes row found but content empty. Waiting for generator to fill content.');
        }
      } else {
        console.log('⏳ No notes found yet, still generating...');
      }

      // Fetch documents in this collection (from document_collections table)
      const { data: documentsData, error: documentsError } = await supabase
        .from('document_collections')
        .select('id, file_name, file_type, file_size, created_at')
        .eq('collection_id', collectionId)
        .eq('user_id', currentUser.id);

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        // Try fallback to documents table if document_collections doesn't work
        const { data: directDocs, error: directError } = await supabase
          .from('documents')
          .select('id, file_name, file_type, file_size, created_at')
          .eq('user_id', currentUser.id);
        
        if (!directError && directDocs) {
          setDocuments(directDocs.map((doc: any) => ({
            id: doc.id,
            name: doc.file_name || doc.name,
            file_url: doc.file_url || '',
            file_size: doc.file_size || 0,
            file_type: doc.file_type || '',
            created_at: doc.created_at,
          })));
        }
      } else if (documentsData) {
        // Map document_collections structure to expected format
        setDocuments(documentsData.map((doc: any) => ({
          id: doc.id,
          name: doc.file_name,
          file_url: '', // Not stored in document_collections
          file_size: doc.file_size || 0,
          file_type: doc.file_type || '',
          created_at: doc.created_at,
        })));
      }

      // Ensure loading is off after the fetch
      setLoading(false);
    } catch (error) {
      console.error('Error fetching collection data:', error);
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes == null) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleExport = async () => {
    if (!note) return;

    setExporting(true);
    const supabase = getSupabaseClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      setExporting(false);
      router.push('/login');
      return;
    }

    try {
      // Insert export record
      const { data: exportData, error: exportError } = await supabase
        .from('exports')
        .insert([
          {
            user_id: currentUser.id,
            collection_id: collectionId,
            note_id: note.id,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (exportError) {
        throw exportError;
      }

      const exportId = exportData.id;

      // Polling function to check export status
      const checkExportStatus = async (attempts: number = 0) => {
        if (attempts > 20) {
          console.log('Max attempts reached, stopping export status checks.');
          return;
        }

        setTimeout(async () => {
          try {
            const { data: statusData, error: statusError } = await supabase
              .from('exports')
              .select('status, download_url')
              .eq('id', exportId)
              .single();

            if (statusError) {
              throw statusError;
            }

            if (statusData.status === 'completed') {
              // Download URL should be available now
              window.open(statusData.download_url, '_blank');
              setExporting(false);
            } else if (statusData.status === 'failed') {
              console.error('Export failed');
              setExporting(false);
            } else {
              // Not completed yet, continue polling
              console.log(`Export status: ${statusData.status}. Checking again...`);
              checkExportStatus(attempts + 1);
            }
          } catch (error) {
            console.error('Error checking export status:', error);
            setExporting(false);
          }
        }, 5000); // Check every 5 seconds
      };

      // Start checking export status
      checkExportStatus();
    } catch (error) {
      console.error('Error during export:', error);
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!note) return;

    setExporting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${collection?.name || 'Study Notes'}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                h1 { color: #1a1a1a; }
                pre { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>${collection?.name || 'Study Notes'}</h1>
              <pre>${note.content}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToDOC = async () => {
    if (!note) return;

    setExporting(true);
    try {
      const content = `${collection?.name || 'Study Notes'}\n\n${note.content}`;
      const blob = new Blob([content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection?.name || 'notes'}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export DOC. Please try again.');
    } finally {
      setExporting(false);
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

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{collection?.name || 'Study Notes'}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {documents.length} {documents.length === 1 ? 'file' : 'files'} • Created{' '}
                  {collection?.created_at ? new Date(collection.created_at).toLocaleDateString() : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportToPDF}
                disabled={!note || exporting}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={exportToDOC}
                disabled={!note || exporting}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                Export DOC
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Notes</h2>
                {note ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{note.content}</pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="mb-2 font-medium">Notes are being generated...</p>
                    <p className="text-xs text-gray-400 mb-4">
                      {isPolling
                        ? 'Checking for notes automatically... (This may take 30-60 seconds)'
                        : 'This may take a few moments. Click refresh to check again.'}
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const res = await fetch(`/api/notes/generate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ collectionId }),
                          });
                          if (!res.ok) {
                            const text = await res.text().catch(() => 'Failed');
                            console.error('Generate API error:', res.status, text);
                            alert('Failed to generate notes. See console for details.');
                          } else {
                            // Wait briefly then refresh data
                            await new Promise(r => setTimeout(r, 800));
                            await fetchCollectionData();
                          }
                        } catch (e) {
                          console.error('Generate error:', e);
                          alert('Failed to generate notes. See console for details.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                     >
                      {isPolling ? 'Checking...' : 'Generate Now'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Files Sidebar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h3>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatFileSize(doc.file_size)}</p>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No files in this collection</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

