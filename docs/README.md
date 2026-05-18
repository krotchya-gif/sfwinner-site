# SF Winner Sports Club

Website untuk club olahraga dengan fitur management tim, tournament, dan portal publik untuk setiap cabang olahraga.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, API)
- **Deployment:** Vercel
- **DNS:** Hostinger (WordPress) + Vercel (subdomains)

## Project Structure

```
sfwinner-site/
├── src/
│   ├── app/
│   │   ├── (app)/              # Team Manager Panel (authenticated)
│   │   │   ├── dashboard/
│   │   │   ├── players/
│   │   │   ├── matches/
│   │   │   ├── tournaments/
│   │   │   ├── age-classes/
│   │   │   └── achievements/
│   │   ├── (admin)/           # Super Admin Panel
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── teams/
│   │   │   │   ├── players/
│   │   │   │   ├── sports/
│   │   │   │   └── tournaments/
│   │   │   └── admin/(routes)
│   │   ├── (auth)/            # Authentication
│   │   │   └── login/
│   │   ├── (public)/          # Public Pages
│   │   │   └── tournament/[slug]/
│   │   ├── (sport)/           # Sport Portals (subdomains)
│   │   │   ├── futsal/
│   │   │   ├── basketball/
│   │   │   └── renang/
│   │   └── api/               # API Routes
│   ├── components/
│   │   └── tournament/        # Tournament UI components
│   └── utils/
│       └── supabase/         # Supabase client configs
├── supabase/
│   ├── migrations/           # Database migrations
│   ├── seed.sql              # Main seed data
│   └── config.toml           # Supabase CLI config
└── middleware.ts             # Auth & role middleware
```

## URL Structure

| URL | Description |
|-----|-------------|
| `sfwinner.site` | WordPress (Hostinger) |
| `futsal.sfwinner.site` | Futsal Portal |
| `basketball.sfwinner.site` | Basketball Portal |
| `renang.sfwinner.site` | Swimming Portal |
| `app.sfwinner.site` | Team Manager Login |
| `app.sfwinner.site/dashboard` | Team Manager Dashboard |
| `app.sfwinner.site/admin/dashboard` | Super Admin Dashboard |
| `[sport].sfwinner.site/tournament/[slug]` | Tournament Detail |

## User Roles

| Role | Access |
|------|--------|
| `super_admin` | Full admin panel, manage all teams/sports |
| `coach` | Team Manager - manage own team (players, matches, etc.) |

## Database Schema

### Core Tables

- `users` - User accounts with role and team assignment
- `sports` - Sports (Futsal, Basketball, Swimming)
- `teams` - Teams per sport
- `players` - Players with team and age class
- `age_classes` - Age categories (U-8, U-10, U-12, U-14, U-16, U-18)
- `tournaments` - Tournament data
- `matches` - Match results
- `achievements` - Player achievements/awards

### Stats Tables

- `tournament_participants` - Teams registered in tournaments
- `player_tournament_stats` - Player goals, assists, cards per tournament

## Completed Features

### Authentication & Authorization
- [x] Login with role-based redirect (super_admin → /admin/dashboard, coach → /dashboard)
- [x] Middleware server-side role protection for /admin/* routes
- [x] Auto-create user record on Supabase Auth signup (trigger)

### Dashboard
- [x] Team Manager Dashboard - shows team stats, players, achievements
- [x] Super Admin Dashboard - shows all sports/teams overview
- [x] Mobile responsive slide-out sidebar

### Sport Portals
- [x] Futsal, Basketball, Swimming portals on subdomains
- [x] Teams listing per sport
- [x] Recent matches per sport
- [x] Tournament listing
- [x] Match filtering by sport (tournament.sport_id)

### Tournament Detail
- [x] Tournament info display
- [x] Matches tab - list of matches in tournament
- [x] Standings tab - calculated standings (needs participant data)
- [x] Stats tab - top scorer/assist with age class filter (needs stats data)

### Database
- [x] Schema with RLS policies
- [x] Seed data for testing
- [x] Migrations for team_id fix, age_class_id, auto-user trigger

## Data Still Needed

### Admin Input Required
- [ ] Add tournament participants (which teams in tournament)
- [ ] Add player tournament stats (goals, assists per player per tournament)
- [ ] Opponent teams in matches (currently team_away_id is NULL)

## TODO / Next Steps

### Priority 1 - Data Entry
- [ ] Admin CRUD for tournament_participants
- [ ] Admin CRUD for player_tournament_stats
- [ ] Add actual opponent teams to matches

### Priority 2 - Features
- [ ] Player detail page with full stats
- [ ] Team detail page
- [ ] Age class breakdown in standings
- [ ] Bracket visualization for knockout tournaments

### Priority 3 - Polish
- [ ] Team logo upload
- [ ] Player photo upload
- [ ] Match timeline/events
- [ ] Live score updates

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxx
```

## Setup Commands

```bash
# Install dependencies
npm install

# Push migrations to Supabase
supabase db push --linked --yes

# Push seed data
supabase db push --linked --include-seed --yes

# Reset database
supabase db reset --linked --include-seed --yes
```

## Deployment

1. Push to GitHub
2. Vercel auto-deploys from main branch
3. DNS: CNAME for subdomains to Vercel

## Credentials (Development)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | sfwinner189@gmail.com | (set via Supabase) |
| Coach Futsal | subaru@sfwinner.site | (set via Supabase) |
| Coach Basketball | basket@sfwinner.site | (set via Supabase) |
| Coach Renang | renang@sfwinner.site | (set via Supabase) |

---

Last Updated: 2026-05-19