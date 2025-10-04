import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils';
import { BrowserRouter } from 'react-router-dom';
import CreateChannel from './CreateChannel';

// Mock axios
vi.mock('axios');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CreateChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form title', () => {
    renderWithRouter(<CreateChannel />);

    expect(screen.getByText('Launch Your Channel')).toBeInTheDocument();
  });

  it('renders back to channels link', () => {
    renderWithRouter(<CreateChannel />);

    expect(screen.getByText('Back to Channels')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderWithRouter(<CreateChannel />);

    expect(screen.getByLabelText(/Channel Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a field/i)).toBeInTheDocument();
  });

  // Note: User interaction tests are skipped due to jsdom/Chakra UI CSS compatibility issues
  // These tests would work in a real browser environment or with Playwright/Cypress
});

