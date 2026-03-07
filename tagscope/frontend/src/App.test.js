import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the application header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Retro Bookmarks/i);
  expect(headerElement).toBeInTheDocument();
});
