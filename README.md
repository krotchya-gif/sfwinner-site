# SF Winner Sports Club

Sistem management olahraga untuk klub olahraga SF Winner (Futsal, Basketball, Renang).

## Tech Stack

- **Framework:** Next.js 16.2.6 (App Router)
- **Backend:** Supabase (PostgreSQL + Auth + SSR)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript
- **Testing:** Jest + React Testing Library

## Requirements

- **Node.js 18 LTS** or **Node.js 20 LTS** (Node 24 is NOT compatible)

## Setup

```bash
# Install Node 18 via nvm (Windows: https://github.com/coreybutler/nvm-windows)
nvm install 18
nvm use 18

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/
│   ├── (admin)/          # Admin panel pages
│   │   └── admin/
│   │       ├── dashboard/   # Admin dashboard
│   │       ├── players/     # Admin player management
│   │       ├── teams/       # Admin team management
│   │       ├── sports/      # Admin sport management
│   │       ├── tournaments/  # Admin tournament management
│   │       ├── users/        # Admin user management
│   │       └── reports/      # Admin reports
│   ├── (app)/            # Team manager pages
│   │   ├── dashboard/      # Team dashboard
│   │   ├── players/         # Player management
│   │   ├── matches/         # Match management
│   │   ├── achievements/    # Achievement management
│   │   └── age-classes/     # Age class management
│   ├── (auth)/           # Authentication
│   │   └── login/           # Login page
│   ├── (public)/         # Public pages
│   │   ├── player/[id]/     # Public player profile
│   │   └── team/[slug]/     # Public team page
│   ├── (sport)/          # Sport portals (subdomain routing)
│   │   ├── futsal/          # Futsal portal
│   │   ├── basketball/      # Basketball portal
│   │   └── renang/          # Swimming portal
│   └── api/              # API routes
│       ├── admin/users/     # Admin user CRUD
│       ├── matches/         # Match API
│       ├── players/         # Player API
│       ├── sports/          # Sport API
│       ├── teams/           # Team API
│       └── tournaments/     # Tournament API
├── components/
│   ├── dashboard/          # Dashboard widgets
│   ├── match/              # Match components
│   └── tournament/         # Tournament components
└── utils/
    └── supabase/           # Supabase clients
supabase/
├── migrations/             # Database migrations
└── seeds/                 # Seed data
```

## Features

### Team Manager Panel (app.sfwinner.site)
- [x] Dashboard with stats and upcoming matches
- [x] Player management (add, edit, promote, delete)
- [x] Match management (add, edit, delete)
- [x] Match detail page with timeline events
- [x] Achievement tracking
- [x] Age class management

### Admin Panel (app.sfwinner.site/admin)
- [x] Dashboard overview
- [x] Team management
- [x] Player management
- [x] Sport management
- [x] Tournament management (CRUD)
- [x] User management (create/edit/delete coaches/managers)
- [x] Reports

### Public Portals
- [x] Sport-specific portals (futsal, basketball, swimming)
- [x] Team profile pages
- [x] Tournament detail pages with standings & stats
- [x] Tournament leaderboard (standings + top scorers)
- [x] Public player profiles

## Database Migrations

Run migrations in Supabase SQL Editor:
```sql
-- Order matters! Run in numerical order:
-- 001_initial_schema.sql
-- 002_fix_team_assignments.sql
-- 003_add_age_class_id_to_players.sql
-- 004_assign_age_class_id_to_players.sql
-- 005_auto_create_user_on_signup.sql
-- 006_fix_existing_auth_users.sql
-- 007_tournament_stats_schema.sql
-- 008_match_events.sql
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-key
```

## Deployment

Deploy to Vercel:
```bash
npm run build
```

Vercel will auto-detect Next.js and use appropriate Node version.

## Testing

```bash
npm test           # Run tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```

## License

Private - SF Winner Sports Club