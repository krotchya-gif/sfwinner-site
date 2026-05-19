'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, Save, User, X, Users } from 'lucide-react'

interface LineupEntry {
  id: string
  position: number
  is_starter: boolean
  player: {
    id: string
    display_name: string
    jersey_number: number | null
    photo_url: string | null
  }
}

interface Player {
  id: string
  display_name: string
  jersey_number: number | null
  photo_url: string | null
}

interface Match {
  id: string
  tournament: { name: string }
  team_home: { id: string; name: string }
  team_away: { id: string; name: string } | null
}

export default function MatchLineupPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [lineup, setLineup] = useState<LineupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())

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

        setMatch(data.data)

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

        // Get existing lineup
        const lineupRes = await fetch(`/api/lineup?match_id=${matchId}`)
        const lineupData = await lineupRes.json()
        const existingLineup = lineupData.data || []

        setLineup(existingLineup)
        setSelectedPlayers(new Set(existingLineup.map((l: LineupEntry) => l.player.id)))
      } catch (err) {
        console.error('Error fetching data:', err)
        router.push('/matches')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [matchId, router])

  const handleTogglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayers)
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId)
    } else {
      newSelected.add(playerId)
    }
    setSelectedPlayers(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Clear existing lineup
      for (const entry of lineup) {
        await fetch(`/api/lineup?id=${entry.id}`, { method: 'DELETE' })
      }

      // Add selected players
      for (let i = 0; i < Array.from(selectedPlayers).length; i++) {
        const playerId = Array.from(selectedPlayers)[i]
        await fetch('/api/lineup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            match_id: matchId,
            player_id: playerId,
            position: i,
            is_starter: true
          })
        })
      }

      router.push(`/matches/${matchId}`)
      router.refresh()
    } catch (err) {
      console.error('Error saving lineup:', err)
      setSaving(false)
    }
  }

  const starters = lineup.filter(l => l.is_starter)
  const bench = lineup.filter(l => !l.is_starter)

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark font-heading">Set Lineup</h1>
          <p className="text-gray-500 mt-1">{match.tournament?.name} - {match.team_home?.name} vs {match.team_away?.name || 'TBD'}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Lineup'}
        </button>
      </div>

      {/* Current Lineup */}
      {lineup.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark font-heading mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Current Lineup ({lineup.length} players)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {lineup.map((entry, idx) => (
              <div key={entry.id} className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {entry.position + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark text-sm truncate">{entry.player.display_name}</p>
                  {entry.player.jersey_number && (
                    <p className="text-xs text-gray-400">#{entry.player.jersey_number}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Players */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-dark font-heading mb-4">
          Select Players ({selectedPlayers.size} selected)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.map(player => {
            const isSelected = selectedPlayers.has(player.id)
            return (
              <button
                key={player.id}
                onClick={() => handleTogglePlayer(player.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary">
                      {player.display_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : 'text-dark'}`}>
                    {player.display_name}
                  </p>
                  {player.jersey_number && (
                    <p className="text-xs text-gray-400">#{player.jersey_number}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {players.length === 0 && (
          <p className="text-center text-gray-500 py-8">No players available for your team.</p>
        )}
      </div>
    </div>
  )
}