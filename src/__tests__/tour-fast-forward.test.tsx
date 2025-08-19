import React from 'react';
import { render, screen } from '@testing-library/react';
import FastForwardBadge from '../../src/components/FastForwardBadge';

describe('FastForwardBadge', () => {
  it('does not render when visible=false', () => {
    const { container } = render(<FastForwardBadge visible={false} multiplier={8} />);
    expect(container.querySelector('[data-test="fast-forward-badge"]')).toBeNull();
  });

  it('renders and shows multiplier when visible=true', () => {
    render(<FastForwardBadge visible={true} multiplier={8} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Startup accelerated ×8/)).toBeInTheDocument();
  });
});
