import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Helper to render with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Dashboard', () => {
  const mockChannels = [
    {
      _id: '1',
      title: 'Quantum Physics Discussion',
      description: 'A forum for discussing quantum mechanics',
      tags: [
        { _id: '1', name: 'physics', color: '#fbbf24' },
        { _id: '2', name: 'mathematics', color: '#60a5fa' },
      ],
      memberCount: 42,
      createdAt: '2025-10-03T12:00:00.000Z',
    },
    {
      _id: '2',
      title: 'Philosophy of Mind',
      description: 'Exploring consciousness and mental phenomena',
      tags: [{ _id: '3', name: 'philosophy', color: '#a78bfa' }],
      memberCount: 28,
      createdAt: '2025-10-03T12:00:00.000Z',
    },
  ];

  const mockTags = [
    { _id: '1', name: 'physics', color: '#fbbf24' },
    { _id: '2', name: 'mathematics', color: '#60a5fa' },
    { _id: '3', name: 'philosophy', color: '#a78bfa' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithRouter(<Dashboard />);

    expect(screen.getByText('Polymath Network')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithRouter(<Dashboard />);

    expect(
      screen.getByText(/Where interdisciplinary minds converge/)
    ).toBeInTheDocument();
  });

  it('renders search input', () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithRouter(<Dashboard />);

    expect(
      screen.getByPlaceholderText(/Search channels, topics, or fields/i)
    ).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    vi.mocked(axios.get).mockImplementation(() => new Promise(() => {}));
    renderWithRouter(<Dashboard />);

    expect(screen.getByText('Loading channels...')).toBeInTheDocument();
  });

  it('fetches and displays channels', async () => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url.includes('/channels')) {
        return Promise.resolve({ data: mockChannels });
      }
      return Promise.resolve({ data: mockTags });
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quantum Physics Discussion')).toBeInTheDocument();
      expect(screen.getByText('Philosophy of Mind')).toBeInTheDocument();
    });
  });

  it('fetches and displays tags', async () => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url.includes('/tags')) {
        return Promise.resolve({ data: mockTags });
      }
      return Promise.resolve({ data: mockChannels });
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      // Use getAllByText since tags appear both in filter and channel cards
      const physicsElements = screen.getAllByText('Physics');
      const mathematicsElements = screen.getAllByText('Mathematics');
      const philosophyElements = screen.getAllByText('Philosophy');

      // Should have at least one of each
      expect(physicsElements.length).toBeGreaterThan(0);
      expect(mathematicsElements.length).toBeGreaterThan(0);
      expect(philosophyElements.length).toBeGreaterThan(0);
    });
  });

  it('shows error message when fetching channels fails', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load channels/i)
      ).toBeInTheDocument();
    });
  });

  it('renders All Fields filter button', () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithRouter(<Dashboard />);

    expect(screen.getByText('All Fields')).toBeInTheDocument();
  });

  it('calls the correct API endpoints', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/channels');
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/tags');
    });
  });

  it('displays channel descriptions', async () => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url.includes('/channels')) {
        return Promise.resolve({ data: mockChannels });
      }
      return Promise.resolve({ data: mockTags });
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('A forum for discussing quantum mechanics')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Exploring consciousness and mental phenomena')
      ).toBeInTheDocument();
    });
  });
});
