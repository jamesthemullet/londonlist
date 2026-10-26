import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAppContext } from '../../../context/AppContext';
import ListVisibilityToggle from '../../../components/list-visibility-toggle/list-visibility-toggle';

jest.mock('../../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

const mockUseAppContext = useAppContext as jest.Mock;

const defaultProps = {
  listDocumentId: 'doc-abc',
  isPublic: false,
  onToggle: jest.fn(),
  listName: 'Museum Trail',
};

describe('ListVisibilityToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppContext.mockReturnValue({
      user: { username: 'alice' },
    });
    // jsdom sets location.origin to '' by default
    delete (window as { location?: unknown }).location;
    (window as unknown as { location: { origin: string } }).location = { origin: 'https://londonlist.co.uk' };
  });

  it('renders the toggle label', () => {
    render(<ListVisibilityToggle {...defaultProps} />);
    expect(screen.getByText(/make .Museum Trail. public/i)).toBeInTheDocument();
  });

  it('renders the checkbox unchecked when isPublic is false', () => {
    render(<ListVisibilityToggle {...defaultProps} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders the checkbox checked when isPublic is true', () => {
    render(<ListVisibilityToggle {...defaultProps} isPublic={true} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onToggle when the checkbox changes', () => {
    const onToggle = jest.fn();
    render(<ListVisibilityToggle {...defaultProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not show the share URL when isPublic is false', () => {
    render(<ListVisibilityToggle {...defaultProps} />);
    expect(screen.queryByText(/share your list/i)).not.toBeInTheDocument();
  });

  it('shows the share URL when isPublic is true and user is set', () => {
    render(<ListVisibilityToggle {...defaultProps} isPublic={true} />);
    expect(screen.getByText(/share your list/i)).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('shows the Copy link button when isPublic is true', () => {
    render(<ListVisibilityToggle {...defaultProps} isPublic={true} />);
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
  });

  it('shows "Copied!" after clicking Copy link', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    render(<ListVisibilityToggle {...defaultProps} isPublic={true} />);
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
    await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
  });
});
