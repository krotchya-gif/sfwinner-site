'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Award, Plus, Calendar, Trophy, ChevronRight, Loader2, Search, X, AlertCircle } from 'lucide-react'

interface Achievement {
  id: string
  player_id: string
  tournament_name: string
  award: string
  date: string | null
  description: string | null
  player?: { display_name: string; photo_url: string | null } | any
}

interface Player {
  id: string
  display_name: string
  photo_url: string | null
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Add form state
  const [formData, setFormData] = useState({
    player_id: '',
    tournament_name: '',
    award: '',
    description: '',
    date: ''
  })

  const supabase = createClient()
  const router = useRouter()

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
        setLoading(false)
        return
      }

      // Get player IDs for this team
      const { data: playerIds } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', userData.team_id)

      const playerIdList = playerIds?.map((p: any) => p.id) || []

      // Get achievements with player info
      if (playerIdList.length > 0) {
        const { data: achData } = await supabase
          .from('achievements')
          .select(`
            id, player_id, tournament_name, award, date, description,
            player:players (display_name, photo_url)
          `)
          .in('player_id', playerIdList)
          .order('date', { ascending: false })

        setAchievements(achData || [])
      }

      // Get players for dropdown
      const { data: playerData } = await supabase
        .from('players')
        .select('id, display_name, photo_url')
        .eq('team_id', userData.team_id)
        .order('display_name')

      setPlayers(playerData || [])
      setLoading(false)
    }

    getData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.player_id || !formData.tournament_name || !formData.award) {
      setError('Player, tournament name, and award are required.')
      return
    }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase
      .from('achievements')
      .insert({
        player_id: formData.player_id,
        tournament_name: formData.tournament_name,
        award: formData.award,
        description: formData.description || null,
        date: formData.date || null,
      })

    if (err) {
      setError('Failed to add achievement: ' + err.message)
      setSaving(false)
      return
    }

    // Refresh
    setFormData({ player_id: '', tournament_name: '', award: '', description: '', date: '' })
    setShowAddForm(false)
    setSaving(false)

    // Reload data
    const { data: userData } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single() as any

    const { data: playerIds } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', userData?.team_id)

    const playerIdList = playerIds?.map((p: any) => p.id) || []

    if (playerIdList.length > 0) {
      const { data: achData } = await supabase
        .from('achievements')
        .select(`
          id, player_id, tournament_name, award, date, description,
          player:players (display_name, photo_url)
        `)
        .in('player_id', playerIdList)
        .order('date', { ascending: false })

      setAchievements(achData || [])
    }
  }

  const filteredAchievements = achievements.filter(ach =>
    ach.tournament_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ach.award?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ach.player?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Achievements</h1>
          <p className="text-gray-500 mt-1">
            {achievements.length} achievement{achievements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Achievement
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search achievements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </div>

      {/* No achievements */}
      {achievements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">No achievements yet</h3>
          <p className="text-gray-500 mb-6">Record your team's accomplishments and awards.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add First Achievement
          </button>
        </div>
      ) : (
        /* Achievement list */
        <div className="space-y-4">
          {filteredAchievements.map((ach) => (
            <div key={ach.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-dark">{ach.award || 'Achievement'}</p>
                    <p className="text-gray-500 mt-1">{ach.tournament_name}</p>
                    {ach.description && (
                      <p className="text-sm text-gray-400 mt-1">{ach.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {ach.date && (
                    <p className="text-sm text-gray-500">
                      {new Date(ach.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                  {ach.player && (
                    <p className="text-sm text-primary mt-1">{ach.player.display_name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-dark">Add Achievement</h2>
              <button
                onClick={() => { setShowAddForm(false); setError('') }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player *</label>
                <select
                  value={formData.player_id}
                  onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select player...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>{p.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
                <input
                  type="text"
                  value={formData.tournament_name}
                  onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
                  placeholder="e.g. Liga Sejahtera 2026"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Award / Achievement *</label>
                <input
                  type="text"
                  value={formData.award}
                  onChange={(e) => setFormData({ ...formData, award: e.target.value })}
                  placeholder="e.g. Juara 1, Top Scorer, dll"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setError('') }}
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
                  {saving ? 'Saving...' : 'Add Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}