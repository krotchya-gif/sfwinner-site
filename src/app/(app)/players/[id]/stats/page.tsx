'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, Trophy, Calendar, TrendingUp } from 'lucide-react'

interface PlayerStat {
  goals: number
  assists: number
  points: number
  rebounds: number
  minutes_played: number | null
  rating: number | null
  match_id: string
  match_date: string | null
  tournament_name: string | null
  team_name: string | null
  opponent_name: string | null
}

interface Player {
  id: string
  display_name: string
  photo_url: string | null
  jersey_number: number | null
  position: string | null
  status: string
  team: { id: string; name: string; slug: string } | null
  age_class: { name: string } | null
}

export default function PlayerStatsPage() {
  const params = useParams()
  const playerId = params.id as string

  const [player, setPlayer] = useState<Player | null>(null)
  const [stats, setStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get player data
        const { data: playerData } = await supabase
          .from('players')
          .select(`
            id, display_name, photo_url, jersey_number, position, status,
            team: teams(id, name, slug),
            age_class: age_classes(name)
          `)
          .eq('id', playerId)
          .single() as any

        if (!playerData) {
          setLoading(false)
          return
        }

        setPlayer(playerData)

        // Get player match stats
        const { data: statsData } = await supabase
          .from('player_matches')
          .select(`
            goals, assists, points, rebounds, minutes_played, rating,
            match:matches(id, match_date, tournament: tournaments(name), team_home: teams!team_home_id_fkey(name), team_away: teams!team_away_id_fkey(name))
          `)
          .eq('player_id', playerId)
          .order('match:matches.match_date', { ascending: false })

        const formattedStats: PlayerStat[] = (statsData || []).map((s: any) => {
          const match = s.match
          const isHome = match?.team_home?.name === playerData.team?.name
          const opponent = isHome ? match?.team_away?.name : match?.team_home?.name

          return {
            goals: s.goals || 0,
            assists: s.assists || 0,
            points: s.points || 0,
            rebounds: s.rebounds || 0,
            minutes_played: s.minutes_played,
            rating: s.rating,
            match_id: match?.id,
            match_date: match?.match_date,
            tournament_name: match?.tournament?.name,
            team_name: playerData.team?.name,
            opponent_name: opponent
          }
        })

        setStats(formattedStats)
      } catch (err) {
        console.error('Error fetching player stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [playerId])

  // Calculate totals
  const totals = stats.reduce((acc, s) => ({
    goals: acc.goals + (s.goals || 0),
    assists: acc.assists + (s.assists || 0),
    points: acc.points + (s.points || 0),
    rebounds: acc.rebounds + (s.rebounds || 0),
    games: acc.games + 1,
    totalMinutes: acc.totalMinutes + (s.minutes_played || 0),
    totalRating: acc.totalRating + (s.rating || 0)
  }), { goals: 0, assists: 0, points: 0, rebounds: 0, games: 0, totalMinutes: 0, totalRating: 0 })

  const avgRating = totals.games > 0 ? (totals.totalRating / totals.games).toFixed(1) : '-'
  const avgMinutes = totals.games > 0 ? (totals.totalMinutes / totals.games).toFixed(1) : '-'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Player not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/players/${playerId}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Player Statistics</h1>
          <p className="text-gray-500 mt-1">{player.display_name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Goals</p>
              <p className="text-2xl font-bold text-dark">{totals.goals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-600/10">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Assists</p>
              <p className="text-2xl font-bold text-dark">{totals.assists}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-600/10">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Games</p>
              <p className="text-2xl font-bold text-dark">{totals.games}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-600/10">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-dark">{avgRating}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-dark font-heading mb-4">Match History</h2>

        {stats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No match statistics available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Match</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Goals</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Assists</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Points</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rebounds</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Minutes</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark">{stat.tournament_name || 'Friendly'}</p>
                      <p className="text-sm text-gray-500">
                        {stat.team_name} vs {stat.opponent_name || 'TBD'}
                      </p>
                      {stat.match_date && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(stat.match_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-dark">{stat.goals}</td>
                    <td className="px-4 py-3 text-center font-medium text-dark">{stat.assists}</td>
                    <td className="px-4 py-3 text-center font-medium text-dark">{stat.points}</td>
                    <td className="px-4 py-3 text-center font-medium text-dark">{stat.rebounds}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{stat.minutes_played?.toFixed(1) || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {stat.rating ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          stat.rating >= 8 ? 'bg-green-100 text-green-700' :
                          stat.rating >= 6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {stat.rating.toFixed(1)}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-light font-semibold">
                <tr>
                  <td className="px-4 py-3 text-dark">Total ({totals.games} games)</td>
                  <td className="px-4 py-3 text-center text-dark">{totals.goals}</td>
                  <td className="px-4 py-3 text-center text-dark">{totals.assists}</td>
                  <td className="px-4 py-3 text-center text-dark">{totals.points}</td>
                  <td className="px-4 py-3 text-center text-dark">{totals.rebounds}</td>
                  <td className="px-4 py-3 text-center text-dark">{avgMinutes}</td>
                  <td className="px-4 py-3 text-center text-dark">{avgRating}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}