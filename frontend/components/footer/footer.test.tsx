import { render, screen } from '@testing-library/react';
import Footer from './footer';

describe('Footer — rendering', () => {
  it('renders a footer landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders footer text', () => {
    render(<Footer />);
    expect(
      screen.getByText(/London List\. All rights reserved\./i)
    ).toBeInTheDocument();
  });
});
