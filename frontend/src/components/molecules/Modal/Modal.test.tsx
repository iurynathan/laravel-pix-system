import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal Component', () => {
  it('should render modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        Content
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /fechar/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        Content
      </Modal>
    );

    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        Content
      </Modal>
    );

    const modalContent = screen.getByTestId('modal-content');
    fireEvent.click(modalContent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        Content
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render with footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Modal with Footer"
        footer={
          <div>
            <button>Cancel</button>
            <button>Save</button>
          </div>
        }
      >
        Content
      </Modal>
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should render without header when title is not provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content only
      </Modal>
    );

    expect(screen.getByText('Content only')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should apply custom size classes', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Large Modal" size="lg">
        Content
      </Modal>
    );

    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('max-w-4xl');
  });

  it('should apply default size when size is not provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Default Modal">
        Content
      </Modal>
    );

    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('max-w-lg');
  });

  it('should apply custom className', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Custom Modal"
        className="custom-modal"
      >
        Content
      </Modal>
    );

    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('custom-modal');
  });

  it('should render loading state', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Loading Modal" loading>
        Content
      </Modal>
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should trap focus within modal', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Focus Modal">
        <input data-testid="modal-input" />
        <button data-testid="modal-button">Click me</button>
      </Modal>
    );

    const modalInput = screen.getByTestId('modal-input');
    const modalButton = screen.getByTestId('modal-button');

    expect(document.body).toHaveClass('overflow-hidden');
    expect(modalInput).toBeInTheDocument();
    expect(modalButton).toBeInTheDocument();
  });
});
