import { render, screen } from '@testing-library/react';
import StreakBadge from './streak-badge';

describe('StreakBadge', () => {
  it('renders nothing when streak is 0 and not at risk', () => {
    const { container } = render(<StreakBadge streak={0} atRisk={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the streak count when streak is positive', () => {
    render(<StreakBadge streak={3} atRisk={false} />);
    expect(screen.getByText('3-month streak')).toBeInTheDocument();
  });

  it('renders the at-risk warning when atRisk is true', () => {
    render(<StreakBadge streak={5} atRisk={true} />);
    expect(
      screen.getByText(/Your 5-month streak is at risk/),
    ).toBeInTheDocument();
  });

  it('at-risk message urges visiting before month end', () => {
    render(<StreakBadge streak={2} atRisk={true} />);
    expect(screen.getByText(/visit somewhere before the end of the month/i)).toBeInTheDocument();
  });

  it('renders the at-risk badge even when streak is 0', () => {
    render(<StreakBadge streak={0} atRisk={true} />);
    expect(screen.getByText(/Your 0-month streak is at risk/)).toBeInTheDocument();
  });

  it('renders a 1-month streak correctly', () => {
    render(<StreakBadge streak={1} atRisk={false} />);
    expect(screen.getByText('1-month streak')).toBeInTheDocument();
  });
});
