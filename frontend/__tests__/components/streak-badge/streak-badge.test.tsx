import { render, screen } from '@testing-library/react';
import StreakBadge from '../../../components/streak-badge/streak-badge';

describe('StreakBadge', () => {
  it('renders nothing when streak is 0 and not at risk', () => {
    const { container } = render(<StreakBadge streak={0} atRisk={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the streak count for a normal streak', () => {
    render(<StreakBadge streak={5} atRisk={false} />);
    expect(screen.getByText('5-month streak')).toBeInTheDocument();
  });

  it('renders the at-risk message when atRisk is true', () => {
    render(<StreakBadge streak={3} atRisk={true} />);
    expect(screen.getByText(/your 3-month streak is at risk/i)).toBeInTheDocument();
  });

  it('renders the at-risk badge even when streak is 0', () => {
    render(<StreakBadge streak={0} atRisk={true} />);
    expect(screen.getByText(/0-month streak is at risk/i)).toBeInTheDocument();
  });

  it('does not render the at-risk message for a healthy streak', () => {
    render(<StreakBadge streak={4} atRisk={false} />);
    expect(screen.queryByText(/at risk/i)).not.toBeInTheDocument();
  });
});
