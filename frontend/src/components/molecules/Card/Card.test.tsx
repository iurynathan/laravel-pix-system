import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';

describe('Card Component', () => {
  it('should render card with title and content', () => {
    render(
      <Card title="Test Card">
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render card without title', () => {
    render(
      <Card>
        <p>Card content only</p>
      </Card>
    );

    expect(screen.getByText('Card content only')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should apply default variant styling', () => {
    render(<Card>Default card</Card>);
    const cardElement = screen.getByText('Default card').closest('div');
    expect(cardElement).toHaveClass('border', 'border-gray-200', 'bg-white');
  });

  it('should apply outlined variant styling', () => {
    render(<Card variant="outlined">Outlined card</Card>);
    const cardElement = screen.getByText('Outlined card').closest('div');
    expect(cardElement).toHaveClass(
      'border-2',
      'border-gray-300',
      'bg-transparent'
    );
  });

  it('should apply elevated variant styling', () => {
    render(<Card variant="elevated">Elevated card</Card>);
    const cardElement = screen.getByText('Elevated card').closest('div');
    expect(cardElement).toHaveClass('shadow-lg', 'border-0', 'bg-white');
  });

  it('should apply padding classes correctly', () => {
    render(<Card padding="sm">Small padding</Card>);
    const cardElement = screen.getByText('Small padding').closest('div');
    expect(cardElement).toHaveClass('p-3');
  });

  it('should apply large padding', () => {
    render(<Card padding="lg">Large padding</Card>);
    const cardElement = screen.getByText('Large padding').closest('div');
    expect(cardElement).toHaveClass('p-8');
  });

  it('should be clickable when onClick is provided', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable card</Card>);

    const cardElement = screen.getByText('Clickable card').closest('div');
    expect(cardElement).toHaveClass('cursor-pointer', 'hover:shadow-md');

    fireEvent.click(cardElement!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not be clickable when onClick is not provided', () => {
    render(<Card>Non-clickable card</Card>);
    const cardElement = screen.getByText('Non-clickable card').closest('div');
    expect(cardElement).not.toHaveClass('cursor-pointer');
  });

  it('should render with footer content', () => {
    render(
      <Card title="Card with Footer" footer={<button>Action Button</button>}>
        Main content
      </Card>
    );

    expect(screen.getByText('Card with Footer')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Card className="custom-card">Custom styled card</Card>);
    const cardElement = screen.getByText('Custom styled card').closest('div');
    expect(cardElement).toHaveClass('custom-card');
  });

  it('should render loading state', () => {
    render(<Card loading>Loading content</Card>);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('Loading content')).not.toBeInTheDocument();
  });

  it('should show icon in header when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">📊</span>;
    render(
      <Card title="Card with Icon" icon={<TestIcon />}>
        Content
      </Card>
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Card with Icon')).toBeInTheDocument();
  });
});
