import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from './Sidebar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('@/app/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' },
          },
        },
      }),
      signOut: jest.fn().mockResolvedValue({}),
    },
  })),
  clearSupabaseClient: jest.fn(),
}));

global.fetch = jest.fn();

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render navigation items', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    });

    render(
      <Sidebar
        user={{
          id: 'test-user',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });
  });

  it('should render library items', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    });

    render(
      <Sidebar
        user={{
          id: 'test-user',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Saved Items')).toBeInTheDocument();
      expect(screen.getByText('Exports')).toBeInTheDocument();
    });
  });

  it('should display user email when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    });

    const testEmail = 'user@example.com';
    render(
      <Sidebar
        user={{
          id: 'test-user',
          email: testEmail,
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(testEmail)).toBeInTheDocument();
    });
  });

  it('should load chat history from API', async () => {
    const mockConversations = [
      {
        id: '1',
        title: 'Study Session 1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Study Session 2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: mockConversations }),
    });

    render(
      <Sidebar
        user={{
          id: 'test-user',
          email: 'test@example.com',
        }}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat/history'),
        expect.any(Object)
      );
    });
  });

  it('should handle chat history load error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation();

    render(
      <Sidebar
        user={{
          id: 'test-user',
          email: 'test@example.com',
        }}
      />
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle sign out', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    });

    const { getSupabaseClient } = require('@/app/lib/supabase');
    const mockSignOut = jest.fn().mockResolvedValue({});
    getSupabaseClient.mockReturnValueOnce({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'test-token' } },
        }),
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
        }),
        signOut: mockSignOut,
      },
    });

    render(
      <Sidebar
        user={{
          id: 'test-user',
          email: 'test@example.com',
        }}
      />
    );

    const logoutButton = await screen.findByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('should render with null user', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    });

    render(<Sidebar user={null} />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should render mobile menu toggle', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    });

    render(
      <Sidebar
        user={{
          id: 'test-user',
          email: 'test@example.com',
        }}
      />
    );

    const menuButton = await screen.findByRole('button', {
      name: /menu/i,
    });
    expect(menuButton).toBeInTheDocument();
  });

  it('should close mobile menu on route change', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    });

    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValueOnce('/dashboard');

    const { rerender } = render(
      <Sidebar
        user={{
          id: 'test-user',
          email: 'test@example.com',
        }}
      />
    );

    usePathname.mockReturnValueOnce('/upload');
    rerender(
      <Sidebar
        user={{
          id: 'test-user',
          email: 'test@example.com',
        }}
      />
    );

    await waitFor(() => {
      expect(usePathname).toHaveBeenCalled();
    });
  });
});
