'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Loader2, X, AlertCircle } from 'lucide-react'

interface Player {
  id: string
  display_name: string
  jersey_number: number | null
}

interface MatchEvent {
  id: string
  event_type: string
  minute: number | null
  description: string | null
  player: {
    id: string
    display_name: string
    jersey_number: number | null
    photo_url: string | null
  }
}

interface MatchTimelineProps {
  matchId: string
  teamPlayers: Player[]
  initialEvents?: MatchEvent[]
}

const EVENT_TYPES = [
  { value: 'goal', label: 'Goal', icon: '⚽', color: 'green' },
  { value: 'yellow_card', label: 'Yellow Card', icon: '🟨', color: 'yellow' },
  { value: 'red_card', label: 'Red Card', icon: '🟥', color: 'red' },
  { value: 'substitution_in', label: 'Substitution In', icon: '🔵', color: 'blue' },
  { value: 'substitution_out', label: 'Substitution Out', icon: '🔴', color: 'orange' },
  { value: 'penalty', label: 'Penalty', icon: '🎯', color: 'purple' },
  { value: 'own_goal', label: 'Own Goal', icon: '🤕', color: 'gray' },
]

export default function MatchTimeline({ matchId, teamPlayers, initialEvents = [] }: MatchTimelineProps) {
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    player_id: '',
    event_type: 'goal',
    minute: '',
    description: '',
  })

  const supabase = createClient()

  useEffect(() => {
    const fetchEvents = async () => {
      if (initialEvents.length > 0) return
      setLoading(true)
      try {
        const res = await fetch(`/api/matches/${matchId}/events`)
        const data = await res.json()
        if (data.data) {
          setEvents(data.data)
        }
      } catch (err) {
        console.error('Error fetching events:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [matchId, initialEvents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.player_id || !formData.event_type) {
      setError('Player and event type are required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/matches/${matchId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: formData.player_id,
          event_type: formData.event_type,
          minute: formData.minute ? parseInt(formData.minute) : null,
          description: formData.description || null,
        })
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setSaving(false)
        return
      }

      // Add new event to list
      const player = teamPlayers.find(p => p.id === formData.player_id)
      const newEvent: MatchEvent = {
        id: data.data.id,
        event_type: formData.event_type,
        minute: formData.minute ? parseInt(formData.minute) : null,
        description: formData.description || null,
        player: {
          id: formData.player_id,
          display_name: player?.display_name || 'Unknown',
          jersey_number: player?.jersey_number || null,
          photo_url: null,
        }
      }

      setEvents(prev => [...prev, newEvent].sort((a, b) => (a.minute || 0) - (b.minute || 0)))
      setFormData({ player_id: '', event_type: 'goal', minute: '', description: '' })
      setShowAddForm(false)
    } catch (err) {
      console.error('Error adding event:', err)
      setError('Failed to add event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this event?')) return

    try {
      const res = await fetch(`/api/matches/${matchId}/events?event_id=${eventId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId))
      }
    } catch (err) {
      console.error('Error deleting event:', err)
    }
  }

  const getEventIcon = (type: string) => {
    return EVENT_TYPES.find(e => e.value === type)?.icon || '•'
  }

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      goal: 'text-green-600 bg-green-50 border-green-200',
      yellow_card: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      red_card: 'text-red-600 bg-red-50 border-red-200',
      substitution_in: 'text-blue-600 bg-blue-50 border-blue-200',
      substitution_out: 'text-orange-600 bg-orange-50 border-orange-200',
      penalty: 'text-purple-600 bg-purple-50 border-purple-200',
      own_goal: 'text-gray-600 bg-gray-50 border-gray-200',
    }
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark">Match Timeline</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Events List */}
      {events.length > 0 ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start gap-4 pl-10">
                {/* Event Icon */}
                <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center text-sm border ${getEventColor(event.event_type)}`}>
                  {getEventIcon(event.event_type)}
                </div>

                {/* Event Content */}
                <div className={`flex-1 p-3 rounded-lg border ${getEventColor(event.event_type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dark">
                        {event.player?.display_name || 'Unknown'}
                      </span>
                      {event.player?.jersey_number && (
                        <span className="text-xs text-gray-500">#{event.player.jersey_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {event.minute && (
                        <span className="text-sm font-bold text-dark">
                          {event.minute}'
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1 hover:bg-white/50 rounded transition"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-light rounded-lg">
          No events recorded yet
        </div>
      )}

      {/* Add Event Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Add Match Event</h3>
              <button
                onClick={() => { setShowAddForm(false); setError(''); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Player */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player *</label>
                <select
                  value={formData.player_id}
                  onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select player...</option>
                  {teamPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}{p.jersey_number ? ` (#${p.jersey_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minute */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minute (optional)</label>
                <input
                  type="number"
                  value={formData.minute}
                  onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
                  placeholder="e.g. 45"
                  min="0"
                  max="120"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setError(''); }}
                  className="flex-1 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {saving ? 'Saving...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}