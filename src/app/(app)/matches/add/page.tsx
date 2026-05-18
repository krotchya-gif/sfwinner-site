'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, Plus, X, Save } from 'lucide-react'

interface Player {
  id: string
  display_name: string
  jersey_number: number | null
}

interface Tournament {
  id: string
  name: string
}

interface AgeClass {
  id: string
  name: string
}

export default function AddMatchPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [ageClasses, setAgeClasses] = useState<AgeClass[]>([])

  const [formData, setFormData] = useState({
    tournament_id: '',
    team_away_name: '',
    score_home: '',
    score_away: '',
    match_date: '',
    venue: '',
    status: 'completed',
    age_class_id: '',
  })

  const [playerStats, setPlayerStats] = useState<{ player_id: string; goals: number; assists: number; points: number; rebounds: number }[]>([])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get user's team
      const { data: userData } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single() as any

      if (!userData?.team_id) {
        setError('No team assigned. Please contact admin.')
        setLoading(false)
        return
      }

      // Get user's sport to filter tournaments
      const { data: team } = await supabase
        .from('teams')
        .select('sport_id, name')
        .eq('id', userData.team_id)
        .single() as any

      // Get tournaments for this sport
      if (team?.sport_id) {
        const { data: tourData } = await supabase
          .from('tournaments')
          .select('id, name')
          .eq('sport_id', team.sport_id)
          .order('name')

        setTournaments(tourData || [])
      }

      // Get players for this team
      const { data: playerData } = await supabase
        .from('players')
        .select('id, display_name, jersey_number')
        .eq('team_id', userData.team_id)
        .eq('status', 'active')
        .order('display_name')

      setPlayers(playerData || [])

      // Get age classes
      const { data: acData } = await supabase
        .from('age_classes')
        .select('id, name')
        .eq('team_id', userData.team_id)
        .order('name')

      setAgeClasses(acData || [])

      // Initialize player stats for all players
      if (playerData) {
        setPlayerStats(playerData.map(p => ({
          player_id: p.id,
          goals: 0,
          assists: 0,
          points: 0,
          rebounds: 0,
        })))
      }

      setLoading(false)
    }

    getData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.tournament_id || !formData.team_away_name || !formData.score_home || !formData.score_away) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's team
    const { data: userData } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single() as any

    if (!userData?.team_id) {
      setError('No team assigned.')
      setSaving(false)
      return
    }

    // Get sport_id from team
    const { data: team } = await supabase
      .from('teams')
      .select('sport_id')
      .eq('id', userData.team_id)
      .single() as any

    // Create match
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .insert({
        tournament_id: formData.tournament_id,
        team_home_id: userData.team_id,
        team_away_name: formData.team_away_name,
        score_home: parseInt(formData.score_home) || 0,
        score_away: parseInt(formData.score_away) || 0,
        match_date: formData.match_date || null,
        venue: formData.venue || null,
        status: formData.status,
        age_class_id: formData.age_class_id || null,
      })
      .select()
      .single()

    if (matchErr || !match) {
      setError('Failed to create match: ' + (matchErr?.message || 'Unknown error'))
      setSaving(false)
      return
    }

    // Insert player stats for players with non-zero stats
    const statsToInsert = playerStats.filter(ps =>
      ps.goals > 0 || ps.assists > 0 || ps.points > 0 || ps.rebounds > 0
    )

    if (statsToInsert.length > 0) {
      const { error: statsErr } = await supabase
        .from('player_matches')
        .insert(
          statsToInsert.map(ps => ({
            match_id: match.id,
            player_id: ps.player_id,
            goals: ps.goals,
            assists: ps.assists,
            points: ps.points,
            rebounds: ps.rebounds,
          }))
        )

      if (statsErr) {
        console.error('Failed to insert player stats:', statsErr)
      }
    }

    router.push('/matches')
    router.refresh()
  }

  const updatePlayerStat = (playerId: string, field: string, value: number) => {
    setPlayerStats(prev =>
      prev.map(ps =>
        ps.player_id === playerId
          ? { ...ps, [field]: value }
          : ps
      )
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/matches" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Add Match Result</h1>
          <p className="text-gray-500 mt-1">Record your team&apos;s match result</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tournament */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tournament *</label>
          <select
            value={formData.tournament_id}
            onChange={(e) => setFormData({ ...formData, tournament_id: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
          >
            <option value="">Select tournament...</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Opponent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opponent Team *</label>
          <input
            type="text"
            value={formData.team_away_name}
            onChange={(e) => setFormData({ ...formData, team_away_name: e.target.value })}
            placeholder="e.g. Victory FC"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            required
          />
        </div>

        {/* Score */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Our Score *</label>
            <input
              type="number"
              value={formData.score_home}
              onChange={(e) => setFormData({ ...formData, score_home: e.target.value })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opponent Score *</label>
            <input
              type="number"
              value={formData.score_away}
              onChange={(e) => setFormData({ ...formData, score_away: e.target.value })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              required
            />
          </div>
        </div>

        {/* Date + Venue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Match Date</label>
            <input
              type="datetime-local"
              value={formData.match_date}
              onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g. GOR Sawangan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Age Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age Class</label>
          <select
            value={formData.age_class_id}
            onChange={(e) => setFormData({ ...formData, age_class_id: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="">All Ages</option>
            {ageClasses.map(ac => (
              <option key={ac.id} value={ac.id}>{ac.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Match Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Player Stats */}
        {players.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player Statistics (optional)
            </label>
            <div className="space-y-2">
              {players.map(player => {
                const stat = playerStats.find(ps => ps.player_id === player.id) || {
                  player_id: player.id, goals: 0, assists: 0, points: 0, rebounds: 0
                }
                return (
                  <div key={player.id} className="flex items-center gap-3 p-3 bg-light rounded-lg">
                    <span className="w-32 text-sm font-medium text-dark">
                      {player.display_name}
                      {player.jersey_number && ` #${player.jersey_number}`}
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        placeholder="Goals"
                        value={stat.goals || ''}
                        onChange={(e) => updatePlayerStat(player.id, 'goals', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Assist"
                        value={stat.assists || ''}
                        onChange={(e) => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Pts"
                        value={stat.points || ''}
                        onChange={(e) => updatePlayerStat(player.id, 'points', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Reb"
                        value={stat.rebounds || ''}
                        onChange={(e) => updatePlayerStat(player.id, 'rebounds', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">Goals/Assists for Futsal, Points/Rebounds for Basketball</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Link
            href="/matches"
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
            {saving ? 'Saving...' : 'Save Match'}
          </button>
        </div>
      </form>
    </div>
  )
}