import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Award, Calendar, Users, TrendingUp } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicPlayerPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get player with team and sport info
  const { data: player } = await supabase
    .from('players')
    .select(`
      id, display_name, photo_url, jersey_number, position, status,
      age_class:age_classes(name),
      team:teams(id, name, slug, sport_id, sports: sports(name, slug))
    `)
    .eq('id', id)
    .single()

  if (!player) notFound()

  const playerData = player as any
  const team = playerData.team as any
  const sport = team?.sports as any
  const sportSlug = sport?.slug === 'basket' ? 'basketball' : sport?.slug === 'renang' ? 'renang' : 'futsal'

  // Get achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('id, award, tournament_name, date')
    .eq('player_id', id)
    .order('date', { ascending: false })
    .limit(10)

  // Get career stats
  const { data: matchStats } = await supabase
    .from('player_matches')
    .select('goals, assists, points, rebounds')
    .eq('player_id', id)

  const totals = matchStats?.reduce((acc: any, stat: any) => ({
    goals: (acc.goals || 0) + (stat.goals || 0),
    assists: (acc.assists || 0) + (stat.assists || 0),
    points: (acc.points || 0) + (stat.points || 0),
    rebounds: (acc.rebounds || 0) + (stat.rebounds || 0),
    matches_played: (acc.matches_played || 0) + 1
  }), { goals: 0, assists: 0, points: 0, rebounds: 0, matches_played: 0 }) || { goals: 0, assists: 0, points: 0, rebounds: 0, matches_played: 0 }

  const statusStyles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    promoted: 'bg-blue-100 text-blue-700',
    graduated: 'bg-gray-100 text-gray-600',
    inactive: 'bg-red-100 text-red-700',
  }

  const getSportEmoji = (slug: string) => {
    if (slug === 'basket') return '🏀'
    if (slug === 'renang') return '🏊'
    return '⚽'
  }

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-dark text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`https://${sportSlug}.sfwinner.site`}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                {playerData.photo_url ? (
                  <img src={playerData.photo_url} alt={playerData.display_name} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <span className="text-3xl">{getSportEmoji(sport?.slug)}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading">{playerData.display_name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  <span>{team?.name}</span>
                  {playerData.age_class && (
                    <>
                      <span>•</span>
                      <span>{playerData.age_class.name}</span>
                    </>
                  )}
                  {playerData.position && (
                    <>
                      <span>•</span>
                      <span>{playerData.position}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Jersey + Status */}
        <div className="flex flex-wrap items-center gap-4">
          {playerData.jersey_number && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 text-center">
              <p className="text-sm text-gray-500">Jersey</p>
              <p className="text-3xl font-bold text-primary">#{playerData.jersey_number}</p>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 text-center">
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusStyles[playerData.status] || statusStyles.active}`}>
              {playerData.status || 'active'}
            </span>
          </div>
          {totals.matches_played > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 text-center">
              <p className="text-sm text-gray-500">Matches</p>
              <p className="text-2xl font-bold text-dark">{totals.matches_played}</p>
            </div>
          )}
        </div>

        {/* Career Stats */}
        {totals.matches_played > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-dark font-heading mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Career Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-light rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{totals.goals}</p>
                <p className="text-sm text-gray-500">Goals</p>
              </div>
              <div className="bg-light rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{totals.assists}</p>
                <p className="text-sm text-gray-500">Assists</p>
              </div>
              <div className="bg-light rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-500">{totals.points}</p>
                <p className="text-sm text-gray-500">Points</p>
              </div>
              <div className="bg-light rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{totals.rebounds}</p>
                <p className="text-sm text-gray-500">Rebounds</p>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark font-heading mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Achievements
          </h2>

          {achievements && achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.map((ach) => (
                <div key={ach.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-dark">{ach.award || 'Achievement'}</p>
                      <p className="text-sm text-gray-500">{ach.tournament_name}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {ach.date
                      ? new Date(ach.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No achievements yet.</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 SF Winner Sports Club
          </p>
        </div>
      </footer>
    </div>
  )
}