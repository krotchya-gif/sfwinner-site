'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Plus, Calendar, Search, Loader2, X, MapPin, CalendarDays } from 'lucide-react'

interface Tournament {
  id: string
  name: string
  slug: string
  description: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  sport?: { name: string; slug: string } | any
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
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

      // Get user's team to know the sport
      const { data: userData } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single() as any

      if (!userData?.team_id) {
        setLoading(false)
        return
      }

      // Get sport_id from team
      const { data: team } = await supabase
        .from('teams')
        .select('sport_id')
        .eq('id', userData.team_id)
        .single() as any

      if (team?.sport_id) {
        const { data: tourData } = await supabase
          .from('tournaments')
          .select(`
            id, name, slug, description, location, start_date, end_date,
            sport:sports (name, slug)
          `)
          .eq('sport_id', team.sport_id)
          .order('start_date', { ascending: false })

        setTournaments(tourData || [])
      }

      setLoading(false)
    }

    getData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setError('Tournament name is required.')
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

    // Get sport_id from team
    const { data: team } = await supabase
      .from('teams')
      .select('sport_id')
      .eq('id', userData.team_id)
      .single() as any

    // Generate slug from name
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { error: err } = await supabase
      .from('tournaments')
      .insert({
        name: formData.name,
        slug,
        description: formData.description || null,
        location: formData.location || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        sport_id: team?.sport_id,
        created_by: user.id,
      })

    if (err) {
      setError('Failed to create tournament: ' + err.message)
      setSaving(false)
      return
    }

    // Refresh
    setFormData({ name: '', slug: '', description: '', location: '', start_date: '', end_date: '' })
    setShowAddForm(false)
    setSaving(false)

    // Reload
    if (team?.sport_id) {
      const { data: tourData } = await supabase
        .from('tournaments')
        .select(`
          id, name, slug, description, location, start_date, end_date,
          sport:sports (name, slug)
        `)
        .eq('sport_id', team.sport_id)
        .order('start_date', { ascending: false })

      setTournaments(tourData || [])
    }
  }

  const filteredTournaments = tournaments.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.location?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-dark font-heading">Tournaments</h1>
          <p className="text-gray-500 mt-1">
            {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Create Tournament
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tournaments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </div>

      {/* No tournaments */}
      {tournaments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">No tournaments yet</h3>
          <p className="text-gray-500 mb-6">Create your first tournament to start tracking matches.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create First Tournament
          </button>
        </div>
      ) : (
        /* Tournament grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTournaments.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-primary" />
                </div>
                {t.sport && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {t.sport.name}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-dark mb-2">{t.name}</h3>

              {t.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{t.description}</p>
              )}

              <div className="space-y-2 text-sm text-gray-500">
                {t.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t.location}
                  </div>
                )}
                {(t.start_date || t.end_date) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t.start_date && new Date(t.start_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                    {t.end_date && ` - ${new Date(t.end_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}`}
                  </div>
                )}
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
              <h2 className="text-xl font-bold text-dark">Create Tournament</h2>
              <button
                onClick={() => { setShowAddForm(false); setError('') }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Liga Sejahtera 2026"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details about the tournament..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. GOR Sawangan, Depok"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
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
                  {saving ? 'Creating...' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}