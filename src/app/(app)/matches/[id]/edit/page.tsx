'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, Save, X } from 'lucide-react'

interface Match {
  id: string
  match_date: string | null
  venue: string | null
  status: string
  score_home: number
  score_away: number
  age_class_id: string | null
  tournament: { id: string; name: string }
  team_home: { id: string; name: string }
  team_away: { id: string; name: string } | null
}

interface AgeClass {
  id: string
  name: string
}

export default function EditMatchPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [match, setMatch] = useState<Match | null>(null)
  const [ageClasses, setAgeClasses] = useState<AgeClass[]>([])

  const [formData, setFormData] = useState({
    score_home: '',
    score_away: '',
    match_date: '',
    venue: '',
    status: 'completed',
    age_class_id: '',
  })

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

        // Set form data
        setFormData({
          score_home: matchData.score_home?.toString() || '',
          score_away: matchData.score_away?.toString() || '',
          match_date: matchData.match_date ? new Date(matchData.match_date).toISOString().slice(0, 16) : '',
          venue: matchData.venue || '',
          status: matchData.status || 'completed',
          age_class_id: matchData.age_class_id || '',
        })

        // Get user's team for age classes
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('team_id')
            .eq('id', user.id)
            .single() as any

          if (userData?.team_id) {
            const { data: acData } = await supabase
              .from('age_classes')
              .select('id, name')
              .eq('team_id', userData.team_id)
              .order('name')

            setAgeClasses(acData || [])
          }
        }
      } catch (err) {
        console.error('Error fetching match:', err)
        router.push('/matches')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [matchId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.score_home === '' || formData.score_away === '') {
      setError('Score is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_home: parseInt(formData.score_home) || 0,
          score_away: parseInt(formData.score_away) || 0,
          match_date: formData.match_date || null,
          venue: formData.venue || null,
          status: formData.status,
          age_class_id: formData.age_class_id || null,
        })
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
      console.error('Error updating match:', err)
      setError('Failed to update match')
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/matches/${matchId}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Edit Match</h1>
          <p className="text-gray-500 mt-1">{match.tournament?.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Match Info (read-only) */}
        <div className="bg-light rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500">Home:</span>
              <span className="font-medium text-dark ml-2">{match.team_home?.name}</span>
            </div>
            <div className="text-gray-400">vs</div>
            <div>
              <span className="font-medium text-dark mr-2">{match.team_away?.name || 'Away'}</span>
              <span className="text-gray-500">Away</span>
            </div>
          </div>
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
            <option value="postponed">Postponed</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}