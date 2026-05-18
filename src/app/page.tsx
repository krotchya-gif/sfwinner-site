import { redirect, notFound } from 'next/navigation'
import FutsalPortalPage from './(sport)/futsal/page'
import BasketballPortalPage from './(sport)/basketball/page'
import RenangPortalPage from './(sport)/renang/page'
import type { headers } from 'next/headers'

// Dynamic subdomain routing
// Subdomains:
// - futsal.sfwinner.site   → Futsal portal
// - basketball.sfwinner.site → Basketball portal
// - renang.sfwinner.site    → Swimming portal
// - app.sfwinner.site       → Team Manager Panel (handled separately via middleware)

const SUBDOMAIN_MAP: Record<string, 'futsal' | 'basketball' | 'renang'> = {
  'futsal': 'futsal',
  'basketball': 'basketball',
  'renang': 'renang',
}

export default async function RootPage() {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''

  // Extract subdomain
  const parts = hostname.split('.')
  const subdomain = parts.length > 2 ? parts[0] : null

  // If no subdomain or unknown subdomain, show default (futsal)
  if (!subdomain || subdomain === 'app' || subdomain === 'www') {
    // Redirect app subdomain to login, otherwise show futsal
    if (subdomain === 'app') {
      redirect('/login')
    }
    return <FutsalPortalPage />
  }

  // Route to appropriate sport portal
  const sport = SUBDOMAIN_MAP[subdomain]
  if (!sport) {
    return <FutsalPortalPage />
  }

  switch (sport) {
    case 'futsal':
      return <FutsalPortalPage />
    case 'basketball':
      return <BasketballPortalPage />
    case 'renang':
      return <RenangPortalPage />
    default:
      return <FutsalPortalPage />
  }
}