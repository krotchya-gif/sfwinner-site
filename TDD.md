# TDD Workflow — SF Winner Project

## Prinsip

**RED → GREEN → REFACTOR** sebelum nulis fitur baru:
1. `RED` — Tulis test dulu, pasti gagal
2. `GREEN` — Implementasi se-simpel mungkin biar test pass
3. `REFACTOR` — Perbaiki code, test tetap hijau

**Test after** (write tests after implementation):
- Setiap fitur baru selesai → langsung tulis test
- Review code → test udah ada, langsung verify

## Setup

```bash
cd app
npm install --save-dev jest @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom jest-environment-jsdom @types/jest ts-jest

# Run tests
npm test            # once
npm run test:watch  # watch mode
npm run test:coverage  # coverage report
```

## Struktur Test

```
app/
├── jest.config.ts        # Jest config (ts-jest, moduleNameMapper)
├── jest.setup.ts          # Global mocks (Supabase, next/navigation)
└── src/app/__tests__/
    ├── (auth)/login.test.tsx
    ├── (app)/players.test.tsx
    ├── (admin)/admin-dashboard.test.tsx
    ├── (public)/team-slug.test.tsx
    └── api/teams.test.ts
```

## Per-Tipe Component

### Client Components (React hooks, useState, useEffect)
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SomePage from '@/app/...'

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ /* mock return values */ }),
}))

describe('Some Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // re-setup per-test mocks here
  })

  it('renders UI elements', () => { ... })
  it('handles user interaction', async () => { ... })
  it('shows loading state', async () => { ... })
})
```

### Server Components (async, Next.js 16)
```typescript
// Mock params as Promise (Next.js 16 pattern)
const mockParams = Promise.resolve({ slug: 'team-slug' })

jest.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'teams') return { /* mock for teams */ }
      if (table === 'players') return { /* mock for players */ }
      return {}
    },
  }),
}))

it('renders team name', async () => {
  render(await TeamPage({ params: mockParams }))
  expect(screen.getByText('Team Name')).toBeInTheDocument()
})
```

### API Routes (Route Handlers)
```typescript
import { NextRequest } from 'next/server'

jest.mock('@/utils/supabase/server', () => ({
  createClient: () => ({ from: () => ({ /* ... */ }) }),
}))

describe('GET /api/teams', () => {
  it('returns 400 without sport param', async () => {
    const { GET } = await import('@/app/api/teams/route')
    const req = new NextRequest('http://localhost/api/teams')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('only exposes public fields (privacy)', async () => {
    // ...verify private fields are not in response
  })
})
```

## Test Categories untuk Setiap Fitur

### Auth Flow
- ✅ Renders login form (email, password, button)
- ✅ Form validation (empty fields, invalid email format)
- ✅ Shows error on wrong credentials
- ✅ Redirects to /dashboard on success
- ✅ Loading state during authentication
- ✅ Clears error when user types new input

### Players Page
- ✅ Renders player list (names, jersey numbers, positions)
- ✅ Shows status badges (active, promoted, graduated)
- ✅ Search/filter by name works
- ✅ Shows empty state when no players
- ✅ Add player button exists

### Admin Dashboard
- ✅ Renders stat cards (teams, players, tournaments, matches)
- ✅ Groups teams by sport
- ✅ Shows team count per sport
- ✅ Auth guard: non-super_admin gets redirected

### Public Pages (/team/[slug], /tournament/[slug])
- ✅ Renders public data (name, photo, achievements)
- ✅ NEVER exposes private fields (DOB, NISN, parent contact, medical)
- ✅ 404 when resource not found
- ✅ Shows matches and results

### API Routes
- ✅ Returns correct HTTP status codes (400 for bad input, 404 for not found, 200 for success)
- ✅ Has CORS headers `Access-Control-Allow-Origin: *`
- ✅ Returns `application/json` content-type
- ✅ Only returns public fields (privacy test)
- ✅ Handles empty results gracefully

## Privacy Test Pattern (WAJIB untuk setiap public-facing component)

```typescript
it('never exposes private fields in public page', async () => {
  render(await SomePublicPage({ params: mockParams }))

  const pageContent = document.body.textContent || ''

  // These must NOT appear anywhere
  expect(pageContent).not.toMatch(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)  // dates (DOB)
  expect(pageContent).not.toMatch(/nisn/i)
  expect(pageContent).not.toMatch(/parent.*phone/i)
  expect(pageContent).not.toMatch(/medical/i)
  expect(pageContent).not.toMatch(/address/i)
})
```

## Workflow: Tambah Fitur Baru

1. **Tentukan test cases dulu** — tulis di comment atau test file
2. **Run test** → RED (fails) — karena belum ada code
3. **Implement fitur** → GREEN
4. **Refactor** → semua test tetap hijau
5. **Commit** → include test files

## Workflow: Setelah Implementasi

1. Cek semua route udah punya test
2. Run `npm test` → must pass all
3. Jika ada regression → fix dulu sebelum lanjut
4. Tulis test untuk edge cases yang ketemu pas testing manual

## Coverage Target

- **Auth pages**: 100% coverage
- **Public pages**: must pass privacy tests (0 private field leaks)
- **API routes**: must pass validation + CORS tests
- **Admin pages**: must pass auth guard tests

## Pitfalls

1. **Async server components** — params is `Promise<T>` in Next.js 16. Must `await` when passing to component.
2. **Supabase client** — both browser (client) and server variants need mocking. Use the right one per test type.
3. **Route groups** — `(auth)`, `(app)` etc don't affect URL. Tests use same path as production URL.
4. **Mock order** — module mocks are evaluated once. Override per-test with `beforeEach` + `jest.doMock()` for complex scenarios.
5. **waitFor timeout** — default 1s. Use `{ timeout: 3000 }` for async data fetches in server components.