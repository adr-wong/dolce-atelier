import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders the mapped label from textMap', () => {
    render(
      <StatusBadge status="PAGADO" colorMap={{}} textMap={{ PAGADO: 'Pagado' }} />,
    );
    expect(screen.getByText('Pagado')).toBeInTheDocument();
  });

  it('falls back to the raw status when textMap has no entry', () => {
    render(<StatusBadge status="PENDIENTE" colorMap={{}} />);
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
  });

  it('applies the background color from colorMap', () => {
    const { container } = render(
      <StatusBadge status="X" colorMap={{ X: '#ff0000' }} />,
    );
    const span = container.firstChild as HTMLElement;
    expect(span.getAttribute('style')).toContain('rgb(255, 0, 0)');
  });

  it('falls back to a default background when status is not in colorMap', () => {
    const { container } = render(<StatusBadge status="Y" colorMap={{}} />);
    const span = container.firstChild as HTMLElement;
    expect(span.getAttribute('style')).toContain('rgb(243, 244, 246)');
  });
});
