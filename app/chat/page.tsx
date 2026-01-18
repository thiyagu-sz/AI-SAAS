'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import FeedbackForm from '@/app/components/FeedbackForm';
import { renderMarkdown } from '@/app/lib/markdown';
import { generateProfessionalHTML } from '@/app/lib/pdfGenerator';
import { 
  MessageSquare,
  Send,
  Loader2,
  Search,
  Bell,
  FileText,
  File,
  X,
  Check,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ name: string; page?: string }>;
  timestamp: Date;
}

type FormatType = 'key-points' | 'main-concepts' | 'exam-points' | 'short-notes' | 'speech-notes' | 'presentation-notes' | 'summary';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveChat, setSaveChat] = useState(true); // Save chats by default
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('key-points');
  const [wordCount, setWordCount] = useState<number>(100);
  const [customWordCount, setCustomWordCount] = useState<string>('');
  const [showToast, setShowToast] = useState({ show: false, message: '' });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedHistoryMessages, setExpandedHistoryMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);

  // Handle Mobile Keyboard and Visual Viewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const vHeight = viewport.height;
      const windowHeight = window.innerHeight;
      
      // Detect if keyboard is likely open (viewport height significantly less than window height)
      const keyboardActive = windowHeight - vHeight > 150;
      setIsKeyboardOpen(keyboardActive);
      setViewportHeight(`${vHeight}px`);

      // If keyboard is opening, scroll to bottom
      if (keyboardActive) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    // Initial check
    handleViewportChange();
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);



  // Remove raw markdown bold markers that break UI (e.g. **bold**)
  const sanitizeContent = (text: string | undefined | null) => {
    if (!text) return '';
    return text;
  };

  // 1. Handle Auth
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Helper to get user-specific localStorage key
  const getStorageKey = useCallback((userId: string | undefined) => {
    return userId ? `ai_chat_draft_${userId}` : 'ai_chat_draft';
  }, []);

  // Load chat history list
  const loadChatHistory = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/chat/history?limit=10', {
        headers: {
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, []);

  // Load conversation from API
  const loadConversation = useCallback(async (conversationId: string) => {
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
          content: sanitizeContent(msg.content),
          sources: msg.sources,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, []);

  // 2. Handle Conversation Loading (Reactive to URL)
  const conversationIdFromUrl = searchParams.get('id');

  useEffect(() => {
    if (loading || !user) return;

    if (conversationIdFromUrl) {
      if (conversationIdFromUrl !== currentConversationId) {
        loadConversation(conversationIdFromUrl);
        setCurrentConversationId(conversationIdFromUrl);
        setSaveChat(true);
      }
    }
  }, [conversationIdFromUrl, loading, user, currentConversationId, loadConversation]);

  // Clear any non-user-specific draft on mount (migration cleanup)
  useEffect(() => {
    try {
      // Remove old global key if it exists (one-time migration)
      localStorage.removeItem('ai_chat_draft');
    } catch (e) { /* ignore */ }
  }, []);

  // Try to restore draft immediately on mount (before auth completes). Skip if URL contains a conversation id.
  // NOTE: We can't restore here without user ID, so we'll wait for auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('id')) return; // prefer server-stored conversation when present
    // Early restore skipped - will restore after auth completes with user-specific key
  }, []);

  // Persist messages and some meta to localStorage so chats survive refresh
  // Use user-specific key to prevent cross-user data leakage
  useEffect(() => {
    // Avoid writing to localStorage on the very first render — this prevents overwriting
    // an existing draft that we're about to restore.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    // Don't save if no user (not authenticated yet)
    if (!user?.id) return;
    
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
      localStorage.setItem(getStorageKey(user.id), JSON.stringify(payload));
    } catch (e) {
      // Ignore storage errors (e.g. private mode)
      console.error('Failed to persist chat draft:', e);
    }
  }, [messages, currentConversationId, saveChat, selectedFormat, wordCount, user?.id, getStorageKey]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Restore draft from localStorage after auth/checks complete — only when there's no conversation loaded
  // Use user-specific key for isolation between users
  useEffect(() => {
    if (loading) return; // wait until auth/loadConversation completed
    if (!user?.id) return; // need user ID for user-specific key
    // If a conversation was explicitly loaded via URL, prefer that
    if (currentConversationId) return;

    try {
      const raw = localStorage.getItem(getStorageKey(user.id));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        const restored: Message[] = parsed.messages.map((m: any) => ({
          ...m,
          content: sanitizeContent(m.content),
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
  }, [loading, currentConversationId, user?.id, getStorageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    if (input.length > 0 && !showFormatOptions) {
      setShowFormatOptions(true);
    }
  }, [input, showFormatOptions]);

  useEffect(() => {
    if (user?.id) {
      loadChatHistory();
    }
  }, [user?.id, loadChatHistory]);

  useEffect(() => {
    const handleChatSaved = () => {
      setTimeout(() => {
        loadChatHistory();
      }, 500);
    };

    window.addEventListener('chatSaved', handleChatSaved);
    return () => window.removeEventListener('chatSaved', handleChatSaved);
  }, [loadChatHistory]);

  const handleInputFocus = () => {
    setShowFormatOptions(true);
    // Smooth scroll to bottom on focus to ensure input is visible above keyboard
    if (typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
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

  const isValidContent = (text: string): boolean => {
    const words = text.toLowerCase().split(/\s+/);
    const hasRepeatingChars = /(.)\1{4,}/.test(text);
    const hasVowels = /[aeiou]/i.test(text);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const commonWords = words.filter(w => /^[a-z]{3,}$/i.test(w)).length;
    
    return !hasRepeatingChars && hasVowels && avgWordLength < 20 && commonWords > 0;
  };

  const showAboutMessage = () => {
    const aboutMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `# 📚 Welcome to QuickNotes!

## What is QuickNotes?
QuickNotes is your personal study assistant that transforms any content into organized, formatted study notes in seconds.

## How to Use:

### Step 1: Paste Your Content
- Copy and paste your lecture notes, articles, research papers, or any study material into the text field below
- You can paste from websites, PDFs, books, or any text source

### Step 2: Choose Your Format
- **Key Points**: Essential information organized by topic
- **Main Concepts**: Detailed explanations of core concepts
- **Exam Points**: Content formatted for exam preparation
- **Short Notes**: Concise, scannable notes
- **Speech Notes**: Content organized for verbal presentation
- **Presentation Notes**: Formatted for slide/presentation structure
- **Summary**: Comprehensive overview of all main points

### Step 3: Set Word Count
- Choose from 50, 100, or 200 words
- Or enter a custom word count
- Longer content = more detailed notes

### Step 4: Export
- Click **Export PDF** to download professional PDF document
- Click **Export DOC** to download as Word document
- Or copy the generated text directly

## Tips:
✅ Paste full paragraphs or entire documents
✅ Longer content produces better formatted notes
✅ Experiment with different formats
✅ Adjust word count based on your needs
✅ All your notes are automatically saved

---

**Ready to get started?** Paste your study material in the text field below!`,
      timestamp: new Date(),
    };
    setMessages([aboutMessage]);
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

    if (!isValidContent(userInput)) {
      setInput('');
      setShowFormatOptions(false);
      showAboutMessage();
      return;
    }

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
      // Store the returned conversation ID to use for assistant message
      let savedConversationId: string | null = null;
      if (saveChat && currentUser) {
        try {
          savedConversationId = await saveMessageToDatabase(userMessage, currentUser.id);
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
              // Pass the conversation ID from when we saved the user message
              if (saveChat && currentUser) {
                try {
                  await saveMessageToDatabase(assistantMessage, currentUser.id, savedConversationId);
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
                  assistantMessage.content += sanitizeContent(parsed.content);
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
  // Returns the conversation ID (new or existing)
  const saveMessageToDatabase = async (message: Message, userId: string, existingConvId?: string | null): Promise<string | null> => {
    if (!saveChat) {
      return existingConvId || currentConversationId; // Don't save if checkbox is OFF
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      // Use passed conversation ID or fall back to state
      let conversationId = existingConvId || currentConversationId;

      // Helper to extract useful error info from a non-OK response
      const extractError = async (res: Response) => {
        let body: any = null;
        try {
          const text = await res.text();
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
        } catch (e) {
          body = null;
        }
        return { status: res.status, body };
      };

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
          try { localStorage.removeItem(getStorageKey(user?.id)); } catch (e) { /* ignore */ }
          // Ensure URL stays at /chat without id to keep user on same page
          if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, '', '/chat');
          }
          // Dispatch event to refresh sidebar with a small delay
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('chatSaved'));
          }, 300);
        } else {
          // Improve logging: include status and body (JSON or text)
          const info = await extractError(createResponse);
          console.error('Create conversation failed:', info);

          let errorMessage = `Failed to create conversation (status ${info.status})`;
          if (info.body) {
            if (typeof info.body === 'object') {
              errorMessage = info.body.error || info.body.details || JSON.stringify(info.body) || errorMessage;
            } else if (typeof info.body === 'string' && info.body.trim()) {
              errorMessage = info.body;
            }
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
          const info = await extractError(updateResponse);
          console.error('Update conversation failed:', info);

          let errorMessage = `Failed to save message (status ${info.status})`;
          if (info.body) {
            if (typeof info.body === 'object') {
              errorMessage = info.body.error || info.body.details || JSON.stringify(info.body) || errorMessage;
            } else if (typeof info.body === 'string' && info.body.trim()) {
              errorMessage = info.body;
            }
          }
          throw new Error(errorMessage);
        }

        console.log('Message saved to conversation:', conversationId);
        // Clear the local draft now that message is persisted
        try { localStorage.removeItem(getStorageKey(user?.id)); } catch (e) { /* ignore */ }
        // Dispatch event to refresh sidebar with a small delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('chatSaved'));
        }, 300);
      }
      
      return conversationId;
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
    
    return null; // Fallback return
  };

  const handleViewPreviousChat = useCallback(async (conversationId: string) => {
    if (expandedHistoryId === conversationId) {
      setExpandedHistoryId(null);
      setExpandedHistoryMessages([]);
    } else {
      setExpandedHistoryId(conversationId);
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
            content: sanitizeContent(msg.content),
            sources: msg.sources,
            timestamp: new Date(msg.created_at),
          }));
          setExpandedHistoryMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    }
  }, [expandedHistoryId]);

  const downloadFile = (blob: Blob, filename: string) => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = filename;
        
        document.body.appendChild(link);
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  const handleExport = useCallback(async (type: 'pdf' | 'doc', messageContent: string) => {
    if (!user || !messageContent) {
      showToastMessage('Cannot export: No content available');
      return;
    }
    if (isExporting) return;
    setIsExporting(true);

    try {
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content.substring(0, 50) || 'Study Notes';
      const cleanTitle = title.replace(/[^a-z0-9]/gi, '_');

      if (type === 'pdf') {
        const htmlDocument = generateProfessionalHTML(messageContent, title);
        showToastMessage('Generating PDF...');
        
        try {
          const response = await fetch('/api/chat/pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              html: htmlDocument,
              filename: `${cleanTitle}.pdf`,
            }),
          });

          if (!response.ok) {
            throw new Error(`Document generation failed: ${response.statusText}`);
          }

          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('Generated PDF is empty');
          }
          
          downloadFile(blob, `${cleanTitle}.pdf`);
          showToastMessage('PDF downloaded successfully!');
        } catch (pdfError) {
          console.error('PDF export error:', pdfError);
          showToastMessage('Trying text file export...');
          
          try {
            const textBlob = new Blob([messageContent], { type: 'text/plain; charset=utf-8' });
            downloadFile(textBlob, `${cleanTitle}.txt`);
            showToastMessage('Downloaded as text file');
          } catch (fallbackError) {
            console.error('Fallback export error:', fallbackError);
            showToastMessage('Could not export. Please copy text manually.');
          }
        }
      } else if (type === 'doc') {
        try {
          const cleanContent = messageContent.replace(/[*#\[\]]/g, '');
          const blob = new Blob([cleanContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          downloadFile(blob, `${cleanTitle}.docx`);
          showToastMessage('Document downloaded successfully');
        } catch (docError) {
          console.error('DOC export error:', docError);
          showToastMessage('Could not export as document. Please try PDF instead.');
        }
      }

      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/chat/export', {
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
      } catch (apiError) {
        console.error('Export API error:', apiError);
      }

    } catch (error) {
      console.error('Export error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Export failed';
      showToastMessage(errorMsg);
    } finally {
      setIsExporting(false);
    }
  }, [user, messages, currentConversationId, isExporting]);

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
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 overflow-hidden fixed inset-0 w-screen h-screen" style={{ height: viewportHeight }}>
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Top Navbar - Match Dashboard */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">AI Assistant</h1>
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    setMessages([]);
                    setInput('');
                    setCurrentConversationId(null);
                    setShowFormatOptions(false);
                  }}
                  className="px-2 py-1 text-xs sm:text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors font-medium whitespace-nowrap hidden sm:inline-block"
                  title="Start a new chat"
                >
                  + New Chat
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                title="Send feedback"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <button className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors touch-target">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto bg-white scroll-smooth" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 pb-24 sm:pb-28">
            {messages.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Welcome to QuickNotes! 📚</h2>
                <p className="text-gray-600 text-xs sm:text-sm max-w-sm mx-auto mb-3 sm:mb-4">
                  Paste your study content into the text field below, then select your desired output format.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 max-w-sm mx-auto text-left">
                  <p className="text-xs font-semibold text-blue-900 mb-2">✨ How to use:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>📋 Paste your content in the chat below</li>
                    <li>🎯 Select format: Key Points, Summary, Exam Notes, etc.</li>
                    <li>📊 Set word count for your output</li>
                    <li>💾 Export as PDF or download</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const lastAssistantIndex = messages.map((m, i) => ({ role: m.role, index: i }))
                    .filter(({ role }) => role === 'assistant')
                    .pop()?.index ?? -1;
                  const isLastAssistantMessage = message.role === 'assistant' && index === lastAssistantIndex;

                  return (
                    <div key={message.id} className={`flex mb-3 sm:mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-1.5 sm:gap-3 max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                          <div className={`rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className={`leading-relaxed ${
                              message.role === 'user' 
                                ? 'text-white text-sm' 
                                : 'text-gray-900 text-sm max-w-none'
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
          <div className="bg-white border-t border-gray-200 p-3 sm:p-4 max-h-[45vh] sm:max-h-[40vh] overflow-y-auto">
            <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">How do you want the output?</h3>
                <button
                  onClick={() => setShowFormatOptions(false)}
                  className="p-1 hover:bg-gray-100 rounded touch-target"
                  aria-label="Close options"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFormat(option.value)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 touch-target ${
                      selectedFormat === option.value
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:gap-4">
                <label className="text-xs sm:text-sm text-gray-700 font-medium">Word count:</label>
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 200].map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        setWordCount(count);
                        setCustomWordCount('');
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors touch-target ${
                        wordCount === count && !customWordCount
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
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
                    className="w-18 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <footer className="bg-white border-t border-gray-200 z-20 flex-shrink-0 pb-[max(env(safe-area-inset-bottom),8px)]">
          <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
            {/* Save Chat Toggle - Hidden on small mobile when keyboard is open to save space */}
            <div className={`mb-2 flex items-center justify-between flex-wrap gap-2 ${isKeyboardOpen ? 'hidden sm:flex' : 'flex'}`}>
              <label className="flex items-center gap-2 cursor-pointer touch-target">
                <input
                  type="checkbox"
                  checked={saveChat}
                  onChange={(e) => setSaveChat(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-gray-700">Save chat</span>
              </label>
              {saveChat && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Check className="w-3 h-3" />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-bold">Autosave active</span>
                </div>
              )}
            </div>

            <div className="flex items-end gap-1.5 sm:gap-3">
              <div className="flex-1 border border-gray-300 rounded-2xl focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white min-w-0 transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={handleKeyPress}
                  onFocus={handleInputFocus}
                  onPaste={handleInputPaste}
                  placeholder="Paste your content..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-none rounded-2xl focus:ring-0 focus:outline-none resize-none text-sm sm:text-base bg-transparent max-h-[120px] leading-relaxed"
                  rows={1}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center bg-blue-600 text-white w-10 h-10 sm:w-11 sm:h-11 rounded-full hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm hover:shadow-md touch-target"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </footer>

        {/* Toast Notification */}
        {showToast.show && (
          <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5">
            <Check className="w-5 h-5" />
            <span>{showToast.message}</span>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <FeedbackForm
            userId={user?.id}
            userEmail={user?.email}
            onClose={() => setShowFeedbackModal(false)}
            onSubmitSuccess={() => {
              setShowFeedbackModal(false);
              setShowToast({ show: true, message: 'Thank you for your feedback!' });
              setTimeout(() => setShowToast({ show: false, message: '' }), 3000);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
