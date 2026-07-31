import { render, screen } from '@testing-library/react';
import Loader from './Loader';

describe('Loader — rendering', () => {
  it('renders "Loading..." text', () => {
    render(<Loader />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('hides the SVG from assistive technology', () => {
    const { container } = render(<Loader />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
