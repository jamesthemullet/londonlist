import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('should render', () => {
    const text = 'Test Button';
    render(<Button>{text}</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });
});
