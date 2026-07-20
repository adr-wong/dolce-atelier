import React from 'react';
import { render } from '@testing-library/react';
import LoadingSkeleton from '@/components/LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders without crashing for the default table type', () => {
    const { container } = render(<LoadingSkeleton />);
    const outer = container.firstChild as HTMLElement;
    expect(outer).toBeTruthy();
    // default rows = 5
    expect(outer.querySelectorAll(':scope > div')).toHaveLength(5);
  });

  it('renders the requested number of rows', () => {
    const { container } = render(<LoadingSkeleton type="table" rows={3} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.querySelectorAll(':scope > div')).toHaveLength(3);
  });

  it('renders 4 cards for the cards type', () => {
    const { container } = render(<LoadingSkeleton type="cards" />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.querySelectorAll(':scope > div')).toHaveLength(4);
  });
});
