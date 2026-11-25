import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListVisibilityToggle from '../../../components/list-visibility-toggle/list-visibility-toggle';

const defaultProps = {
  isPublic: false,
  onToggle: jest.fn(),
  listName: 'Museum Trail',
};

describe('ListVisibilityToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('labels the control with the list name', () => {
    render(<ListVisibilityToggle {...defaultProps} />);
    expect(screen.getByRole('group', { name: /visibility of .Museum Trail./i })).toBeInTheDocument();
  });

  it('does not render a share link (the page owns sharing)', () => {
    render(<ListVisibilityToggle {...defaultProps} isPublic />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('lets keyboard users switch visibility with the arrow keys', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(<ListVisibilityToggle {...defaultProps} onToggle={onToggle} />);

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Private' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('puts only the selected option in the tab order', async () => {
    const user = userEvent.setup();
    render(<ListVisibilityToggle {...defaultProps} isPublic />);

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Public' })).toHaveFocus();
  });
});
