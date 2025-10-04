import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

// Helper to render with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Navbar', () => {
  it('renders the Polymath branding', () => {
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('Polymath')).toBeInTheDocument();
    expect(screen.getByText('Interdisciplinary Network')).toBeInTheDocument();
  });

  it('renders the main heading', () => {
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('Polymath Network')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    renderWithRouter(<Navbar />);
    
    expect(
      screen.getByText(/Where interdisciplinary minds converge/)
    ).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithRouter(<Navbar />);
    
    const searchInput = screen.getByPlaceholderText(
      'Search channels, topics, or fields...'
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('renders My Channels button', () => {
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('My Channels')).toBeInTheDocument();
  });

  it('renders Create Channel button', () => {
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('Create Channel')).toBeInTheDocument();
  });

  it('has a link to home page', () => {
    renderWithRouter(<Navbar />);
    
    const logoLink = screen.getByRole('link');
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
