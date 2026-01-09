'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import { renderMarkdown } from '@/app/lib/markdown';
import { 
  MessageSquare,
  Send,
  Loader2,
  Search,
  Bell,
  Save,
  Download,
  FileText,
  File,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ name: string; page?: string }>;
  timestamp: Date;
}

type FormatType = 'key-points' | 'main-concepts' | 'exam-points' | 'short-notes' | 'speech-notes' | 'presentation-notes' | 'summary';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gpt-3.5' | 'gpt-4'>('gpt-4');
  const [saveChat, setSaveChat] = useState(false);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('key-points');
  const [wordCount, setWordCount] = useState<number>(100);
  const [customWordCount, setCustomWordCount] = useState<string>('');
  const [showToast, setShowToast] = useState({ show: false, message: '' });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      
      // Load conversation if ID is in URL
      const conversationId = searchParams.get('id');
      if (conversationId) {
        await loadConversation(conversationId);
        setCurrentConversationId(conversationId);
        setSaveChat(true); // Auto-enable save if loading existing conversation
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router, searchParams]);

  // Try to restore draft immediately on mount (before auth completes). Skip if URL contains a conversation id.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('id')) return; // prefer server-stored conversation when present

      const raw = localStorage.getItem('ai_chat_draft');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        const restored: Message[] = parsed.messages.map((m: any) => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        }));
        setMessages(restored);

        if (parsed.meta) {
          if (typeof parsed.meta.saveChat === 'boolean') setSaveChat(parsed.meta.saveChat);
          if (parsed.meta.selectedFormat) setSelectedFormat(parsed.meta.selectedFormat);
          if (parsed.meta.wordCount) setWordCount(parsed.meta.wordCount);
          if (parsed.meta.currentConversationId) setCurrentConversationId(parsed.meta.currentConversationId);
        }

        // brief toast to indicate restoration
        setShowToast({ show: true, message: 'Restored chat draft' });
        setTimeout(() => setShowToast({ show: false, message: '' }), 2000);
      }
    } catch (e) {
      console.error('Failed to restore early chat draft:', e);
    }
  }, []);

  // Persist messages and some meta to localStorage so chats survive refresh
  useEffect(() => {
    // Avoid writing to localStorage on the very first render — this prevents overwriting
    // an existing draft that we're about to restore.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    try {
      const payload = {
        messages,
        meta: {
          currentConversationId,
          saveChat,
          selectedFormat,
          wordCount,
        },
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('ai_chat_draft', JSON.stringify(payload));
    } catch (e) {
      // Ignore storage errors (e.g. private mode)
      console.error('Failed to persist chat draft:', e);
    }
  }, [messages, currentConversationId, saveChat, selectedFormat, wordCount]);

  // Restore draft from localStorage after auth/checks complete — only when there's no conversation loaded
  useEffect(() => {
    if (loading) return; // wait until auth/loadConversation completed
    // If a conversation was explicitly loaded via URL, prefer that
    if (currentConversationId) return;

    try {
      const raw = localStorage.getItem('ai_chat_draft');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        const restored: Message[] = parsed.messages.map((m: any) => ({
          ...m,
          // restore timestamp strings back to Date objects
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        }));
        setMessages(restored);

        if (parsed.meta) {
          if (parsed.meta.currentConversationId) setCurrentConversationId(parsed.meta.currentConversationId);
          if (typeof parsed.meta.saveChat === 'boolean') setSaveChat(parsed.meta.saveChat);
          if (parsed.meta.selectedFormat) setSelectedFormat(parsed.meta.selectedFormat);
          if (parsed.meta.wordCount) setWordCount(parsed.meta.wordCount);
        }

        // brief toast to indicate restoration
        setShowToast({ show: true, message: 'Restored chat from previous session' });
        setTimeout(() => setShowToast({ show: false, message: '' }), 2000);
      }
    } catch (e) {
      console.error('Failed to restore chat draft:', e);
    }
  }, [loading, currentConversationId]);

  const loadConversation = async (conversationId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/chat/load?id=${conversationId}`, {
        headers: {
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          sources: msg.sources,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    // Show options panel when user types (if input has content)
    if (input.length > 0 && !showFormatOptions) {
      setShowFormatOptions(true);
    }
  }, [input, showFormatOptions]);

  // Show options panel on focus or paste
  const handleInputFocus = () => {
    setShowFormatOptions(true);
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Show options panel after paste
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > 0) {
      setTimeout(() => {
        setShowFormatOptions(true);
      }, 0);
    }
  };

  const showToastMessage = (message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: '' }), 3000);
  };

  const generateFormatPrompt = (format: FormatType, wordCount: number, userInput: string): string => {
    const formatPrompts: Record<FormatType, string> = {
      'key-points': `Extract and organize KEY POINTS from the following content. 

REQUIREMENTS:
- Use markdown formatting (# for headings, - for bullet points)
- Focus ONLY on the most important information
- Use clear headings (##) to organize sections
- Use bullet points (-) for key points
- Use **bold** for important terms
- Keep paragraphs short (max 2-3 sentences)
- Limit to EXACTLY ${wordCount} words
- Structure: Main Topic → Key Points → Important Details
- Make it exam-friendly and readable

Content to process:
${userInput}`,
      'main-concepts': `Identify and explain the MAIN CONCEPTS from the following content.

REQUIREMENTS:
- Use markdown formatting (# for headings, - for lists)
- Provide clear definitions and explanations
- Use headings (##) for each main concept
- Use bullet points for supporting details
- Use **bold** for key terms and definitions
- Keep it structured and organized
- Limit to EXACTLY ${wordCount} words
- Make content clear and exam-friendly

Content to process:
${userInput}`,
      'exam-points': `Create EXAM-FOCUSED NOTES from the following content.

REQUIREMENTS:
- Use markdown formatting (# for headings, - for bullet points)
- Highlight information likely to appear in exams
- Include definitions, formulas, dates, names, and key facts
- Use headings (##) to organize by topic
- Use bullet points for key facts
- Use **bold** for important terms
- Keep paragraphs very short
- Limit to EXACTLY ${wordCount} words
- Structure for quick review and memorization

Content to process:
${userInput}`,
      'short-notes': `Create SHORT NOTES from the following content.

REQUIREMENTS:
- Use markdown formatting (# for headings, - for bullet points)
- Keep it concise and organized
- Use clear headings (##) for sections
- Use bullet points for key information
- Focus on essential information only
- Limit to EXACTLY ${wordCount} words
- Make it easy to scan and review

Content to process:
${userInput}`,
      'speech-notes': `Create SPEECH NOTES from the following content.

REQUIREMENTS:
- Use markdown formatting (# for headings, - for bullet points)
- Structure for verbal presentation
- Use headings (##) for main sections
- Use bullet points for talking points
- Keep it conversational and easy to follow
- Use **bold** for emphasis points
- Limit to EXACTLY ${wordCount} words
- Make it suitable for speaking

Content to process:
${userInput}`,
      'presentation-notes': `Create PRESENTATION NOTES from the following content.

REQUIREMENTS:
- Use markdown formatting (# for headings, - for bullet points)
- Structure for slides/presentation format
- Use headings (##) for each slide/topic
- Use bullet points for key takeaways
- Keep each section concise
- Use **bold** for emphasis
- Limit to EXACTLY ${wordCount} words
- Make it presentation-ready

Content to process:
${userInput}`,
      'summary': `Create a comprehensive SUMMARY from the following content.

REQUIREMENTS:
- Use markdown formatting (# for headings, - for bullet points)
- Cover all main points
- Use headings (##) to organize by topic
- Use bullet points for key information
- Use **bold** for important terms
- Keep it structured and comprehensive
- Limit to EXACTLY ${wordCount} words
- Make it complete but concise

Content to process:
${userInput}`,
    };

    return formatPrompts[format];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    let processedInput = userInput;

    // Apply format if format options are shown and user wants formatted output
    if (showFormatOptions && selectedFormat) {
      processedInput = generateFormatPrompt(selectedFormat, wordCount, userInput);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput, // Store original input
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setShowFormatOptions(false);
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('Auth error:', userError);
        throw new Error('Please log in to use the chat feature');
      }

      // Save user message immediately if saveChat is ON
      if (saveChat && currentUser) {
        try {
          await saveMessageToDatabase(userMessage, currentUser.id);
        } catch (saveError) {
          console.error('Error saving user message:', saveError);
          // Continue with chat even if save fails
        }
      }

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          question: processedInput,
          userId: currentUser.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API error:', response.status, errorData);
        let errorMessage = `API error (${response.status})`;
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorData.substring(0, 200) || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        let streamEnded = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (!assistantMessage.content) {
              assistantMessage.content = 'No response received from the AI. Please check your API key and try again.';
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMessage };
                return updated;
              });
            } else {
              // Save assistant message if toggle is ON
              if (saveChat && currentUser) {
                try {
                  await saveMessageToDatabase(assistantMessage, currentUser.id);
                } catch (saveError) {
                  console.error('Error saving assistant message:', saveError);
                  showToastMessage('Chat saved, but failed to save last message. Please try again.');
                }
              }
            }
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  assistantMessage.content = `Error: ${parsed.error}`;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...assistantMessage };
                    return updated;
                  });
                  streamEnded = true;
                  break;
                }
                if (parsed.content) {
                  assistantMessage.content += parsed.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...assistantMessage };
                    return updated;
                  });
                }
                if (parsed.sources) {
                  assistantMessage.sources = parsed.sources;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...assistantMessage };
                    return updated;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
          
          if (streamEnded) break;
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorDetails = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Error: ${errorDetails}\n\nPlease check:\n1. Your OpenRouter API key is set in .env.local\n2. The API key is valid\n3. Your internet connection is working\n\nTry refreshing the page and asking again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      showToastMessage(`Error: ${errorDetails}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save a single message to database (creates conversation if needed)
  const saveMessageToDatabase = async (message: Message, userId: string) => {
    if (!saveChat) {
      return; // Don't save if checkbox is OFF
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      let conversationId = currentConversationId;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        // Generate title from first user message
        const firstUserMessage = messages.find(m => m.role === 'user') || message;
        const title = firstUserMessage.content.substring(0, 50) || 'Chat Conversation';

        const createResponse = await fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
          },
          body: JSON.stringify({
            title: title,
            messages: [message].map(m => ({
              role: m.role,
              content: m.content,
              sources: m.sources,
            })),
            conversationId: null,
          }),
        });

        if (createResponse.ok) {
          const data = await createResponse.json();
          conversationId = data.id;
          setCurrentConversationId(conversationId);
          console.log('Conversation created:', conversationId);
          // Clear the local draft now that conversation is persisted
          try { localStorage.removeItem('ai_chat_draft'); } catch (e) { /* ignore */ }
          // Dispatch event to refresh sidebar with a small delay
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('chatSaved'));
          }, 300);
        } else {
          let errorMessage = 'Failed to create conversation';
          try {
            const errorData = await createResponse.json();
            // Check if error object has content
            if (errorData && typeof errorData === 'object') {
              errorMessage = errorData.error || errorData.details || errorMessage;
              // Only log if error has meaningful content
              const errorKeys = Object.keys(errorData);
              if (errorKeys.length > 0 && (errorData.error || errorData.details)) {
                console.error('Error creating conversation:', {
                  error: errorData.error,
                  details: errorData.details,
                  status: createResponse.status
                });
              }
            }
          } catch (parseError) {
            // If JSON parsing fails, try to get text
            const errorText = await createResponse.text().catch(() => 'Unknown error');
            errorMessage = errorText || errorMessage;
            console.error('Error creating conversation (non-JSON):', errorText);
          }
          throw new Error(errorMessage);
        }
      } else {
        // Update existing conversation - add new message
        const updateResponse = await fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
          },
          body: JSON.stringify({
            title: '', // Not needed for updates
            messages: [message].map(m => ({
              role: m.role,
              content: m.content,
              sources: m.sources,
            })),
            conversationId: conversationId,
          }),
        });

        if (!updateResponse.ok) {
          let errorMessage = 'Failed to save message';
          try {
            const errorData = await updateResponse.json();
            // Check if error object has content
            if (errorData && typeof errorData === 'object') {
              errorMessage = errorData.error || errorData.details || errorMessage;
              // Only log if error has meaningful content
              const errorKeys = Object.keys(errorData);
              if (errorKeys.length > 0 && (errorData.error || errorData.details)) {
                console.error('Error updating conversation:', {
                  error: errorData.error,
                  details: errorData.details,
                  status: updateResponse.status
                });
              }
            }
          } catch (parseError) {
            // If JSON parsing fails, try to get text
            const errorText = await updateResponse.text().catch(() => 'Unknown error');
            errorMessage = errorText || errorMessage;
            console.error('Error updating conversation (non-JSON):', errorText);
          }
          throw new Error(errorMessage);
        }
        
        console.log('Message saved to conversation:', conversationId);
        // Clear the local draft now that message is persisted
        try { localStorage.removeItem('ai_chat_draft'); } catch (e) { /* ignore */ }
        // Dispatch event to refresh sidebar with a small delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('chatSaved'));
        }, 300);
      }
    } catch (error) {
      // Only log if it's a real error with content
      if (error instanceof Error) {
        console.error('Error saving message to database:', error.message);
      } else if (error && typeof error === 'object') {
        const errorKeys = Object.keys(error);
        if (errorKeys.length > 0 || (error as any).message || (error as any).stack) {
          console.error('Error saving message to database:', error);
        }
      }
      // Don't show toast for save errors to avoid spam - just log
      throw error; // Re-throw to let caller handle
    }
  };

  const handleExport = useCallback(async (type: 'pdf' | 'doc', messageContent: string) => {
    if (!user || !messageContent || !messageContent.trim()) {
      console.error('Export: Missing user or message content', { user: !!user, content: !!messageContent });
      showToastMessage('Cannot export: No content available');
      return;
    }

    if (isExporting) {
      return; // Already exporting, ignore click
    }

    setIsExporting(true);

    try {
      // Generate title from first user message
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content.substring(0, 50) || 'Chat Export';

      // Clean content for export (remove markdown bold markers, keep structure)
      const cleanContent = messageContent.replace(/\*\*/g, '').trim();
      
      // Create and download file first (don't wait for API)
      if (type === 'pdf') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title}</title>
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
                <h1>${title}</h1>
                <pre style="font-family: inherit; white-space: pre-wrap;">${cleanContent}</pre>
              </body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 250);
        }
      } else {
        // Clean DOC export
        const blob = new Blob([cleanContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Save to exports in the background (non-blocking)
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        const exportResponse = await fetch('/api/chat/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
          },
          body: JSON.stringify({
            title: title,
            content: messageContent,
            type: type,
            conversationId: currentConversationId,
          }),
        });

        if (exportResponse.ok) {
          showToastMessage('Export created successfully');
          setTimeout(() => {
            router.push('/exports');
          }, 1500);
        } else {
          const errorData = await exportResponse.json().catch(() => ({}));
          console.error('Export API error:', exportResponse.status, errorData);
          // File was downloaded, but saving to DB failed - still show success for download
          showToastMessage('File exported successfully');
        }
      } catch (apiError) {
        // File was downloaded, but API call failed - still show success for download
        console.error('Export API error (file still downloaded):', apiError);
        showToastMessage('File exported successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToastMessage(`Failed to export: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  }, [user, messages, currentConversationId, isExporting, router]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter for newline (default behavior)
  };

  const formatOptions: { value: FormatType; label: string }[] = [
    { value: 'key-points', label: 'Key Points' },
    { value: 'main-concepts', label: 'Main Concepts' },
    { value: 'exam-points', label: 'Exam Points' },
    { value: 'short-notes', label: 'Short Notes' },
    { value: 'speech-notes', label: 'Speech Notes' },
    { value: 'presentation-notes', label: 'Presentation Notes' },
    { value: 'summary', label: 'Summary' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Navbar - Match Dashboard */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">How can I help you today?</h2>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Ask questions about your uploaded documents, generate study notes, or get help with your studies.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  // Find the last assistant message index
                  const lastAssistantIndex = messages.map((m, i) => ({ role: m.role, index: i }))
                    .filter(({ role }) => role === 'assistant')
                    .pop()?.index ?? -1;
                  const isLastAssistantMessage = message.role === 'assistant' && index === lastAssistantIndex;

                  return (
                    <div key={message.id} className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-white'
                        }`}>
                          {message.role === 'user' ? (
                            <span className="text-xs font-medium">
                              {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                            </span>
                          ) : (
                            <span className="text-xs">AI</span>
                          )}
                        </div>
                        <div className={`flex-1 min-w-0 ${message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className={`leading-relaxed ${
                              message.role === 'user' 
                                ? 'text-white text-sm' 
                                : 'text-gray-900 text-sm prose prose-sm max-w-none'
                            }`}>
                              {message.role === 'assistant' ? renderMarkdown(message.content) : message.content}
                            </div>
                            {message.sources && message.sources.length > 0 && (
                              <div className={`mt-4 pt-3 ${message.role === 'user' ? 'border-t border-white/30' : 'border-t border-gray-300'}`}>
                                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                                  message.role === 'user' ? 'text-white/80' : 'text-gray-600'
                                }`}>Sources</p>
                                <div className="flex flex-wrap gap-2">
                                  {message.sources.map((source, idx) => (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                        message.role === 'user' 
                                          ? 'bg-white/20 text-white' 
                                          : 'bg-white/50 text-gray-700'
                                      }`}
                                    >
                                      {source.name}
                                      {source.page && <span className={message.role === 'user' ? 'text-white/70' : 'text-gray-500'}>p. {source.page}</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Export buttons only on the LAST assistant message */}
                            {isLastAssistantMessage && message.content && message.content.trim().length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-300 flex flex-col sm:flex-row gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Export PDF button clicked');
                                    handleExport('pdf', message.content);
                                  }}
                                  disabled={isExporting}
                                  className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[32px] ${
                                    isExporting
                                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200 cursor-pointer'
                                  }`}
                                >
                                  {isExporting ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Exporting...
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="w-3.5 h-3.5" />
                                      Export PDF
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Export DOC button clicked');
                                    handleExport('doc', message.content);
                                  }}
                                  disabled={isExporting}
                                  className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[32px] ${
                                    isExporting
                                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200 cursor-pointer'
                                  }`}
                                >
                                  {isExporting ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Exporting...
                                    </>
                                  ) : (
                                    <>
                                      <File className="w-3.5 h-3.5" />
                                      Export DOC
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex mb-4 justify-start">
                    <div className="flex gap-3 max-w-[75%]">
                      <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">AI</span>
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                          <span className="text-sm text-gray-600">AI is thinking…</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </main>

        {/* Format Options Panel */}
        {showFormatOptions && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">How do you want the output?</h3>
                <button
                  onClick={() => setShowFormatOptions(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Close options"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFormat(option.value)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedFormat === option.value
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="text-sm text-gray-700 whitespace-nowrap">Word count:</label>
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 200].map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        setWordCount(count);
                        setCustomWordCount('');
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
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
                      if (val) {
                        setWordCount(parseInt(val) || 100);
                      }
                    }}
                    className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 sticky bottom-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
            {/* Save Chat Toggle */}
            <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveChat}
                  onChange={(e) => setSaveChat(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Save this chat for future reference</span>
              </label>
              {saveChat && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Check className="w-3 h-3" />
                  <span>Chat will be saved</span>
                </div>
              )}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 border border-gray-300 rounded-2xl focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={handleInputFocus}
                  onPaste={handleInputPaste}
                  placeholder="Message AI Assistant..."
                  className="w-full px-4 py-3 border-none rounded-2xl focus:ring-0 focus:outline-none resize-none text-sm bg-transparent"
                  rows={1}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast.show && (
          <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
            <Check className="w-5 h-5" />
            <span>{showToast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
