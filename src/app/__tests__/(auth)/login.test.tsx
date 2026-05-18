import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(auth)/login/page'

const mockSignInWithPassword = jest.fn()
const mockPush = jest.fn()

// Override the jest.setup mock for login-specific behavior
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('Login Page — Auth Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('UI Rendering', () => {
    it('renders email and password inputs', () => {
      render(<LoginPage />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('renders login button', () => {
      render(<LoginPage />)
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'not-an-email')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  describe('Authentication — Failure', () => {
    it('shows error message on invalid credentials', async () => {
      const user = userEvent.setup()

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      })

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(await screen.findByText(/invalid login credentials/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('disables button and shows loading text during sign in', async () => {
      const user = userEvent.setup()

      mockSignInWithPassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: null }), 500)))

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'coach@sfwinner.site')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })
})