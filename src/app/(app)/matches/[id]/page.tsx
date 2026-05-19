'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, Edit, Trash2, Calendar, MapPin, Trophy, Users } from 'lucide-react'
import MatchTimeline from '@/components/match/MatchTimeline'

interface PlayerStat {
  id: string
  goals: number
  assists: number
  points: number
  rebounds: number
  minutes_played: number | null
  rating: number | null
  player: {
    id: string
    display_name: string
    jersey_number: number | null
    photo_url: string | null
  }
}

interface Match {
  id: string
  match_date: string | null
  venue: string | null
  status: string
  score_home: number
  score_away: number
  age_class_id: string | null
  age_class: { name: string } | null
  tournament: { id: string; name: string; slug: string; sport_id: string }
  team_home: { id: string; name: string; slug: string; logo_url: string | null }
  team_away: { id: string; name: string; slug: string; logo_url: string | null } | null
  player_stats: PlayerStat[]
}

interface Player {
  id: string
  display_name: string
  jersey_number: number | null
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [match, setMatch] = useState<Match | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`)
        const data = await res.json()

        if (data.error || !data.data) {
          router.push('/matches')
          return
        }

        setMatch(data.data)
      } catch (err) {
        console.error('Error fetching match:', err)
        router.push('/matches')
      } finally {
        setLoading(false)
      }
    }

    fetchMatch()
  }, [matchId, router])

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      if (!match?.team_home?.id) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single() as any

      if (userData?.team_id) {
        const { data: players } = await supabase
          .from('players')
          .select('id, display_name, jersey_number')
          .eq('team_id', userData.team_id)
          .eq('status', 'active')
          .order('display_name')

        setTeamPlayers(players || [])
      }
    }
    fetchTeamPlayers()
  }, [match, supabase])

  const handleDelete = async () => {
    if (!match) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.error) {
        alert('Failed to delete: ' + data.error)
        setDeleting(false)
        return
      }

      router.push('/matches')
      router.refresh()
    } catch (err) {
      console.error('Error deleting match:', err)
      setDeleting(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'scheduled': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'postponed': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSportIcon = (sportId: string) => {
    if (sportId === '22222222-2222-2222-2222-222222222222') return '🏀'
    if (sportId === '33333333-3333-3333-3333-333333333333') return '🏊'
    return '⚽'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/matches" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getSportIcon(match.tournament.sport_id)}</span>
            <h1 className="text-2xl font-bold text-dark font-heading">{match.tournament.name}</h1>
          </div>
          <p className="text-gray-500 mt-1">Match Detail</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/matches/${matchId}/stats`}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <Edit className="w-4 h-4" />
            Edit Stats
          </Link>
          <Link
            href={`/matches/${matchId}/lineup`}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <Users className="w-4 h-4" />
            Lineup
          </Link>
          <Link
            href={`/matches/${matchId}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Match Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(match.status)}`}>
            {match.status}
          </span>
          {match.age_class && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {match.age_class.name}
            </span>
          )}
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-8 py-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              {match.team_home?.logo_url ? (
                <img src={match.team_home.logo_url} alt={match.team_home.name} className="w-14 h-14 object-contain" />
              ) : (
                <span className="text-3xl">🏠</span>
              )}
            </div>
            <p className="font-semibold text-dark">{match.team_home?.name || 'Home'}</p>
          </div>

          <div className="text-center">
            <div className="bg-light rounded-xl px-8 py-4">
              <span className="text-4xl font-bold text-dark">
                {match.score_home} - {match.score_away}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Final Score</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              {match.team_away?.logo_url ? (
                <img src={match.team_away.logo_url} alt={match.team_away?.name} className="w-14 h-14 object-contain" />
              ) : (
                <span className="text-3xl">👥</span>
              )}
            </div>
            <p className="font-semibold text-dark">{match.team_away?.name || 'Away'}</p>
          </div>
        </div>

        {/* Match Details */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t">
          {match.match_date && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Date</p>
                <p className="font-medium text-dark">
                  {new Date(match.match_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}

          {match.venue && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Venue</p>
                <p className="font-medium text-dark">{match.venue}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Tournament</p>
              <p className="font-medium text-dark">{match.tournament.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Timeline */}
      {match.status === 'completed' && teamPlayers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <MatchTimeline matchId={matchId} teamPlayers={teamPlayers} />
        </div>
      )}

      {/* Player Stats */}
      {match.player_stats && match.player_stats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark font-heading mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Player Statistics
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Player</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Goals</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Assists</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Points</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rebounds</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Minutes</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {match.player_stats.map((stat) => (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden">
                          {stat.player.photo_url ? (
                            <img src={stat.player.photo_url} alt={stat.player.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                              {stat.player.display_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-dark">{stat.player.display_name}</p>
                          {stat.player.jersey_number && (
                            <p className="text-xs text-gray-400">#{stat.player.jersey_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-dark">{stat.goals || 0}</td>
                    <td className="px-4 py-3 text-center font-medium text-dark">{stat.assists || 0}</td>
                    <td className="px-4 py-3 text-center font-medium text-dark">{stat.points || 0}</td>
                    <td className="px-4 py-3 text-center font-medium text-dark">{stat.rebounds || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{stat.minutes_played || '-'}</td>
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
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-dark mb-2">Delete Match?</h2>
            <p className="text-gray-500 mb-6">This action cannot be undone. All player stats will also be deleted.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}