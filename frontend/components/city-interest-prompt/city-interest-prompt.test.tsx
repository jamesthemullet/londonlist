import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CityInterestPrompt from './city-interest-prompt';

const mockMutate = jest.fn();

jest.mock('@apollo/client/react', () => ({
  useMutation: () => [mockMutate, {}],
}));

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

describe('CityInterestPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMutate.mockReset();
    mockMutate.mockResolvedValue({ data: { submitCityInterest: true } });
  });

  it('renders the prompt when not dismissed', () => {
    render(<CityInterestPrompt />);
    expect(screen.getByLabelText('City interest survey')).toBeInTheDocument();
    expect(screen.getByText(/Want lists for other cities/)).toBeInTheDocument();
  });

  it('does not render when already dismissed', () => {
    localStorage.setItem('city_interest_prompt_dismissed', '1');
    const { container } = render(<CityInterestPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('dismisses when the ✕ button is clicked', () => {
    render(<CityInterestPrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss city interest prompt' }));
    expect(screen.queryByLabelText('City interest survey')).not.toBeInTheDocument();
    expect(localStorage.getItem('city_interest_prompt_dismissed')).toBe('1');
  });

  it('disables submit when city is empty', () => {
    render(<CityInterestPrompt />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('enables submit when city is typed', () => {
    render(<CityInterestPrompt />);
    fireEvent.change(screen.getByPlaceholderText(/Paris/), { target: { value: 'Tokyo' } });
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
  });

  it('calls mutation and shows thank-you on submit', async () => {
    render(<CityInterestPrompt />);
    fireEvent.change(screen.getByPlaceholderText(/Paris/), { target: { value: 'Tokyo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ variables: { city: 'Tokyo' } });
      expect(screen.getByRole('status')).toHaveTextContent(/Tokyo/);
    });

    expect(localStorage.getItem('city_interest_prompt_dismissed')).toBe('1');
  });

  it('trims whitespace from city input before submitting', async () => {
    render(<CityInterestPrompt />);
    fireEvent.change(screen.getByPlaceholderText(/Paris/), { target: { value: '  Paris  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ variables: { city: 'Paris' } });
    });
  });
});
