import { render, screen } from '@testing-library/react';
import ProgressBar from './progress-bar';

describe('ProgressBar', () => {
  it('shows count as done / total', () => {
    render(<ProgressBar total={10} done={3} />);
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('shows the starting milestone when nothing is done', () => {
    render(<ProgressBar total={10} done={0} />);
    expect(screen.getByText('Your London exploration begins…')).toBeInTheDocument();
  });

  it('shows the 25% milestone message', () => {
    render(<ProgressBar total={4} done={1} />);
    expect(screen.getByText('Great start — a quarter of the way there!')).toBeInTheDocument();
  });

  it('shows the 50% milestone message', () => {
    render(<ProgressBar total={4} done={2} />);
    expect(screen.getByText('Halfway through your London adventure!')).toBeInTheDocument();
  });

  it('shows the 75% milestone message', () => {
    render(<ProgressBar total={4} done={3} />);
    expect(screen.getByText('Almost there — the finish line is in sight!')).toBeInTheDocument();
  });

  it('shows the 100% completion message', () => {
    render(<ProgressBar total={4} done={4} />);
    expect(screen.getByText('London conquered! Every place ticked off.')).toBeInTheDocument();
  });

  it('renders the fill bar with correct width', () => {
    const { container } = render(<ProgressBar total={10} done={5} />);
    const fill = container.querySelector('[style]');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('renders 0% width and starting message when total is zero', () => {
    const { container } = render(<ProgressBar total={0} done={0} />);
    expect(screen.getByText('Your London exploration begins…')).toBeInTheDocument();
    const fill = container.querySelector('[style]');
    expect(fill).toHaveStyle({ width: '0%' });
  });

  describe('ARIA progressbar role', () => {
    it('exposes a progressbar role for screen readers', () => {
      render(<ProgressBar total={10} done={5} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('sets aria-valuenow to the computed percentage', () => {
      render(<ProgressBar total={10} done={5} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });

    it('sets aria-valuemin to 0 and aria-valuemax to 100', () => {
      render(<ProgressBar total={10} done={5} />);
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    it('sets aria-valuenow to 0 when total is zero', () => {
      render(<ProgressBar total={0} done={0} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('sets aria-valuenow to 100 when all items are done', () => {
      render(<ProgressBar total={4} done={4} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('has an accessible label', () => {
      render(<ProgressBar total={10} done={5} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'List progress');
    });
  });
});
