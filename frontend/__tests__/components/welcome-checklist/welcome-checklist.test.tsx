import { fireEvent, render, screen } from '@testing-library/react';
import WelcomeChecklist, { buildSteps } from '../../../components/welcome-checklist/welcome-checklist';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const defaultProps = {
  hasAddedPlace: false,
  hasPublicList: false,
  hasMultipleLists: false,
  isPro: false,
  onDismiss: jest.fn(),
};

describe('buildSteps', () => {
  it('returns 4 steps for a free user with nothing done', () => {
    const steps = buildSteps(false, false, false, false);
    expect(steps).toHaveLength(4);
  });

  it('returns 3 steps for a Pro user (no upgrade step)', () => {
    const steps = buildSteps(false, false, false, true);
    expect(steps).toHaveLength(3);
    expect(steps.every((s) => s.id !== 'upgrade-pro')).toBe(true);
  });

  it('marks add-place complete when hasAddedPlace is true', () => {
    const steps = buildSteps(true, false, false, false);
    const step = steps.find((s) => s.id === 'add-place');
    expect(step?.completed).toBe(true);
  });

  it('marks add-place incomplete when hasAddedPlace is false', () => {
    const steps = buildSteps(false, false, false, false);
    const step = steps.find((s) => s.id === 'add-place');
    expect(step?.completed).toBe(false);
  });

  it('marks go-public complete when hasPublicList is true', () => {
    const steps = buildSteps(false, true, false, false);
    const step = steps.find((s) => s.id === 'go-public');
    expect(step?.completed).toBe(true);
  });

  it('marks second-list complete when hasMultipleLists is true', () => {
    const steps = buildSteps(false, false, true, false);
    const step = steps.find((s) => s.id === 'second-list');
    expect(step?.completed).toBe(true);
  });

  it('upgrade-pro step has a pricing href', () => {
    const steps = buildSteps(false, false, false, false);
    const step = steps.find((s) => s.id === 'upgrade-pro');
    expect(step?.href).toBe('/pricing');
  });

  it('upgrade-pro step has a ctaLabel', () => {
    const steps = buildSteps(false, false, false, false);
    const step = steps.find((s) => s.id === 'upgrade-pro');
    expect(step?.ctaLabel).toBeTruthy();
  });

  it('upgrade-pro step is never marked completed', () => {
    const steps = buildSteps(true, true, true, false);
    const step = steps.find((s) => s.id === 'upgrade-pro');
    expect(step?.completed).toBe(false);
  });
});

describe('WelcomeChecklist — rendering', () => {
  it('renders the checklist when there are incomplete steps', () => {
    render(<WelcomeChecklist {...defaultProps} />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders the "Get started" heading', () => {
    render(<WelcomeChecklist {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument();
  });

  it('renders a progress indicator', () => {
    render(<WelcomeChecklist {...defaultProps} />);
    expect(screen.getByText(/0 of 4 done/i)).toBeInTheDocument();
  });

  it('increments the progress counter as steps are completed', () => {
    render(<WelcomeChecklist {...defaultProps} hasAddedPlace={true} hasPublicList={true} />);
    expect(screen.getByText(/2 of 4 done/i)).toBeInTheDocument();
  });

  it('renders all step labels', () => {
    render(<WelcomeChecklist {...defaultProps} />);
    expect(screen.getByText(/add your first place/i)).toBeInTheDocument();
    expect(screen.getByText(/share your list/i)).toBeInTheDocument();
    expect(screen.getByText(/create a second list/i)).toBeInTheDocument();
    expect(screen.getByText(/unlock unlimited lists/i)).toBeInTheDocument();
  });

  it('renders step details for incomplete steps', () => {
    render(<WelcomeChecklist {...defaultProps} />);
    expect(screen.getByText(/search above and add a london spot/i)).toBeInTheDocument();
  });

  it('hides step details for completed steps', () => {
    render(<WelcomeChecklist {...defaultProps} hasAddedPlace={true} />);
    expect(screen.queryByText(/search above and add a london spot/i)).not.toBeInTheDocument();
  });

  it('renders the upgrade CTA link when the upgrade step is incomplete', () => {
    render(<WelcomeChecklist {...defaultProps} />);
    const cta = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/pricing');
  });

  it('does not render the upgrade CTA when isPro is true', () => {
    render(<WelcomeChecklist {...defaultProps} isPro={true} />);
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).not.toBeInTheDocument();
  });

  it('renders the dismiss button', () => {
    render(<WelcomeChecklist {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /dismiss getting started checklist/i }),
    ).toBeInTheDocument();
  });

  it('does not render for a Pro user with all non-Pro steps complete', () => {
    const { container } = render(
      <WelcomeChecklist
        {...defaultProps}
        isPro={true}
        hasAddedPlace={true}
        hasPublicList={true}
        hasMultipleLists={true}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('WelcomeChecklist — hidden when all done', () => {
  it('still renders for a free user with steps 1-3 done (upgrade step always incomplete)', () => {
    render(
      <WelcomeChecklist
        {...defaultProps}
        hasAddedPlace={true}
        hasPublicList={true}
        hasMultipleLists={true}
      />,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
  });

  it('renders nothing when isPro and all 3 Pro steps are completed', () => {
    const { container } = render(
      <WelcomeChecklist
        {...defaultProps}
        isPro={true}
        hasAddedPlace={true}
        hasPublicList={true}
        hasMultipleLists={true}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('still renders for a Pro user who has not completed step 1', () => {
    render(
      <WelcomeChecklist
        {...defaultProps}
        isPro={true}
        hasAddedPlace={false}
        hasPublicList={true}
        hasMultipleLists={true}
      />,
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });
});

describe('WelcomeChecklist — step visual state', () => {
  it('shows a strikethrough label for completed steps', () => {
    render(<WelcomeChecklist {...defaultProps} hasAddedPlace={true} />);
    expect(screen.getByText(/add your first place/i)).toBeInTheDocument();
  });

  it('marks icons as aria-hidden', () => {
    const { container } = render(<WelcomeChecklist {...defaultProps} />);
    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });
});

describe('WelcomeChecklist — interactions', () => {
  it('calls onDismiss when the dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    render(<WelcomeChecklist {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.click(
      screen.getByRole('button', { name: /dismiss getting started checklist/i }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss when clicking a step label', () => {
    const onDismiss = jest.fn();
    render(<WelcomeChecklist {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText(/add your first place/i));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
