'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Calendar, MapPin, ChevronRight, Plus, Search, Edit, Trash2, X } from 'lucide-react'

interface Tournament {
  id: string
  name: string
  slug: string
  description: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  sport_id: string | null
  sports?: { id: string; name: string; slug: string }
}

interface Sport {
  id: string
  name: string
  slug: string
}

export default function AdminTournamentsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    sport_id: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [{ data: tourData }, { data: sportsData }] = await Promise.all([
      supabase.from('tournaments').select('*, sports(*)').order('start_date', { ascending: false }),
      supabase.from('sports').select('*').order('name')
    ])
    setTournaments(tourData || [])
    setSports(sportsData || [])
    setLoading(false)
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const filteredTournaments = tournaments.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.sport_id) {
      setError('Name and Sport are required')
      return
    }

    setSaving(true)
    setError('')

    const slug = formData.slug || generateSlug(formData.name)

    try {
      if (editingTournament) {
        // Update
        const { error: err } = await supabase
          .from('tournaments')
          .update({
            name: formData.name,
            slug,
            description: formData.description || null,
            location: formData.location || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            sport_id: formData.sport_id,
          })
          .eq('id', editingTournament.id)

        if (err) {
          setError(err.message)
          setSaving(false)
          return
        }
      } else {
        // Create
        const { error: err } = await supabase
          .from('tournaments')
          .insert({
            name: formData.name,
            slug,
            description: formData.description || null,
            location: formData.location || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            sport_id: formData.sport_id,
          })

        if (err) {
          setError(err.message)
          setSaving(false)
          return
        }
      }

      loadData()
      setShowForm(false)
      setEditingTournament(null)
      setFormData({ name: '', slug: '', description: '', location: '', start_date: '', end_date: '', sport_id: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament)
    setFormData({
      name: tournament.name,
      slug: tournament.slug,
      description: tournament.description || '',
      location: tournament.location || '',
      start_date: tournament.start_date || '',
      end_date: tournament.end_date || '',
      sport_id: tournament.sport_id || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tournament?')) return

    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (!error) {
      setTournaments(prev => prev.filter(t => t.id !== id))
    }
  }

  const getSportColor = (slug?: string) => {
    if (slug === 'basket') return 'text-orange-500'
    if (slug === 'renang') return 'text-cyan-500'
    return 'text-primary'
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Tournaments</h1>
          <p className="text-gray-500 mt-1">{tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingTournament(null); setFormData({ name: '', slug: '', description: '', location: '', start_date: '', end_date: '', sport_id: '' }); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Tournament
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

      {/* Table */}
      {filteredTournaments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No tournaments found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tournament</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sport</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTournaments.map((t) => (
                <tr key={t.id} className="hover:bg-light transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-dark">{t.name}</p>
                        {t.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{t.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getSportColor(t.sports?.slug)}`}>
                      {t.sports?.name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {t.location ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {t.location}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {t.start_date ? (
                      <span className="text-sm text-gray-600">
                        {new Date(t.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {t.end_date && ` — ${new Date(t.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(t)} className="p-2 hover:bg-gray-100 rounded-lg transition" title="Edit">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                      <a
                        href={`https://${t.sports?.slug === 'renang' ? 'renang' : t.sports?.slug === 'basket' ? 'basketball' : 'futsal'}.sfwinner.site/tournament/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="View"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark">
                {editingTournament ? 'Edit Tournament' : 'Add Tournament'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingTournament(null); setError(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                  placeholder="e.g. Liga Sejahtera 2026"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-if-empty"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
                <select
                  value={formData.sport_id}
                  onChange={(e) => setFormData({ ...formData, sport_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select sport...</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tournament description..."
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
                  placeholder="e.g. GOR Jakarta"
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
                  onClick={() => { setShowForm(false); setEditingTournament(null); setError(''); }}
                  className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {saving ? 'Saving...' : editingTournament ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}