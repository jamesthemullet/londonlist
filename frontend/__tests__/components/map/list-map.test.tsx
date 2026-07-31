import { render, screen } from '@testing-library/react';
import ListMap from '../../../components/map/list-map';
import type { MapItem } from '../../../components/map/list-map';

const BRITISH_MUSEUM: MapItem = {
  documentId: 'item-1',
  name: 'British Museum',
  lat: 51.5194,
  lng: -0.1269,
  completed: false,
  category: 'museum',
};

const TOWER_OF_LONDON: MapItem = {
  documentId: 'item-2',
  name: 'Tower of London',
  lat: 51.5081,
  lng: -0.0759,
  completed: true,
  category: 'attraction',
};

describe('ListMap', () => {
  it('renders the map container', () => {
    render(<ListMap items={[BRITISH_MUSEUM]} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('has accessible aria-label on the map', () => {
    render(<ListMap items={[BRITISH_MUSEUM]} />);
    expect(screen.getByLabelText('Map showing list places')).toBeInTheDocument();
  });

  it('renders a marker for each item with coordinates', () => {
    render(<ListMap items={[BRITISH_MUSEUM, TOWER_OF_LONDON]} />);
    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(2);
  });

  it('renders a popup with the place name', () => {
    render(<ListMap items={[BRITISH_MUSEUM]} />);
    expect(screen.getByText('British Museum')).toBeInTheDocument();
  });

  it('shows the category inside the popup', () => {
    render(<ListMap items={[BRITISH_MUSEUM]} />);
    expect(screen.getByText('museum')).toBeInTheDocument();
  });

  it('shows "Done" status in popup for completed items', () => {
    render(<ListMap items={[TOWER_OF_LONDON]} />);
    expect(screen.getByText('✓ Done')).toBeInTheDocument();
  });

  it('shows "To do" status in popup for incomplete items', () => {
    render(<ListMap items={[BRITISH_MUSEUM]} />);
    expect(screen.getByText('○ To do')).toBeInTheDocument();
  });

  it('renders with no items without crashing', () => {
    render(<ListMap items={[]} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders popups for items without a category', () => {
    const noCategory: MapItem = { ...BRITISH_MUSEUM, category: null };
    render(<ListMap items={[noCategory]} />);
    expect(screen.getByText('British Museum')).toBeInTheDocument();
  });
});
