import { describe, it, expect, vi } from 'vitest';
import { renderWithRouter, screen } from '../test/utils';
import Layout from './Layout';

vi.mock('./SideNav', () => ({
  __esModule: true,
  default: () => <aside>Mock SideNav</aside>,
}));

vi.mock('./Dashboard', () => ({
  __esModule: true,
  default: () => <div>Mock Dashboard view</div>,
}));

vi.mock('./CreateChannel', () => ({
  __esModule: true,
  default: () => <div>Mock Create Channel view</div>,
}));

vi.mock('./Channel', () => ({
  __esModule: true,
  default: () => <div>Mock Channel detail</div>,
}));

vi.mock('./MyChannels', () => ({
  __esModule: true,
  default: () => <div>Mock MyChannels route</div>,
}));

describe('Layout', () => {
  it('renders the SideNav alongside the default dashboard route', () => {
    renderWithRouter(<Layout />);

    expect(screen.getByText(/mock sidenav/i)).toBeInTheDocument();
    expect(screen.getByText(/mock dashboard view/i)).toBeInTheDocument();
  });

  it('renders the Create Channel route', () => {
    renderWithRouter(<Layout />, '/create');

    expect(screen.getByText(/mock create channel view/i)).toBeInTheDocument();
  });

  it('renders the MyChannels route', () => {
    renderWithRouter(<Layout />, '/my-channels');

    expect(screen.getByText(/mock mychannels route/i)).toBeInTheDocument();
  });

  it('renders the Channel detail route', () => {
    renderWithRouter(<Layout />, '/channels/abc123');

    expect(screen.getByText(/mock channel detail/i)).toBeInTheDocument();
  });
});
