import { render, screen, waitFor } from '@testing-library/react'
import AdminDashboardPage from '@/app/(admin)/admin/dashboard/page'

// Mock supabase client
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: 'admin-123' } } })
const mockFrom = jest.fn()

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock layout auth check
jest.mock('@/app/(admin)/layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('Admin Dashboard — Super Admin View', () => {
  const mockSports = [
    { id: 's1', name: 'Futsal', slug: 'futsal', logo_url: null },
    { id: 's2', name: 'Basket', slug: 'basket', logo_url: null },
    { id: 's3', name: 'Renang', slug: 'renang', logo_url: null },
  ]

  const mockTeams = [
    { id: 't1', name: 'SF Winner Sawangan', slug: 'sf-winner-sawangan', logo_url: null, branch_location: 'Sawangan', sport_id: 's1' },
    { id: 't2', name: 'SF Winner Margonda', slug: 'sf-winner-margonda', logo_url: null, branch_location: 'Margonda', sport_id: 's1' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: mockSports, error: null }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockTeams, error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({ count: 12 }, { count: 45 }, { count: 5 }, { count: 28 })
        }),
      })
  })

  describe('UI Rendering', () => {
    it('renders admin dashboard heading', () => {
      render(<AdminDashboardPage />)
      expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument()
    })

    it('shows stat cards for teams, players, tournaments, matches', async () => {
      render(<AdminDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/total teams/i)).toBeInTheDocument()
        expect(screen.getByText(/total players/i)).toBeInTheDocument()
        expect(screen.getByText(/tournaments/i)).toBeInTheDocument()
        expect(screen.getByText(/matches/i)).toBeInTheDocument()
      })
    })
  })

  describe('Teams By Sport', () => {
    it('groups teams by sport', async () => {
      render(<AdminDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Futsal')).toBeInTheDocument()
        expect(screen.getByText('Basket')).toBeInTheDocument()
        expect(screen.getByText('Renang')).toBeInTheDocument()
      })
    })

    it('shows team count per sport', async () => {
      render(<AdminDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/2 teams/i)).toBeInTheDocument()
      })
    })
  })
})