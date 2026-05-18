'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Users, Flag, Trophy, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Sport {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

interface TeamCount {
  sport_id: string
  count: number
}

interface PlayerCount {
  sport_id: string
  count: number
}

export default function AdminDashboardPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [teamsBySport, setTeamsBySport] = useState<Record<string, any[]>>({})
  const [counts, setCounts] = useState<{teams: number, players: number, tournaments: number, matches: number}>({teams: 0, players: 0, tournaments: 0, matches: 0})
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      // Get all sports
      const { data: sportsData } = await supabase.from('sports').select('*').order('name')
      setSports(sportsData || [])

      // Get teams grouped by sport
      const { data: allTeams } = await supabase
        .from('teams')
        .select('id, name, slug, logo_url, branch_location, sport_id, created_at')
        .order('name')

      const grouped: Record<string, any[]> = {}
      sportsData?.forEach(s => { grouped[s.id] = [] })
      allTeams?.forEach(t => {
        if (grouped[t.sport_id]) grouped[t.sport_id].push(t)
      })
      setTeamsBySport(grouped)

      // Counts
      const [{ count: teamsCount }, { count: playersCount }, { count: tournamentsCount }, { count: matchesCount }] = await Promise.all([
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('tournaments').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
      ])

      setCounts({
        teams: teamsCount || 0,
        players: playersCount || 0,
        tournaments: tournamentsCount || 0,
        matches: matchesCount || 0,
      })

      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark font-heading">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview semua data di SF Winner</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Teams', value: counts.teams, icon: Flag, color: 'text-primary' },
          { label: 'Total Players', value: counts.players, icon: Users, color: 'text-blue-500' },
          { label: 'Tournaments', value: counts.tournaments, icon: Trophy, color: 'text-yellow-500' },
          { label: 'Matches', value: counts.matches, icon: Calendar, color: 'text-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-dark">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Teams by sport */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark font-heading flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Teams by Sport
          </h2>
          <Link href="/admin/teams" className="text-sm text-primary hover:underline">
            Manage Teams →
          </Link>
        </div>

        <div className="space-y-6">
          {sports.map((sport) => {
            const teams = teamsBySport[sport.id] || []
            const sportColor = sport.slug === 'basket' ? 'orange'
              : sport.slug === 'renang' ? 'cyan'
              : 'primary'
            const sportBg = sport.slug === 'basket' ? 'bg-orange-500'
              : sport.slug === 'renang' ? 'bg-cyan-500'
              : 'bg-primary'
            const sportText = sport.slug === 'basket' ? 'text-orange-500'
              : sport.slug === 'renang' ? 'text-cyan-500'
              : 'text-primary'
            const sportBorder = sport.slug === 'basket' ? 'border-orange-200'
              : sport.slug === 'renang' ? 'border-cyan-200'
              : 'border-primary/20'

            return (
              <div key={sport.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`${sportBg} text-white px-6 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    {sport.logo_url ? (
                      <img src={sport.logo_url} alt={sport.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-2xl">
                        {sport.slug === 'futsal' ? '⚽' : sport.slug === 'renang' ? '🏊' : '🏀'}
                      </span>
                    )}
                    <div>
                      <h3 className="font-bold font-heading">{sport.name}</h3>
                      <p className="text-xs text-white/70">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/teams?sport=${sport.slug}`}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
                  >
                    View All
                  </Link>
                </div>

                {teams.length > 0 ? (
                  <div className="divide-y">
                    {teams.slice(0, 5).map((team: any) => (
                      <div key={team.id} className="px-6 py-4 flex items-center justify-between hover:bg-light transition">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100`}>
                            {team.logo_url ? (
                              <img src={team.logo_url} alt={team.name} className="w-7 h-7 object-contain" />
                            ) : (
                              <Flag className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-dark">{team.name}</p>
                            {team.branch_location && (
                              <p className="text-xs text-gray-500">{team.branch_location}</p>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/admin/teams?team=${team.slug}`}
                          className={`text-sm ${sportText} hover:underline`}
                        >
                          Manage →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No teams yet for {sport.name}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}