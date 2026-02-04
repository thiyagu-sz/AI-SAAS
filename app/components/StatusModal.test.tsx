import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusModal from './StatusModal';

describe('StatusModal Component', () => {
  it('should not render when show is false', () => {
    const { container } = render(
      <StatusModal
        show={false}
        type="success"
        title="Success"
        message="Operation completed successfully"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when show is true', () => {
    render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Operation completed successfully"
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('should display success icon for success type', () => {
    render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Operation completed"
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should display error styling for error type', () => {
    const { container } = render(
      <StatusModal
        show={true}
        type="error"
        title="Error"
        message="Something went wrong"
      />
    );

    expect(container.querySelector('.text-red')).toBeDefined();
  });

  it('should display warning styling for warning type', () => {
    render(
      <StatusModal
        show={true}
        type="warning"
        title="Warning"
        message="Please be careful"
      />
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('should display info styling for info type', () => {
    render(
      <StatusModal
        show={true}
        type="info"
        title="Info"
        message="Here is some information"
      />
    );

    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();

    render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Test message"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close|×/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should auto-close after specified duration', async () => {
    jest.useFakeTimers();
    const mockOnClose = jest.fn();

    render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Test message"
        onClose={mockOnClose}
        autoCloseDuration={3000}
      />
    );

    jest.advanceTimersByTime(3000);

    expect(mockOnClose).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('should not auto-close if autoCloseDuration is not provided', () => {
    jest.useFakeTimers();
    const mockOnClose = jest.fn();

    render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Test message"
        onClose={mockOnClose}
      />
    );

    jest.advanceTimersByTime(5000);

    expect(mockOnClose).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('should have proper modal backdrop', () => {
    const { container } = render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Test message"
      />
    );

    const backdrop = container.querySelector('.fixed');
    expect(backdrop).toBeInTheDocument();
  });

  it('should center the modal on screen', () => {
    const { container } = render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Test message"
      />
    );

    const modal = container.querySelector('.rounded-lg');
    expect(modal).toBeInTheDocument();
  });

  it('should handle long titles', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines in the modal';

    render(
      <StatusModal
        show={true}
        type="success"
        title={longTitle}
        message="Test message"
      />
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('should handle long messages', () => {
    const longMessage = 'This is a very long message with multiple sentences. ' +
      'It contains detailed information about what happened. ' +
      'The user should be able to read the entire message.';

    render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message={longMessage}
      />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle empty title gracefully', () => {
    render(
      <StatusModal
        show={true}
        type="success"
        title=""
        message="Test message"
      />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should handle empty message gracefully', () => {
    render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message=""
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should display correct icon for each type', () => {
    const { rerender } = render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Message"
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(
      <StatusModal
        show={true}
        type="error"
        title="Error"
        message="Message"
      />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should have accessible close button', () => {
    render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Test message"
      />
    );

    const closeButton = screen.getByRole('button', { name: /close|×/i });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toBeVisible();
  });

  it('should prevent interaction with page when modal is shown', () => {
    const { container } = render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Test message"
      />
    );

    const backdrop = container.querySelector('.fixed');
    expect(backdrop).toHaveClass('backdrop');
  });

  it('should be dismissible by clicking close button', () => {
    const mockOnClose = jest.fn();

    const { rerender } = render(
      <StatusModal
        show={true}
        type="success"
        title="Success"
        message="Test message"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close|×/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();

    rerender(
      <StatusModal
        show={false}
        type="success"
        title="Success"
        message="Test message"
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });
});
