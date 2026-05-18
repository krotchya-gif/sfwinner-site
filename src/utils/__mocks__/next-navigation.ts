export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
})

export const usePathname = () => '/'

export function useSearchParams() {
  return new URLSearchParams()
}