import { render, screen } from '@testing-library/react';
import ProgressBar from '../../../components/progress-bar/progress-bar';

describe('ProgressBar', () => {
  it('renders the progress count', () => {
    render(<ProgressBar total={10} done={3} />);
    expect(screen.getByText('3 of 10 visited — 30%')).toBeInTheDocument();
  });

  it('renders the progressbar role', () => {
    render(<ProgressBar total={10} done={5} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets aria-valuenow to the correct percentage', () => {
    render(<ProgressBar total={10} done={5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('sets aria-valuenow to 0 when total is 0', () => {
    render(<ProgressBar total={0} done={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });






  it('has an accessible label on the progressbar', () => {
    render(<ProgressBar total={5} done={2} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'List progress');
  });
});
