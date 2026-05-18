import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, Users, ArrowLeft, Trophy } from 'lucide-react'
import TournamentContent from '@/components/tournament/TournamentContent'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Get tournament by slug
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tournament) {
    notFound()
  }

  // Get sport info
  const { data: sport } = tournament.sport_id
    ? await supabase
        .from('sports')
        .select('name, slug')
        .eq('id', tournament.sport_id)
        .single()
    : { data: null }

  // Get matches for this tournament
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, score_home, score_away, match_date, venue, status,
      team_home:teams!matches_team_home_id_fkey (id, name, slug, logo_url),
      team_away:teams!matches_team_away_id_fkey (id, name, slug, logo_url)
    `)
    .eq('tournament_id', tournament.id)
    .order('match_date', { ascending: true })

  const sportSlug = sport?.slug === 'renang' ? 'renang' : sport?.slug === 'basket' ? 'basketball' : 'futsal'

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-dark text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Link href={`https://${sportSlug}.sfwinner.site`} className="hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                {sport?.name || 'Sport'} Portal
              </Link>
            </div>
            <h1 className="text-2xl font-bold font-heading">{tournament.name}</h1>
            {sport && (
              <span className="text-xs px-2 py-1 bg-white/10 rounded mt-1 inline-block">
                {sport.name}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Tournament Info */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark font-heading mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Tournament Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.description && (
              <div className="md:col-span-2">
                <p className="text-gray-600">{tournament.description}</p>
              </div>
            )}

            {tournament.location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                  <p className="font-medium text-dark">{tournament.location}</p>
                </div>
              </div>
            )}

            {(tournament.start_date || tournament.end_date) && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="font-medium text-dark">
                    {tournament.start_date && new Date(tournament.start_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                    {tournament.end_date && ` — ${new Date(tournament.end_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Matches</p>
                <p className="font-medium text-dark">{matches?.length || 0} match{(matches?.length || 0) !== 1 ? 'es' : ''}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs: Matches, Standings, Stats */}
        <TournamentContent
          tournamentSlug={slug}
          sportSlug={sportSlug}
          initialMatches={matches || []}
        />
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 SF Winner Sports Club. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}