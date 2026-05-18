import { redirect } from 'next/navigation'

// Pure redirect to default sport portal
// Subdomains per sport:
// - futsal.sfwinner.site  → Futsal portal
// - basketball.sfwinner.site → Basketball portal
// - renang.sfwinner.site   → Swimming portal
// - app.sfwinner.site     → Team Manager Panel

const DEFAULT_SPORT = 'futsal'

export default function RootPage() {
  redirect(`https://${DEFAULT_SPORT}.sfwinner.site`)
}