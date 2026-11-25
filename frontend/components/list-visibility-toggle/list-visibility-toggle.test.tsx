import { fireEvent, render, screen } from '@testing-library/react';
import ListVisibilityToggle from './list-visibility-toggle';

const renderToggle = (isPublic: boolean, onToggle = jest.fn()) => {
  render(<ListVisibilityToggle isPublic={isPublic} onToggle={onToggle} listName="Weekend Wanders" />);
  return onToggle;
};

describe('ListVisibilityToggle', () => {
  it('names the group after the list', () => {
    renderToggle(false);
    expect(screen.getByRole('group', { name: /Visibility of .Weekend Wanders./ })).toBeInTheDocument();
  });

  it('renders Private and Public options', () => {
    renderToggle(false);
    expect(screen.getByRole('radio', { name: 'Private' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Public' })).toBeInTheDocument();
  });

  it('selects Private when the list is private', () => {
    renderToggle(false);
    expect(screen.getByRole('radio', { name: 'Private' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Public' })).not.toBeChecked();
  });

  it('selects Public when the list is public', () => {
    renderToggle(true);
    expect(screen.getByRole('radio', { name: 'Public' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Private' })).not.toBeChecked();
  });

  it('calls onToggle when switching a private list to Public', () => {
    const onToggle = renderToggle(false);
    fireEvent.click(screen.getByRole('radio', { name: 'Public' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onToggle when switching a public list to Private', () => {
    const onToggle = renderToggle(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Private' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggle when clicking the option that is already selected', () => {
    const onToggle = renderToggle(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Public' }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
