import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListItemRow } from '../../../components/my-list/my-list';

const BASE_ITEM = {
  documentId: 'item-1',
  name: 'British Museum',
  category: 'museum',
  completed: false,
  osm_id: '123',
  visitedAt: null,
  notes: null,
};

function makeProps(overrides?: Partial<typeof BASE_ITEM>) {
  return {
    item: { ...BASE_ITEM, ...overrides },
    onToggle: jest.fn(),
    onDelete: jest.fn(),
    onSaveNotes: jest.fn(),
  };
}

describe('ListItemRow — notes display', () => {
  it('shows "Add note" button when notes is null', () => {
    render(<ListItemRow {...makeProps({ notes: null })} />);
    expect(screen.getByRole('button', { name: '+ Add note' })).toBeInTheDocument();
  });

  it('shows "Add note" button when notes is empty string', () => {
    render(<ListItemRow {...makeProps({ notes: '' })} />);
    expect(screen.getByRole('button', { name: '+ Add note' })).toBeInTheDocument();
  });

  it('renders the notes text when notes is set', () => {
    render(<ListItemRow {...makeProps({ notes: 'Book ahead on weekends' })} />);
    expect(screen.getByText('Book ahead on weekends')).toBeInTheDocument();
  });

  it('does not show "Add note" button when notes is set', () => {
    render(<ListItemRow {...makeProps({ notes: 'My tip' })} />);
    expect(screen.queryByRole('button', { name: '+ Add note' })).not.toBeInTheDocument();
  });
});

describe('ListItemRow — entering notes edit mode', () => {
  it('clicking "Add note" shows the textarea', async () => {
    const user = userEvent.setup();
    render(<ListItemRow {...makeProps({ notes: null })} />);
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    expect(screen.getByRole('textbox', { name: `Notes for British Museum` })).toBeInTheDocument();
  });

  it('clicking the existing note text opens the textarea prefilled', async () => {
    const user = userEvent.setup();
    render(<ListItemRow {...makeProps({ notes: 'Pre-existing tip' })} />);
    await user.click(screen.getByRole('button', { name: 'Edit note for British Museum' }));
    const textarea = screen.getByRole('textbox', { name: 'Notes for British Museum' });
    expect(textarea).toHaveValue('Pre-existing tip');
  });

  it('shows Save and Cancel buttons in edit mode', async () => {
    const user = userEvent.setup();
    render(<ListItemRow {...makeProps({ notes: null })} />);
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});

describe('ListItemRow — saving notes', () => {
  it('calls onSaveNotes with the typed value on Save', async () => {
    const user = userEvent.setup();
    const props = makeProps({ notes: null });
    render(<ListItemRow {...props} />);
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Notes for British Museum' }), 'Great view');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(props.onSaveNotes).toHaveBeenCalledWith('Great view');
  });

  it('calls onSaveNotes with null when saving an empty value', async () => {
    const user = userEvent.setup();
    const props = makeProps({ notes: null });
    render(<ListItemRow {...props} />);
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(props.onSaveNotes).toHaveBeenCalledWith(null);
  });

  it('calls onSaveNotes with null when saving whitespace-only text', async () => {
    const user = userEvent.setup();
    const props = makeProps({ notes: null });
    render(<ListItemRow {...props} />);
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Notes for British Museum' }), '   ');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(props.onSaveNotes).toHaveBeenCalledWith(null);
  });

  it('hides the textarea after saving', async () => {
    const user = userEvent.setup();
    render(<ListItemRow {...makeProps({ notes: null })} />);
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Notes for British Museum' }), 'Tip');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      screen.queryByRole('textbox', { name: 'Notes for British Museum' }),
    ).not.toBeInTheDocument();
  });
});

describe('ListItemRow — cancelling notes edit', () => {
  it('hides the textarea on Cancel without calling onSaveNotes', async () => {
    const user = userEvent.setup();
    const props = makeProps({ notes: null });
    render(<ListItemRow {...props} />);
    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Notes for British Museum' }), 'Unsaved');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onSaveNotes).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('textbox', { name: 'Notes for British Museum' }),
    ).not.toBeInTheDocument();
  });

  it('restores the original notes text on Cancel', async () => {
    const user = userEvent.setup();
    render(<ListItemRow {...makeProps({ notes: 'Original note' })} />);
    await user.click(screen.getByRole('button', { name: 'Edit note for British Museum' }));
    const textarea = screen.getByRole('textbox', { name: 'Notes for British Museum' });
    await user.clear(textarea);
    await user.type(textarea, 'Changed note');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Original note')).toBeInTheDocument();
  });
});

describe('ListItemRow — other behaviour', () => {
  it('renders the item name', () => {
    render(<ListItemRow {...makeProps()} />);
    expect(screen.getByText('British Museum')).toBeInTheDocument();
  });

  it('renders the category badge', () => {
    render(<ListItemRow {...makeProps()} />);
    expect(screen.getByText('museum')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox changes', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<ListItemRow {...props} />);
    await user.click(screen.getByRole('checkbox'));
    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<ListItemRow {...props} />);
    await user.click(screen.getByRole('button', { name: 'Remove British Museum' }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders visitedAt date for completed items', () => {
    render(
      <ListItemRow
        {...makeProps({ completed: true, visitedAt: '2026-06-15T10:00:00.000Z' })}
      />,
    );
    expect(screen.getByText(/Visited/)).toBeInTheDocument();
  });
});
