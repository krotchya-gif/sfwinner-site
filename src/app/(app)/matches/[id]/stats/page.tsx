'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, Save, Plus, X } from 'lucide-react'

interface Player {
  id: string
  display_name: string
  jersey_number: number | null
  photo_url: string | null
}

interface PlayerStat {
  id: string
  player_id: string
  goals: number
  assists: number
  points: number
  rebounds: number
  minutes_played: number | null
  rating: number | null
}

interface Match {
  id: string
  match_date: string | null
  venue: string | null
  status: string
  score_home: number
  score_away: number
  tournament: { id: string; name: string }
  team_home: { id: string; name: string }
  team_away: { id: string; name: string } | null
}

interface StatEntry {
  player_id: string
  goals: number
  assists: number
  points: number
  rebounds: number
  minutes_played: number | null
  rating: number | null
}

export default function EditMatchStatsPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [existingStats, setExistingStats] = useState<Record<string, PlayerStat>>({})
  const [stats, setStats] = useState<Record<string, StatEntry>>({})

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get match data
        const res = await fetch(`/api/matches/${matchId}`)
        const data = await res.json()

        if (data.error || !data.data) {
          router.push('/matches')
          return
        }

        const matchData = data.data
        setMatch(matchData)

        // Get user's team players
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('team_id')
            .eq('id', user.id)
            .single() as any

          if (userData?.team_id) {
            const { data: playersData } = await supabase
              .from('players')
              .select('id, display_name, jersey_number, photo_url')
              .eq('team_id', userData.team_id)
              .eq('status', 'active')
              .order('display_name')

            setPlayers(playersData || [])
          }
        }

        // Get existing player stats
        const existing: Record<string, PlayerStat> = {}
        matchData.player_stats?.forEach((stat: PlayerStat) => {
          existing[stat.player_id] = stat
          setStats(prev => ({
            ...prev,
            [stat.player_id]: {
              player_id: stat.player_id,
              goals: stat.goals || 0,
              assists: stat.assists || 0,
              points: stat.points || 0,
              rebounds: stat.rebounds || 0,
              minutes_played: stat.minutes_played,
              rating: stat.rating,
            }
          }))
        })
        setExistingStats(existing)
      } catch (err) {
        console.error('Error fetching match:', err)
        router.push('/matches')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [matchId, router])

  const handleStatChange = (playerId: string, field: keyof StatEntry, value: any) => {
    setStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value === '' || value === null ? null : (field === 'minutes_played' || field === 'rating' ? (value === '' ? null : parseFloat(value)) : parseInt(value) || 0)
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    setError('')

    try {
      const playerStats = Object.values(stats).filter(s => s.player_id)

      const res = await fetch(`/api/matches/${matchId}/player-stats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_stats: playerStats })
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setSaving(false)
        return
      }

      router.push(`/matches/${matchId}`)
      router.refresh()
    } catch (err) {
      console.error('Error saving stats:', err)
      setError('Failed to save player stats')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Match not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/matches/${matchId}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Edit Player Stats</h1>
          <p className="text-gray-500 mt-1">{match.tournament?.name} - {match.team_home?.name} vs {match.team_away?.name || 'TBD'}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Player Stats */}
        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No players found for your team.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase px-2">
              <div className="col-span-4">Player</div>
              <div className="col-span-1 text-center">Goals</div>
              <div className="col-span-1 text-center">Assists</div>
              <div className="col-span-1 text-center">Points</div>
              <div className="col-span-1 text-center">Rebounds</div>
              <div className="col-span-2 text-center">Minutes</div>
              <div className="col-span-2 text-center">Rating</div>
            </div>

            {players.map(player => {
              const stat = stats[player.id] || { player_id: player.id, goals: 0, assists: 0, points: 0, rebounds: 0, minutes_played: null, rating: null }
              const hasExisting = !!existingStats[player.id]

              return (
                <div key={player.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg border ${hasExisting ? 'border-primary/30 bg-primary/5' : 'border-gray-100'}`}>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                          {player.display_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-dark truncate">{player.display_name}</p>
                      {player.jersey_number && (
                        <p className="text-xs text-gray-400">#{player.jersey_number}</p>
                      )}
                    </div>
                    {hasExisting && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Editing</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={stat.goals || ''}
                      onChange={(e) => handleStatChange(player.id, 'goals', e.target.value)}
                      min="0"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={stat.assists || ''}
                      onChange={(e) => handleStatChange(player.id, 'assists', e.target.value)}
                      min="0"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={stat.points || ''}
                      onChange={(e) => handleStatChange(player.id, 'points', e.target.value)}
                      min="0"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={stat.rebounds || ''}
                      onChange={(e) => handleStatChange(player.id, 'rebounds', e.target.value)}
                      min="0"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={stat.minutes_played ?? ''}
                      onChange={(e) => handleStatChange(player.id, 'minutes_played', e.target.value)}
                      min="0"
                      step="0.1"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={stat.rating ?? ''}
                      onChange={(e) => handleStatChange(player.id, 'rating', e.target.value)}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="0-10"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Link
            href={`/matches/${matchId}`}
            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Stats'}
          </button>
        </div>
      </form>
    </div>
  )
}