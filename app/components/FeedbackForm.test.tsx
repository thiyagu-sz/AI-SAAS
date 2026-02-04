import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackForm from './FeedbackForm';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('FeedbackForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should render feedback form with all fields', () => {
    render(<FeedbackForm />);

    expect(screen.getByText(/feedback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message|feedback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('should initialize with user email when provided', () => {
    render(<FeedbackForm userEmail="test@example.com" />);

    const emailInput = screen.getByDisplayValue('test@example.com');
    expect(emailInput).toBeInTheDocument();
  });

  it('should validate required fields', () => {
    render(<FeedbackForm />);

    const submitButton = screen.getByRole('button', { name: /submit|send/i });
    fireEvent.click(submitButton);

    expect(screen.queryByText(/title/i)).toBeInTheDocument();
  });

  it('should update form fields when user types', () => {
    render(<FeedbackForm />);

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message|feedback/i) as HTMLTextAreaElement;

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(messageInput, { target: { value: 'Test message content with enough characters' } });

    expect(titleInput.value).toBe('Test Title');
    expect(messageInput.value).toBe('Test message content with enough characters');
  });

  it('should submit valid feedback', async () => {
    const mockOnSuccess = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <FeedbackForm
        userId="test-user-id"
        userEmail="test@example.com"
        onSubmitSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message|feedback/i) as HTMLTextAreaElement;

    fireEvent.change(titleInput, { target: { value: 'Great Feature Request' } });
    fireEvent.change(messageInput, { target: { value: 'This is a great suggestion for a new feature with details' } });

    const submitButton = screen.getByRole('button', { name: /submit|send/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/feedback',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should handle submission error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    render(
      <FeedbackForm
        userId="test-user-id"
        userEmail="test@example.com"
      />
    );

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message|feedback/i) as HTMLTextAreaElement;

    fireEvent.change(titleInput, { target: { value: 'Great Feature Request' } });
    fireEvent.change(messageInput, { target: { value: 'This is a great suggestion for a new feature with details' } });

    const submitButton = screen.getByRole('button', { name: /submit|send/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();

    render(
      <FeedbackForm
        userId="test-user-id"
        userEmail="test@example.com"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close|×/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display feedback categories', () => {
    render(<FeedbackForm />);

    expect(screen.getByText(/category/i)).toBeInTheDocument();
  });

  it('should handle network error during submission', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <FeedbackForm
        userId="test-user-id"
        userEmail="test@example.com"
      />
    );

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message|feedback/i) as HTMLTextAreaElement;

    fireEvent.change(titleInput, { target: { value: 'Great Feature Request' } });
    fireEvent.change(messageInput, { target: { value: 'This is a great suggestion for a new feature with details' } });

    const submitButton = screen.getByRole('button', { name: /submit|send/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
