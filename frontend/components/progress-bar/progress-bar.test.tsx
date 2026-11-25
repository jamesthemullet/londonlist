import { render, screen } from '@testing-library/react';
import ProgressBar from './progress-bar';

describe('ProgressBar', () => {
  it('shows how many places are visited and the percentage', () => {
    render(<ProgressBar total={10} done={3} />);
    expect(screen.getByText('3 of 10 visited — 30%')).toBeInTheDocument();
  });

  it('shows 0% when nothing is in the list', () => {
    render(<ProgressBar total={0} done={0} />);
    expect(screen.getByText('0 of 0 visited — 0%')).toBeInTheDocument();
  });

  it('renders the optional note', () => {
    render(<ProgressBar total={4} done={1} note="1 place visited this month" />);
    expect(screen.getByText('1 place visited this month')).toBeInTheDocument();
  });

  it('renders one segment per place and fills the visited ones', () => {
    render(<ProgressBar total={5} done={2} />);
    const segments = screen.getAllByTestId('progress-segment');
    expect(segments).toHaveLength(5);
    expect(segments.filter((s) => s.dataset.done === 'true')).toHaveLength(2);
  });

  it('switches to a solid fill bar for long lists', () => {
    const { container } = render(<ProgressBar total={40} done={10} />);
    expect(screen.queryAllByTestId('progress-segment')).toHaveLength(0);
    expect(container.querySelector('[style]')).toHaveStyle({ width: '25%' });
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
