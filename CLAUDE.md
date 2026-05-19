@AGENTS.md

# SF Winner Sports Club - Agent Instructions

## Project Overview
Multi-sport club management system for Futsal, Basketball, and Swimming. Built with Next.js 16 App Router + Supabase.

## Tech Stack
- Next.js 16.2.6 (App Router)
- Supabase (Postgres + Auth + SSR)
- Tailwind CSS 4
- TypeScript

## Critical Rules

### Node Version
- **REQUIRED: Node 18 LTS or 20 LTS**
- Node 24 is NOT compatible with this project
- Use `nvm use 18` before development

### Photo/Video Handling
- Photos use URL input (not file upload)
- Users paste URLs from Cloudinary/imgBB/Google Drive
- No Supabase Storage in use

### User Registration
- Coach/Manager accounts created ONLY by Super Admin
- No self-registration UI exists
- Registration via Supabase Dashboard or `/admin/users`

### Database Migrations
- All migrations in `supabase/migrations/`
- Run manually in Supabase SQL Editor
- Do NOT assume migrations auto-run

### File Naming
- Use kebab-case for page directories: `(app)/matches/[id]/edit/page.tsx`
- Use PascalCase for components: `MatchTimeline.tsx`
- Use camelCase for utilities: `createClient.ts`

## Code Patterns

### Client Component
```tsx
'use client'
import { createClient } from '@/utils/supabase/client'

export default function MyComponent() {
  const supabase = createClient()
  // ...
}
```

### Server Component (with auth check)
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  // ...
}
```

### API Route Handler
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  // ...
}
```

## Testing Requirements
- Run `npm test` before reporting completion
- Test new features manually in browser
- Verify no TypeScript errors: `npx tsc --noEmit`

## Current Date
Today is 2026-05-19