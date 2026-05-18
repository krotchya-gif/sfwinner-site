import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Trophy, Calendar, Users, ArrowRight, ChevronRight } from 'lucide-react'

export default async function BasketballPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get basketball sport
  const { data: sport } = await supabase
    .from('sports')
    .select('*')
    .eq('slug', 'basketball')
    .single()

  // Get teams for basketball
  const { data: teams } = sport
    ? await supabase
        .from('teams')
        .select('id, name, logo_url, branch_location, slug')
        .eq('sport_id', sport.id)
        .limit(12)
    : { data: [] }

  // Get upcoming tournaments
  const { data: tournaments } = sport
    ? await supabase
        .from('tournaments')
        .select('*')
        .eq('sport_id', sport.id)
        .order('start_date', { ascending: true })
        .limit(5)
    : { data: [] }

  // Get recent matches
  const { data: recentMatches } = sport
    ? await supabase
        .from('matches')
        .select(`
          id, score_home, score_away, match_date, venue, status,
          team_home:teams!matches_team_home_id_fkey (name),
          team_away:teams!matches_team_away_id_fkey (name),
          tournament:tournaments (name, sport_id)
        `)
        .eq('tournament.sport_id', sport.id)
        .eq('status', 'completed')
        .order('match_date', { ascending: false })
        .limit(6)
    : { data: [] }

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">🏀 Basketball SF Winner</h1>
            <p className="text-gray-400 text-sm">Sports Club Indonesia</p>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="https://futsal.sfwinner.site" className="text-sm hover:text-primary transition">Futsal</Link>
            <Link href="https://renang.sfwinner.site" className="text-sm hover:text-primary transition">Renang</Link>
            {user ? (
              <Link href="https://app.sfwinner.site/dashboard" className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold transition">
                Team Manager
              </Link>
            ) : (
              <Link href="https://app.sfwinner.site/login" className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold transition">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4">
            Basketball Portal
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Tim Basketball SF Winner — latihan, bertanding, dan berkembang bersama
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="#teams" className="bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition flex items-center gap-2">
              Lihat Tim <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#tournaments" className="border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition flex items-center gap-2">
              Tournament <Calendar className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section id="teams" className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-dark font-heading flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-500" />
              Tim Basketball
            </h2>
            <span className="text-gray-500 text-sm">{teams?.length || 0} tim</span>
          </div>

          {teams && teams.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {teams.map((team: any) => (
                <Link
                  key={team.id}
                  href={`https://basketball.sfwinner.site/team/${team.slug}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-orange-500 transition group"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-3xl">🏀</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-dark text-center group-hover:text-orange-600 transition">
                    {team.name}
                  </h3>
                  {team.branch_location && (
                    <p className="text-sm text-gray-500 text-center mt-1">{team.branch_location}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">Belum ada tim basketball. Sport ini baru!</p>
              <p className="text-sm text-gray-400 mt-2">Hubungi admin untuk membuat tim pertama.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Matches */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-dark font-heading flex items-center gap-2 mb-8">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Hasil Pertandingan
          </h2>

          {recentMatches && recentMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMatches.map((match: any) => (
                <div key={match.id} className="bg-light rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {match.tournament?.name || 'Match'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      {match.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="font-semibold text-dark text-sm">{match.team_home?.name || 'Home'}</p>
                    </div>
                    <div className="px-4">
                      <span className="text-2xl font-bold text-orange-500">
                        {match.score_home} - {match.score_away}
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-semibold text-dark text-sm">{match.team_away?.name || 'Away'}</p>
                    </div>
                  </div>
                  {match.match_date && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      {new Date(match.match_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Belum ada hasil pertandingan.
            </div>
          )}
        </div>
      </section>

      {/* Tournaments */}
      <section id="tournaments" className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-dark font-heading flex items-center gap-2 mb-8">
            <Calendar className="w-6 h-6 text-orange-500" />
            Tournament
          </h2>

          {tournaments && tournaments.length > 0 ? (
            <div className="space-y-4">
              {tournaments.map((t: any) => (
                <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-dark">{t.name}</h3>
                    {t.location && (
                      <p className="text-sm text-gray-500 mt-1">{t.location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {t.start_date && (
                      <p className="text-sm text-gray-500">
                        {new Date(t.start_date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    )}
                    <Link
                      href={`https://basketball.sfwinner.site/tournament/${t.slug}`}
                      className="text-orange-500 text-sm hover:underline flex items-center gap-1 justify-end mt-1"
                    >
                      Detail <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Belum ada tournament.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 SF Winner Sports Club. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <Link href="https://futsal.sfwinner.site" className="text-sm hover:text-primary transition">Futsal</Link>
            <Link href="https://renang.sfwinner.site" className="text-sm hover:text-primary transition">Renang</Link>
            <Link href="https://basketball.sfwinner.site" className="text-sm hover:text-primary transition">Basketball</Link>
            <Link href="https://app.sfwinner.site" className="text-sm hover:text-primary transition">Team Manager</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}