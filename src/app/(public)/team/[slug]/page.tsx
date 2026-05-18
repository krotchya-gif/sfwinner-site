import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Award, Users, Calendar, Trophy, MapPin } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TeamPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Get team by slug
  const { data: team } = await supabase
    .from('teams')
    .select(`
      id, name, slug, logo_url, branch_location,
      sport:sports (id, name, slug)
    `)
    .eq('slug', slug)
    .single()

  if (!team) notFound()

  // Get players (public fields only)
  const { data: players } = await supabase
    .from('players')
    .select('id, display_name, photo_url, jersey_number, position, status')
    .eq('team_id', team.id)
    .eq('status', 'active')
    .order('display_name')

  // Get achievements
  const playerIds = players?.map(p => p.id) || []
  let achievements: any[] = []
  if (playerIds.length > 0) {
    const { data: achData } = await supabase
      .from('achievements')
      .select('id, award, tournament_name, date')
      .in('player_id', playerIds)
      .order('date', { ascending: false })
      .limit(10)

    achievements = achData || []
  }

  // Get recent matches
  const { data: recentMatches } = await supabase
    .from('matches')
    .select(`
      id, score_home, score_away, match_date, venue, status,
      team_home:teams!matches_team_home_id_fkey (name),
      team_away:teams!matches_team_away_id_fkey (name),
      tournament:tournaments (name)
    `)
    .or(`team_home_id.eq.${team.id},team_away_id.eq.${team.id}`)
    .eq('status', 'completed')
    .order('match_date', { ascending: false })
    .limit(5)

  const sportSlug = (team.sport as any)?.slug
  const sportColor = sportSlug === 'basket' ? 'orange'
    : sportSlug === 'renang' ? 'cyan' : 'primary'
  const sportName = sportSlug === 'basket' ? 'Basketball'
    : sportSlug === 'renang' ? 'Renang' : 'Futsal'

  const getScoreDisplay = (match: any) => {
    const isHome = match.team_home_id === team.id
    return isHome
      ? `${match.score_home} - ${match.score_away}`
      : `${match.score_away} - ${match.score_home}`
  }

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-dark text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/${sportSlug}`}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 bg-${sportColor}/20 rounded-xl flex items-center justify-center`}>
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-3xl">{sportSlug === 'basket' ? '🏀' : sportSlug === 'renang' ? '🏊' : '⚽'}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading">{team.name}</h1>
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  {sportName} • {team.branch_location}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="https://app.sfwinner.site/login"
            className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Team Manager Login
          </Link>
        </div>
      </header>

      {/* Players */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-dark font-heading flex items-center gap-2">
              <Users className={`w-6 h-6 text-${sportColor}-500`} />
              Players
            </h2>
            <span className="text-gray-500 text-sm">{players?.length || 0} active</span>
          </div>

          {players && players.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {players.map((player) => (
                <div key={player.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-light overflow-hidden">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <span className="text-2xl font-bold text-primary">
                          {player.display_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-dark text-sm">{player.display_name}</p>
                  {player.position && (
                    <p className="text-xs text-gray-500 mt-1">{player.position}</p>
                  )}
                  {player.jersey_number && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      #{player.jersey_number}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">No active players yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-dark font-heading flex items-center gap-2 mb-8">
              <Award className="w-6 h-6 text-yellow-500" />
              Achievements
            </h2>

            <div className="space-y-3">
              {achievements.map((ach) => (
                <div key={ach.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-dark">{ach.award || 'Achievement'}</p>
                      <p className="text-sm text-gray-500">{ach.tournament_name}</p>
                    </div>
                  </div>
                  {ach.date && (
                    <span className="text-sm text-gray-400">
                      {new Date(ach.date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Matches */}
      {recentMatches && recentMatches.length > 0 && (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-dark font-heading flex items-center gap-2 mb-8">
              <Calendar className="w-6 h-6 text-primary" />
              Recent Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMatches.map((match: any) => (
                <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
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
                      <span className={`text-2xl font-bold text-${sportColor}-500`}>
                        {getScoreDisplay(match)}
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-semibold text-dark text-sm">{match.team_away?.name || 'Away'}</p>
                    </div>
                  </div>
                  {match.match_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-3 justify-center">
                      <Calendar className="w-3 h-3" />
                      {new Date(match.match_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  )}
                  {match.venue && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 justify-center">
                      <MapPin className="w-3 h-3" />
                      {match.venue}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-dark text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 SF Winner Sports Club
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="https://futsal.sfwinner.site" className="text-sm hover:text-primary transition">Futsal</Link>
            <Link href="https://renang.sfwinner.site" className="text-sm hover:text-primary transition">Renang</Link>
            <Link href="https://basketball.sfwinner.site" className="text-sm hover:text-primary transition">Basketball</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}