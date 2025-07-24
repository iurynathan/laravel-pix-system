import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Text } from './Text';

describe('Text Component', () => {
  it('should render text content', () => {
    render(<Text>Hello World</Text>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should apply default paragraph variant', () => {
    render(<Text>Default text</Text>);
    const textElement = screen.getByText('Default text');
    expect(textElement.tagName).toBe('P');
  });

  it('should render as heading when variant is h1', () => {
    render(<Text variant="h1">Heading 1</Text>);
    const textElement = screen.getByText('Heading 1');
    expect(textElement.tagName).toBe('H1');
  });

  it('should render as heading when variant is h2', () => {
    render(<Text variant="h2">Heading 2</Text>);
    const textElement = screen.getByText('Heading 2');
    expect(textElement.tagName).toBe('H2');
  });

  it('should render as heading when variant is h3', () => {
    render(<Text variant="h3">Heading 3</Text>);
    const textElement = screen.getByText('Heading 3');
    expect(textElement.tagName).toBe('H3');
  });

  it('should render as span when variant is span', () => {
    render(<Text variant="span">Span text</Text>);
    const textElement = screen.getByText('Span text');
    expect(textElement.tagName).toBe('SPAN');
  });

  it('should apply size classes correctly', () => {
    render(<Text size="lg">Large text</Text>);
    const textElement = screen.getByText('Large text');
    expect(textElement).toHaveClass('text-lg');
  });

  it('should apply weight classes correctly', () => {
    render(<Text weight="bold">Bold text</Text>);
    const textElement = screen.getByText('Bold text');
    expect(textElement).toHaveClass('font-bold');
  });

  it('should apply color classes correctly', () => {
    render(<Text color="primary">Primary text</Text>);
    const textElement = screen.getByText('Primary text');
    expect(textElement).toHaveClass('text-blue-600');
  });

  it('should apply custom className', () => {
    render(<Text className="custom-class">Custom text</Text>);
    const textElement = screen.getByText('Custom text');
    expect(textElement).toHaveClass('custom-class');
  });

  it('should combine multiple props correctly', () => {
    render(
      <Text variant="h2" size="xl" weight="semibold" color="secondary">
        Combined props
      </Text>
    );
    const textElement = screen.getByText('Combined props');
    expect(textElement.tagName).toBe('H2');
    expect(textElement).toHaveClass(
      'text-xl',
      'font-semibold',
      'text-gray-600'
    );
  });

  it('should render with muted color variant', () => {
    render(<Text color="muted">Muted text</Text>);
    const textElement = screen.getByText('Muted text');
    expect(textElement).toHaveClass('text-gray-500');
  });

  it('should render with success color variant', () => {
    render(<Text color="success">Success text</Text>);
    const textElement = screen.getByText('Success text');
    expect(textElement).toHaveClass('text-green-600');
  });

  it('should render with error color variant', () => {
    render(<Text color="error">Error text</Text>);
    const textElement = screen.getByText('Error text');
    expect(textElement).toHaveClass('text-red-600');
  });
});
