'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Upload, 
  MessageSquare, 
  Bookmark, 
  Download, 
  Settings,
  User,
  LogOut,
  X,
  Menu,
  Clock
} from 'lucide-react';
import { getSupabaseClient } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarProps {
  user?: {
    id?: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  } | null;
}

interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatConversation[]>([]);
  const [showAllChats, setShowAllChats] = useState(false);

  const loadChatHistory = async (userId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Limit to 3 conversations for sidebar display
      const response = await fetch('/api/chat/history?limit=3', {
        headers: {
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const conversations = data.conversations || [];
        console.log('Chat history loaded:', conversations.length, 'conversations');
        console.log('Conversations:', conversations);
        setChatHistory(conversations);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load chat history:', response.status, errorData);
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setChatHistory([]);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUserEmail(currentUser.email || '');
        // Load chat history immediately
        await loadChatHistory(currentUser.id);
      }
    };
    fetchUser();
    
    // Also set up periodic refresh when on chat page
    if (pathname === '/chat') {
      const intervalId = setInterval(async () => {
        const supabase = getSupabaseClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await loadChatHistory(currentUser.id);
        }
      }, 3000); // Refresh every 3 seconds when on chat page
      
      return () => clearInterval(intervalId);
    }
  }, [pathname]);

  // Refresh chat history when on chat page
  useEffect(() => {
    if (pathname === '/chat') {
      const fetchAndLoad = async () => {
        const supabase = getSupabaseClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          console.log('Loading chat history on chat page for user:', currentUser.id);
          await loadChatHistory(currentUser.id);
        }
      };
      fetchAndLoad();
      
      // Also set up a small delay refresh to catch any saves that happened
      const timeoutId = setTimeout(() => {
        fetchAndLoad();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [pathname]);

  // Listen for chat save events
  useEffect(() => {
    const handleChatSaved = async () => {
      console.log('Chat saved event received, reloading history...');
      // Small delay to ensure database write is complete
      setTimeout(async () => {
        const supabase = getSupabaseClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await loadChatHistory(currentUser.id);
        }
      }, 500);
    };

    window.addEventListener('chatSaved', handleChatSaved);
    return () => window.removeEventListener('chatSaved', handleChatSaved);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/upload', icon: Upload, label: 'Upload' },
    { href: '/chat', icon: MessageSquare, label: 'AI Assistant' },
  ];

  const libraryItems = [
    { href: '/saved', icon: Bookmark, label: 'Saved Items' },
    { href: '/exports', icon: Download, label: 'Exports' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40 transform transition-transform duration-300 lg:relative lg:z-auto ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">AI Study Notes</h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Chat History - Show section if on chat page */}
        {pathname === '/chat' && (
          <div className="pt-6 mt-6 border-t border-gray-200">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Previous Conversations
            </p>
            {chatHistory.length > 0 ? (
              <>
                {chatHistory.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat?id=${chat.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-50 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{chat.title}</span>
                  </Link>
                ))}
              </>
            ) : (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-gray-500">No saved conversations yet</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-6 mt-6 border-t border-gray-200">
          <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Library
          </p>
          {libraryItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
            pathname === '/settings'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

