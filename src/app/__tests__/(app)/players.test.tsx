import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayersPage from '@/app/(app)/players/page'

// Mock supabase client
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
const mockFrom = jest.fn()

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

describe('Players Page — Team Manager View', () => {
  const mockPlayers = [
    { id: 'p1', display_name: 'Budi Santoso', jersey_number: 10, position: 'Forward', status: 'active', photo_url: null, age_classes: { name: 'U-10' }, teams: { name: 'SF Winner', slug: 'sf-winner', sports: { name: 'Futsal', slug: 'futsal' } } },
    { id: 'p2', display_name: 'Andi Wijaya', jersey_number: 7, position: 'Midfielder', status: 'active', photo_url: null, age_classes: { name: 'U-12' }, teams: { name: 'SF Winner', slug: 'sf-winner', sports: { name: 'Futsal', slug: 'futsal' } } },
    { id: 'p3', display_name: 'Dewi Lestari', jersey_number: 9, position: 'Forward', status: 'promoted', photo_url: null, age_classes: { name: 'U-14' }, teams: { name: 'SF Winner', slug: 'sf-winner', sports: { name: 'Futsal', slug: 'futsal' } } },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockPlayers, error: null }),
    }))
  })

  describe('UI Rendering', () => {
    it('renders players page with heading', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('heading', { name: /players/i })).toBeInTheDocument()
    })

    it('shows Add Player button', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('button', { name: /add player/i })).toBeInTheDocument()
    })

    it('shows search input', () => {
      render(<PlayersPage />)
      expect(screen.getByPlaceholderText(/search players/i)).toBeInTheDocument()
    })
  })

  describe('Player List', () => {
    it('displays player names in the list', async () => {
      render(<PlayersPage />)
      await waitFor(() => {
        expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
        expect(screen.getByText('Andi Wijaya')).toBeInTheDocument()
      })
    })

    it('shows jersey number for each player', async () => {
      render(<PlayersPage />)
      await waitFor(() => {
        expect(screen.getByText('#10')).toBeInTheDocument()
        expect(screen.getByText('#7')).toBeInTheDocument()
      })
    })

    it('shows player position', async () => {
      render(<PlayersPage />)
      await waitFor(() => {
        expect(screen.getAllByText('Forward')[0]).toBeInTheDocument()
      })
    })

    it('shows status badge for promoted players', async () => {
      render(<PlayersPage />)
      await waitFor(() => {
        const promotedBadge = screen.getByText('promoted')
        expect(promotedBadge).toBeInTheDocument()
      })
    })
  })

  describe('Search / Filter', () => {
    it('filters players by name', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)

      await waitFor(() => screen.getByText('Budi Santoso'))

      await user.type(screen.getByPlaceholderText(/search players/i), 'Andi')

      await waitFor(() => {
        expect(screen.getByText('Andi Wijaya')).toBeInTheDocument()
        expect(screen.queryByText('Budi Santoso')).not.toBeInTheDocument()
      })
    })

    it('shows no results when search matches nothing', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)

      await waitFor(() => screen.getByText('Budi Santoso'))

      await user.type(screen.getByPlaceholderText(/search players/i), 'XYZNOTFOUND')

      await waitFor(() => {
        expect(screen.getByText(/no players found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no players exist', async () => {
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }))

      render(<PlayersPage />)

      await waitFor(() => {
        expect(screen.getByText(/no players yet/i)).toBeInTheDocument()
      })
    })
  })
})