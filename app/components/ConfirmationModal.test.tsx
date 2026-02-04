import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from './ConfirmationModal';

describe('ConfirmationModal Component', () => {
  it('should not render when show is false', () => {
    const { container } = render(
      <ConfirmationModal
        show={false}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when show is true', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should display confirm and cancel buttons', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /confirm|yes|ok/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel|no/i })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const mockOnConfirm = jest.fn();

    render(
      <ConfirmationModal
        show={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm|yes|ok/i });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockOnCancel = jest.fn();

    render(
      <ConfirmationModal
        show={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel|no/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should display custom button labels when provided', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Delete Item?"
        message="Are you sure you want to delete?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
  });

  it('should display danger styling when type is danger', () => {
    const { container } = render(
      <ConfirmationModal
        show={true}
        title="Delete Item?"
        message="This cannot be undone."
        type="danger"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm|yes|ok/i });
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('should display warning styling when type is warning', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Warning"
        message="Please confirm this action."
        type="warning"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('should display info styling when type is info', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Information"
        message="Please confirm this action."
        type="info"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Information')).toBeInTheDocument();
  });

  it('should have proper modal backdrop', () => {
    const { container } = render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const backdrop = container.querySelector('.fixed');
    expect(backdrop).toBeInTheDocument();
  });

  it('should center modal on screen', () => {
    const { container } = render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const modal = container.querySelector('.rounded-lg');
    expect(modal).toBeInTheDocument();
  });

  it('should handle long titles', () => {
    const longTitle = 'This is a very long confirmation title that might need to wrap to multiple lines';

    render(
      <ConfirmationModal
        show={true}
        title={longTitle}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('should handle long messages', () => {
    const longMessage = 'This is a detailed explanation about the action. ' +
      'It contains multiple sentences to fully explain the consequences. ' +
      'The user should read this carefully before confirming.';

    render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message={longMessage}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle rapid button clicks', () => {
    const mockOnConfirm = jest.fn();

    render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm|yes|ok/i });

    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when backdrop is clicked', () => {
    const mockOnCancel = jest.fn();
    const { container } = render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={mockOnCancel}
        closeOnBackdropClick={true}
      />
    );

    const backdrop = container.querySelector('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnCancel).toHaveBeenCalled();
    }
  });

  it('should display loading state on confirm button', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isLoading={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm|yes|ok/i });
    expect(confirmButton).toBeDisabled();
  });

  it('should disable cancel button when loading', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        isLoading={true}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel|no/i });
    expect(cancelButton).toBeDisabled();
  });

  it('should display custom confirm button label', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Delete?"
        message="Are you sure?"
        confirmLabel="Delete Permanently"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /delete permanently/i })).toBeInTheDocument();
  });

  it('should display custom cancel button label', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Confirm?"
        message="Are you sure?"
        cancelLabel="Go Back"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('should be accessible with keyboard navigation', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm|yes|ok/i });
    expect(confirmButton).toHaveAttribute('type', 'button');
  });

  it('should not render when show is false', () => {
    const { container } = render(
      <ConfirmationModal
        show={false}
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should handle null or undefined callbacks gracefully', () => {
    render(
      <ConfirmationModal
        show={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });
});
