import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="Sin resultados" />);
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('renders the default icon', () => {
    render(<EmptyState title="T" />);
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders a custom icon', () => {
    render(<EmptyState title="T" icon="🔍" />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState title="T" description="No hay elementos para mostrar" />);
    expect(screen.getByText('No hay elementos para mostrar')).toBeInTheDocument();
  });

  it('renders the action button and calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<EmptyState title="T" action={{ label: 'Crear nuevo', onClick }} />);
    const button = screen.getByText('Crear nuevo');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
