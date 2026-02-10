'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import FeedbackForm from '@/app/components/FeedbackForm';
import { renderMarkdown } from '@/app/lib/markdown';
import { generateClientPDF } from '@/app/lib/clientPdfGenerator';
import { copyToClipboard, extractTextFromMarkdown } from '@/app/lib/clipboard';
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
  Copy,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ name: string; page?: string }>;
  timestamp: Date;
}

type FormatType = 'key-points' | 'main-concepts' | 'exam-points' | 'short-notes' | 'speech-notes' | 'presentation-notes' | 'summary' | 'mcqs' | 'quick-test';

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
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [showToast, setShowToast] = useState({ show: false, message: '' });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedHistoryMessages, setExpandedHistoryMessages] = useState<Message[]>([]);
  const [showQuickTestDifficulty, setShowQuickTestDifficulty] = useState(false);
  const [quickTestDifficulty, setQuickTestDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<{score: number, total: number, feedback: string} | null>(null);
  const [quickTestContent, setQuickTestContent] = useState<string>('');
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

  // Ensure scrolling works properly when quiz interface is shown/hidden
  useEffect(() => {
    if (currentQuiz && !isGeneratingQuiz) {
      // Allow time for UI to render then scroll to quiz
      setTimeout(() => {
        const quizElement = document.querySelector('[data-quiz-container]');
        if (quizElement) {
          quizElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
  }, [currentQuiz, isGeneratingQuiz]);

  // Reset scroll position when quiz is reset
  useEffect(() => {
    if (!currentQuiz && !showQuickTestDifficulty && !isGeneratingQuiz) {
      // Scroll to bottom when quiz is closed
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentQuiz, showQuickTestDifficulty, isGeneratingQuiz]);

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
    if (!text || text.trim().length < 5) return false;
    
    const trimmedText = text.trim();
    
    // More lenient validation for structured content
    const words = trimmedText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (words.length < 1) return false;
    
    // Check for alphabetic content (including tables, diagrams, etc.)
    const hasAlphabeticChars = /[a-z]/i.test(trimmedText);
    
    // Check for excessive repeating characters (more than 10 in a row)
    const hasExcessiveRepeatingChars = /(.)\1{10,}/.test(trimmedText);
    
    // Check if content is mostly symbols/special chars (less than 10% alphabetic)
    const alphabeticCount = (trimmedText.match(/[a-z]/gi) || []).length;
    const totalChars = trimmedText.length;
    const alphabeticRatio = alphabeticCount / totalChars;
    
    // Accept content that:
    // 1. Has some alphabetic characters
    // 2. Doesn't have excessive repeating characters
    // 3. Has at least 10% alphabetic content (allows for tables, code, diagrams)
    const isValid = hasAlphabeticChars && 
                   !hasExcessiveRepeatingChars && 
                   alphabeticRatio >= 0.1;
    
    return isValid;
  };

  const showAboutMessage = () => {
    const aboutMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `#  Welcome to QuickNotes!

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
 Paste full paragraphs or entire documents
 Longer content produces better formatted notes
 Experiment with different formats
Adjust word count based on your needs
All your notes are automatically saved

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
      'mcqs': `Generate Multiple Choice Questions (MCQs) strictly based on the provided study material.

REQUIREMENTS:
- Do NOT introduce information outside the given content
- Questions must be exam-oriented and concept-focused
- Difficulty level: Medium (college / university exams)
- Avoid ambiguous or opinion-based questions
- Each question must have exactly 4 options (A–D)
- Use clean, vertical layout
- Clearly mark the correct answer
- Provide a brief explanation

FORMAT:
## Multiple Choice Questions (MCQs)

Q1. Question text here?
A. Option A
B. Option B
C. Option C
D. Option D

Correct Answer: A
Explanation: Brief explanation of why this is correct.

---

Q2. Next question?
A. Option A
B. Option B
C. Option C
D. Option D

Correct Answer: B
Explanation: Brief explanation here.

TABLE FORMATTING (if needed):
Use this exact format for tables:
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Data | Data | Data |
| Data | Data | Data |

DO NOT USE:
- Extra pipes outside table boundaries
- Colons or special alignment characters
- Unequal spacing between rows
- Messy alignment marks like "| :--- |"

Constraints:
- Generate exactly ${wordCount} MCQs
- Do not repeat questions
- Keep explanations concise
- Use Q1, Q2, Q3... numbering
- Use A. B. C. D. format for options
- No messy characters or extra formatting

Content to process:
${userInput}`,
      'quick-test': `Quick Test mode - handled separately`, // Placeholder as Quick Test has its own flow
    };

    return formatPrompts[format];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      console.log('handleSend blocked:', { inputEmpty: !input.trim(), isLoading });
      return;
    }

    const userInput = input.trim();
    console.log('handleSend called with input:', userInput.substring(0, 50));

    if (!isValidContent(userInput)) {
      console.log('Content validation failed, showing about message');
      setInput('');
      setShowFormatOptions(false);
      showAboutMessage();
      return;
    }
    console.log('Content validation passed');

    let processedInput = userInput;

    // Handle Quick Test selection
    if (showFormatOptions && selectedFormat === 'quick-test') {
      // Check if we have content to work with
      if (!userInput.trim() || userInput.trim().length < 120) {
        showToastMessage('Please paste content first, then select Quick Test.');
        return;
      }
      
      // Store the content for Quick Test before clearing input
      setQuickTestContent(userInput.trim());
      setShowQuickTestDifficulty(true);
      setInput('');
      setShowFormatOptions(false);
      setIsLoading(false);
      return;
    }

    // Apply format if format options are shown and user wants formatted output
    if (showFormatOptions && selectedFormat) {
      const countToUse = selectedFormat === 'mcqs' ? questionCount : wordCount;
      processedInput = generateFormatPrompt(selectedFormat, countToUse, userInput);
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
      console.log('🚀 Starting handleSend...');
      const supabase = getSupabaseClient();
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      console.log('Auth check:', { hasUser: !!currentUser, error: userError?.message });
      if (userError || !currentUser) {
        console.error('Auth error:', userError);
        throw new Error('Please log in to use the chat feature');
      }

      console.log('✅ User authenticated:', currentUser.id);

      // Save user message immediately if saveChat is ON
      // Store the returned conversation ID to use for assistant message
      let savedConversationId: string | null = null;
      if (saveChat && currentUser) {
        try {
          console.log('💾 Saving user message...');
          savedConversationId = await saveMessageToDatabase(userMessage, currentUser.id);
          console.log('✅ User message saved, conversationId:', savedConversationId);
        } catch (saveError) {
          console.error('Error saving user message:', saveError);
          // Continue with chat even if save fails
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session token exists:', !!session?.access_token);

      console.log('📡 Calling /api/chat with input:', processedInput.substring(0, 50));
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

      console.log('📥 API Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API error:', response.status, errorData);
        let errorMessage = `API error (${response.status})`;
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorData.substring(0, 200) || errorMessage;
        }
        throw new Error(errorMessage);
      }
      console.log('✅ API response OK, starting to stream...');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const messageId = (Date.now() + 1).toString();
      let assistantContent = '';

      setMessages((prev) => [...prev, {
        id: messageId,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }]);

      if (reader) {
        console.log('🔄 Starting to read stream...');
        let streamEnded = false;
        let chunkCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ Stream ended. Total chunks:', chunkCount, 'Content length:', assistantContent.length);
            if (!assistantContent) {
              assistantContent = 'No response received from the AI. Please check your API key and try again.';
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                  id: messageId,
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: new Date(),
                };
                return updated;
              });
            } else {
              // Save assistant message if toggle is ON
              // Pass the conversation ID from when we saved the user message
              if (saveChat && currentUser) {
                try {
                  await saveMessageToDatabase({
                    id: messageId,
                    role: 'assistant',
                    content: assistantContent,
                    timestamp: new Date(),
                  }, currentUser.id, savedConversationId);
                } catch (saveError) {
                  console.error('Error saving assistant message:', saveError);
                  showToastMessage('Chat saved, but failed to save last message. Please try again.');
                }
              }
            }
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value);
          console.log(`📦 Chunk ${chunkCount}:`, chunk.substring(0, 100));
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  console.error('❌ API Error in stream:', parsed.error);
                  assistantContent = `Error: ${parsed.error}`;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { 
                      id: messageId,
                      role: 'assistant',
                      content: assistantContent,
                      timestamp: new Date(),
                    };
                    return updated;
                  });
                  streamEnded = true;
                  break;
                }
                if (parsed.content) {
                  assistantContent += sanitizeContent(parsed.content);
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { 
                      id: messageId,
                      role: 'assistant',
                      content: assistantContent,
                      timestamp: new Date(),
                    };
                    return updated;
                  });
                }
                if (parsed.sources) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { 
                      id: messageId,
                      role: 'assistant',
                      content: assistantContent,
                      sources: parsed.sources,
                      timestamp: new Date(),
                    };
                    return updated;
                  });
                }
              } catch (parseErr) {
                console.warn('Failed to parse JSON:', data.substring(0, 50), parseErr);
              }
            }
          }
          
          if (streamEnded) break;
        }
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
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
      console.log('🏁 handleSend finished, setting isLoading to false');
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
        showToastMessage('Generating PDF...');
        
        try {
          // Try server-side generation first
          const response = await fetch('/api/chat/pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              markdown: messageContent,
              title: title,
              filename: `${cleanTitle}.pdf`,
            }),
          });

          if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 0) {
              downloadFile(blob, `${cleanTitle}.pdf`);
              showToastMessage('PDF downloaded successfully!');
              return;
            }
          }
          
          throw new Error('Server-side PDF generation failed');
        } catch (serverError) {
          console.warn('Server-side PDF failed, using client-side generation:', serverError);
          showToastMessage('Generating PDF with backup method...');
          
          try {
            // Use client-side jsPDF as fallback
            const pdfBlob = generateClientPDF({
              title: title,
              content: messageContent,
              author: 'QuickNotes',
              subject: 'Study Notes'
            });
            
            downloadFile(pdfBlob, `${cleanTitle}.pdf`);
            showToastMessage('PDF generated successfully!');
          } catch (clientError) {
            console.error('Client-side PDF generation failed:', clientError);
            showToastMessage('Trying text file export...');
            
            try {
              const textBlob = new Blob([messageContent], { type: 'text/plain; charset=utf-8' });
              downloadFile(textBlob, `${cleanTitle}.txt`);
              showToastMessage('Downloaded as text file');
            } catch (fallbackError) {
              console.error('All export methods failed:', fallbackError);
              showToastMessage('Could not export. Please copy text manually.');
            }
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

  const handleCopy = useCallback(async (messageContent: string) => {
    if (!messageContent || messageContent.trim().length === 0) {
      showToastMessage('Nothing to copy');
      return;
    }

    if (isCopying) return;
    setIsCopying(true);

    try {
      // Extract plain text from markdown while preserving structure
      const plainText = extractTextFromMarkdown(messageContent);
      const result = await copyToClipboard(plainText);
      
      showToastMessage(result.message);
    } catch (error) {
      console.error('Copy error:', error);
      showToastMessage('Unable to copy right now. Please try again.');
    } finally {
      setIsCopying(false);
    }
  }, [isCopying]);

  const handleQuickTestDifficulty = async (difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      console.log('🎯 Quick Test Started - Difficulty:', difficulty);
      setQuickTestDifficulty(difficulty);
      setShowQuickTestDifficulty(false);
      setIsGeneratingQuiz(true);
      setCurrentQuiz(null);
      setUserAnswers({});
      setQuizSubmitted(false);
      setQuizResults(null);

      // Check if we have stored content for Quick Test
      const hasQuickTestContent = quickTestContent && quickTestContent.length >= 120;
      
      console.log('Content check for Quick Test:', { hasQuickTestContent, contentLength: quickTestContent?.length || 0 });
      
      if (!hasQuickTestContent) {
        console.log('❌ Quick Test requires stored content');
        showToastMessage('Please paste content in the text field first, then select Quick Test.');
        setIsGeneratingQuiz(false);
        setShowQuickTestDifficulty(true);
        return;
      }

      // Get the primary study material for the quiz
      let primaryContent = '';
      let contentSource = '';
      
      // Use the stored Quick Test content
      primaryContent = quickTestContent;
      contentSource = 'quick_test_content';
      console.log('✅ Using stored Quick Test content as source:', primaryContent.length, 'chars');
      
      // Define message filters for debugging
      const userMessages = messages.filter(m => m.role === 'user');
      const assistantMessages = messages.filter(m => m.role === 'assistant');
      
      // Content sufficiency check - require minimum 120 characters
      if (!primaryContent || primaryContent.length < 120) {
        console.error('❌ Content validation failed!');
        console.error('Primary content:', primaryContent ? `"${primaryContent.substring(0, 100)}..."` : 'null');
        console.error('Content length:', primaryContent?.length || 0);
        console.error('Content source:', contentSource || 'none');
        console.error('User messages count:', userMessages.length);
        console.error('Assistant messages count:', assistantMessages.length);
        console.error('Total messages:', messages.length);
        
        console.log('🔍 Debug: All user messages:');
        userMessages.forEach((msg, i) => {
          console.log(`  User msg ${i}:`, {
            length: msg.content?.length || 0,
            preview: msg.content?.substring(0, 50) || 'empty',
            wordCount: msg.content ? msg.content.split(/\s+/).length : 0
          });
        });
        
        // Show user-friendly error based on situation
        if (messages.length === 0 || primaryContent.length < 120) {
          showToastMessage('Not enough content to generate a quiz. Please add more information.');
        } else {
          showToastMessage('Not enough content to generate a quiz. Please add more information.');
        }
        
        setIsGeneratingQuiz(false);
        setShowQuickTestDifficulty(true);
        return;
      }
      
      console.log('✅ Content validation passed! Content length:', primaryContent.length);
      
      // Additional content validation for quiz suitability
      const wordCount = primaryContent.split(/\s+/).length;
      if (wordCount < 3) {
        console.error('Word count too low:', wordCount, 'words in:', primaryContent);
        showToastMessage('Content is too short for quiz generation. Please provide more detailed material.');
        setIsGeneratingQuiz(false);
        setShowQuickTestDifficulty(true);
        return;
      }
      
      // Use only the primary content - no mixing to avoid confusion
      const context = primaryContent;
      
      console.log('Quiz Generation Info:');
      console.log('- Content Source:', contentSource);
      console.log('- Content Preview:', context.substring(0, 300) + '...');
      console.log('- Content Stats:', context.length, 'characters,', wordCount, 'words');

      // Generate quiz prompt based on difficulty
      const numQuestions = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : 10;
      const difficultyLevel = difficulty === 'easy' ? 'basic' : difficulty === 'medium' ? 'intermediate' : 'advanced';
      
      const quizPrompt = `CRITICAL INSTRUCTION: Use ONLY the content below to generate questions. If a concept is not mentioned, it must NOT appear. If the content is insufficient, do NOT guess.

STUDY MATERIAL:
"""
${context}
"""

TASK: Create exactly ${numQuestions} ${difficultyLevel} level multiple choice questions using EXCLUSIVELY the content above.

STRICT CONTENT RULES:
- Every question MUST be answerable using ONLY the given content
- Use the exact terminology from the provided text
- If information is not stated, do NOT include it
- Each question must map to a specific sentence or paragraph

DIFFICULTY GUIDELINES:
${difficultyLevel === 'basic' ? '- Ask about direct facts or definitions explicitly stated' : 
  difficultyLevel === 'intermediate' ? '- Ask about comparisons or explanations stated in the content' :
  '- Ask about logical inferences ONLY if the information exists in the content'}

VALIDATION CHECK:
Before including any question, ask: "Can this be answered using only the pasted content?"
If NO, discard and regenerate.

OUTPUT FORMAT (JSON only):
{
  "questions": [
    {
      "question": "[Question based on provided text]",
      "options": ["[Correct answer from text]", "[Wrong option]", "[Wrong option]", "[Wrong option]"],
      "correct": 0
    }
  ]
}

Generate exactly ${numQuestions} questions. Return only valid JSON.`;

      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          question: quizPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      if (!data || !data.content) {
        throw new Error('Invalid response from server');
      }

      let quizData;
      try {
        // Clean the content and try to parse directly
        let cleanContent = data.content.trim();
        
        // Remove common streaming prefixes that might interfere
        if (cleanContent.startsWith('data: ')) {
          cleanContent = cleanContent.substring(6);
        }
        
        // Remove any leading/trailing whitespace and newlines
        cleanContent = cleanContent.replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '');
        
        // Try to parse the cleaned content
        quizData = JSON.parse(cleanContent);
      } catch (firstError) {
        console.warn('Direct JSON parsing failed:', firstError);
        
        try {
          // If direct parsing fails, try to extract JSON from the response
          let content = data.content;
          
          // Handle streaming format like "data: {...}"
          if (content.includes('data: {')) {
            const dataMatch = content.match(/data:\s*(\{[\s\S]*?\})/);
            if (dataMatch) {
              content = dataMatch[1];
            }
          }
          
          // Extract the largest JSON object
          const jsonMatches = content.match(/\{[\s\S]*\}/g);
          if (jsonMatches) {
            // Try parsing each match, starting with the longest
            const sortedMatches = jsonMatches.sort((a: string, b: string) => b.length - a.length);
            
            for (const match of sortedMatches) {
              try {
                const cleanMatch = match.trim();
                quizData = JSON.parse(cleanMatch);
                
                // Validate that this is actually quiz data
                if (quizData && quizData.questions && Array.isArray(quizData.questions)) {
                  break;
                }
              } catch {
                continue;
              }
            }
            
            if (!quizData) {
              throw new Error('Could not parse any valid quiz JSON');
            }
          } else {
            throw new Error('No JSON structure found in response');
          }
        } catch (secondError) {
          console.error('All JSON parsing attempts failed:', {
            firstError,
            secondError,
            rawContent: data.content.substring(0, 200) + '...'
          });
          throw new Error('Could not parse quiz data from API response');
        }
      }

      if (!quizData || !quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        throw new Error('Invalid quiz format received');
      }

      // Validate quiz quality and content relevance
      const validQuestions = quizData.questions.filter((q: any) => {
        // Basic structure validation
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
            typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
          console.warn('Filtering out malformed question:', q.question);
          return false;
        }
        
        // Content quality validation
        if (q.question.length < 15 || !q.options.every((opt: string) => opt && opt.length > 2)) {
          console.warn('Filtering out low quality question:', q.question);
          return false;
        }
        
        // Enhanced content relevance check
        const questionLower = q.question.toLowerCase();
        const contextLower = context.toLowerCase();
        
        // Check for generic question patterns
        const genericPatterns = [
          'which of the following is true',
          'what is the capital',
          'what is commonly known',
          'general knowledge',
          'which statement is correct',
          'what do you know about',
          'in general,',
          'typically,',
          'usually,'
        ];
        
        const isGeneric = genericPatterns.some(pattern => questionLower.includes(pattern));
        if (isGeneric) {
          console.warn('Filtering out generic question pattern:', q.question);
          return false;
        }
        
        // Content relevance validation - check if question relates to the source material
        const questionWords = q.question.toLowerCase().split(/\W+/).filter((word: string) => word.length > 3);
        const contextWords = new Set(contextLower.split(/\W+/).filter((word: string) => word.length > 3));
        
        // Calculate relevance score based on shared content words
        const relevantWords = questionWords.filter((word: string) => contextWords.has(word));
        const relevanceScore = relevantWords.length / Math.max(questionWords.length, 1);
        
        if (relevanceScore < 0.3) {
          console.warn('Filtering out low relevance question (score:', relevanceScore.toFixed(2), '):', q.question);
          return false;
        }
        
        // Check if the correct answer contains content-specific terms
        const correctAnswer = q.options[q.correct];
        if (correctAnswer && correctAnswer.length > 3) {
          const answerWords = correctAnswer.toLowerCase().split(/\W+/).filter((word: string) => word.length > 3);
          const answerRelevance = answerWords.filter((word: string) => contextWords.has(word)).length > 0;
          
          if (!answerRelevance) {
            console.warn('Filtering out question with non-content answer:', q.question, '→', correctAnswer);
            return false;
          }
        }
        
        // Additional validation: Check if answer can be found in content
        const answerInContent = contextLower.includes(correctAnswer.toLowerCase()) || 
                               contextLower.includes(correctAnswer.toLowerCase().replace(/[^\w\s]/g, ''));
        if (!answerInContent && relevanceScore < 0.4) {
          console.warn('Filtering out question - answer not traceable to content:', q.question);
          return false;
        }
        
        return true;
      });

      if (validQuestions.length === 0) {
        throw new Error('Unable to generate content-relevant questions. Please provide more specific study material.');
      }

      // Ensure we have enough questions for the requested difficulty
      if (validQuestions.length < Math.min(3, numQuestions)) {
        throw new Error('Not enough content-relevant questions could be generated. Try providing more detailed material.');
      }

      // Use only valid questions
      const finalQuiz = {
        ...quizData,
        questions: validQuestions
      };

      console.log('Generated Quiz Questions:');
      validQuestions.forEach((q: any, index: number) => {
        console.log(`Q${index + 1}: ${q.question}`);
        console.log(`Correct Answer: ${q.options[q.correct]}`);
      });

      setCurrentQuiz(finalQuiz);

    } catch (error) {
      console.error('Quiz generation error:', error);
      // Reset UI state and show user-friendly message
      setIsGeneratingQuiz(false);
      setShowQuickTestDifficulty(true);
      
      // Provide specific error feedback based on the error type
      let errorMessage = 'Unable to generate quiz. Please try again.';
      
      const errorStr = error instanceof Error ? error.message : String(error);
      
      if (errorStr.includes('Not enough content') || errorStr.includes('Insufficient content')) {
        errorMessage = 'Not enough content to generate a quiz. Please add more information.';
      } else if (errorStr.includes('Content too short')) {
        errorMessage = 'Content too short for meaningful quiz questions. Please provide more detailed material.';
      } else if (errorStr.includes('content-relevant questions')) {
        errorMessage = 'Unable to create relevant questions from this content. Try providing more specific study material.';
      } else if (errorStr.includes('quality standards')) {
        errorMessage = 'Content quality insufficient for quiz generation. Please provide clearer study material.';
      } else if (errorStr.includes('parse quiz data') || errorStr.includes('JSON')) {
        errorMessage = 'Unable to process quiz response. Please try again.';
      } else {
        // Check if we have any content at all
        const userMessages = messages.filter(m => m.role === 'user');
        const hasAnyContent = userMessages.some(m => m.content && m.content.trim().length > 20);
        
        errorMessage = hasAnyContent
          ? 'Unable to generate quiz from the provided content. Please try again with different material.'
          : 'Please provide study material to generate relevant quiz questions.';
      }
      
      showToastMessage(errorMessage);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizAnswer = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleQuizSubmit = () => {
    if (!currentQuiz || quizSubmitted) return;
    
    let correct = 0;
    const total = currentQuiz.questions.length;
    
    currentQuiz.questions.forEach((question: any, index: number) => {
      if (userAnswers[index] === question.correct) {
        correct++;
      }
    });
    
    const percentage = Math.round((correct / total) * 100);
    let feedback = '';
    
    if (percentage >= 80) {
      feedback = 'Excellent work! You have a strong understanding of the material.';
    } else if (percentage >= 60) {
      feedback = 'Good job! You\'re on the right track. Review the areas you missed.';
    } else if (percentage >= 40) {
      feedback = 'Not bad, but there\'s room for improvement. Study the material again.';
    } else {
      feedback = 'Keep studying! Focus on understanding the key concepts better.';
    }
    
    setQuizResults({ score: correct, total, feedback });
    setQuizSubmitted(true);
  };

  const resetQuickTest = () => {
    setShowQuickTestDifficulty(false);
    setQuickTestDifficulty(null);
    setCurrentQuiz(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizResults(null);
    setIsGeneratingQuiz(false);
    setQuickTestContent('');
  };

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
    { value: 'mcqs', label: 'MCQs' },
    { value: 'quick-test', label: 'Quick Test' },
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
          <div className="pb-24 sm:pb-28">
            {messages.length === 0 ? (
              <div className="w-full py-8 sm:py-12 bg-white">
                <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Welcome to QuickNotes! 📚</h2>
                <p className="text-gray-600 text-xs sm:text-sm max-w-sm mx-auto mb-3 sm:mb-4">
                  Paste your study content into the text field below, then select your desired output format.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 max-w-sm mx-auto text-left">
                  <p className="text-xs font-semibold text-blue-900 mb-2 text-left">✨ How to use:</p>
                  <ul className="text-xs text-blue-800 space-y-1 text-left">
                    <li className="text-left">📋 Paste your content in the chat below</li>
                    <li className="text-left">🎯 Select format: Key Points, Summary, Exam Notes, etc.</li>
                    <li className="text-left">📊 Set word count for your output</li>
                    <li className="text-left">💾 Export as PDF or download</li>
                  </ul>
                </div>
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
                    <div key={message.id} className={`w-full py-3 sm:py-4 ${
                      message.role === 'user' ? 'bg-white' : 'bg-gray-50'
                    } border-b border-gray-100 last:border-b-0`}>
                      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
                        <div className="flex gap-3 sm:gap-4">
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
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 leading-relaxed">
                              {message.role === 'assistant' ? renderMarkdown(message.content) : (
                                <div className="whitespace-pre-wrap text-left">
                                  {message.content}
                                </div>
                              )}
                            </div>
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-600">Sources</p>
                                <div className="flex flex-wrap gap-2">
                                  {message.sources.map((source, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                                    >
                                      {source.name}
                                      {source.page && <span className="text-gray-500">p. {source.page}</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Export buttons only on the LAST assistant message */}
                            {isLastAssistantMessage && message.content && message.content.trim().length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
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
                                    console.log('Copy button clicked');
                                    handleCopy(message.content);
                                  }}
                                  disabled={isCopying || !message.content || message.content.trim().length === 0}
                                  className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[32px] ${
                                    isCopying || !message.content || message.content.trim().length === 0
                                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200 cursor-pointer'
                                  }`}
                                >
                                  {isCopying ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Copying...
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy
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
                  <div className="w-full py-3 sm:py-4 bg-gray-50 border-b border-gray-100">
                    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 text-white flex items-center justify-center flex-shrink-0">
                          <span className="text-xs">AI</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">AI is thinking…</span>
                          </div>
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
                {selectedFormat === 'mcqs' ? (
                  <>
                    <label className="text-xs sm:text-sm text-gray-700 font-medium">Number of questions:</label>
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 20].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            setQuestionCount(count);
                            setWordCount(count);
                          }}
                          className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors touch-target ${
                            questionCount === count
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
                            const numVal = parseInt(val) || 5;
                            setQuestionCount(numVal);
                            setWordCount(numVal);
                          }
                        }}
                        className="w-18 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </>
                ) : selectedFormat !== 'quick-test' ? (
                  <>
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
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Quick Test Difficulty Selection */}
        {showQuickTestDifficulty && (
          <div className="bg-blue-50 border-t border-blue-200 px-3 sm:px-6 py-3 sm:py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800">Choose Test Difficulty</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'easy', label: 'Easy (5 questions)', color: 'green' },
                    { value: 'medium', label: 'Medium (7 questions)', color: 'yellow' },
                    { value: 'hard', label: 'Hard (10 questions)', color: 'red' }
                  ].map((difficulty) => (
                    <button
                      key={difficulty.value}
                      onClick={() => handleQuickTestDifficulty(difficulty.value as 'easy' | 'medium' | 'hard')}
                      disabled={isGeneratingQuiz}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        difficulty.color === 'green' 
                          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                          : difficulty.color === 'yellow'
                          ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                          : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {difficulty.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={resetQuickTest}
                  className="text-xs text-gray-500 hover:text-gray-700 self-start"
                  disabled={isGeneratingQuiz}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Generation Loading */}
        {isGeneratingQuiz && (
          <div className="bg-gray-50 border-t border-gray-200 px-3 sm:px-6 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Please wait, preparing your test...</p>
            </div>
          </div>
        )}

        {/* Quiz Interface */}
        {currentQuiz && !isGeneratingQuiz && (
          <div className="bg-white border-t border-gray-200 px-3 sm:px-6 py-4 overflow-y-auto" data-quiz-container>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Quick Test - {quickTestDifficulty?.charAt(0).toUpperCase()}{quickTestDifficulty?.slice(1)} Level
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({currentQuiz.questions.length} question{currentQuiz.questions.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <button
                  onClick={resetQuickTest}
                  className="text-sm text-gray-500 hover:text-gray-700"
                  disabled={quizSubmitted}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!quizSubmitted ? (
                <div className="space-y-6">
                  {currentQuiz.questions.map((question: any, questionIndex: number) => (
                    <div key={questionIndex} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        {questionIndex + 1}. {question.question}
                      </h3>
                      <div className="space-y-2">
                        {question.options.map((option: string, optionIndex: number) => (
                          <label
                            key={optionIndex}
                            className="flex items-center gap-3 cursor-pointer hover:bg-white rounded-md p-2 transition-colors"
                          >
                            <input
                              type="radio"
                              name={`question-${questionIndex}`}
                              value={optionIndex}
                              checked={userAnswers[questionIndex] === optionIndex}
                              onChange={() => handleQuizAnswer(questionIndex, optionIndex)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(userAnswers).length < currentQuiz.questions.length}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Test
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-blue-50 rounded-lg p-6 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Test Results</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {quizResults?.score}/{quizResults?.total}
                    </div>
                    <div className="text-lg text-gray-600 mb-4">
                      Score: {Math.round(((quizResults?.score || 0) / (quizResults?.total || 1)) * 100)}%
                    </div>
                    <p className="text-gray-700">{quizResults?.feedback}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Correct Answers:</h4>
                    {currentQuiz.questions.map((question: any, questionIndex: number) => (
                      <div key={questionIndex} className={`text-left p-3 rounded-lg ${
                        userAnswers[questionIndex] === question.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="font-medium text-gray-900 mb-1">
                          {questionIndex + 1}. {question.question}
                        </div>
                        <div className={`text-sm ${
                          userAnswers[questionIndex] === question.correct ? 'text-green-700' : 'text-red-700'
                        }`}>
                          Correct: {question.options[question.correct]}
                          {userAnswers[questionIndex] !== question.correct && (
                            <span className="block text-gray-600">
                              Your answer: {question.options[userAnswers[questionIndex]] || 'Not answered'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={resetQuickTest}
                    className="mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Take Another Test
                  </button>
                </div>
              )}
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
