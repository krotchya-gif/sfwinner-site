'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Plus, Search, X, Flag, Pencil, Trash2, ChevronRight } from 'lucide-react'

interface Sport { id: string; name: string; slug: string; logo_url: string | null }
interface Team { id: string; name: string; slug: string; logo_url: string | null; branch_location: string | null; sport_id: string; created_at: string; sports?: Sport }

export default function AdminTeamsPage() {
  const searchParams = useSearchParams()
  const sportFilter = searchParams.get('sport') || ''
  const teamFilter = searchParams.get('team') || ''

  const [sports, setSports] = useState<Sport[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  const [formData, setFormData] = useState({ name: '', slug: '', branch_location: '', sport_id: '' })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [sportFilter])

  const loadData = async () => {
    setLoading(true)
    const { data: sportsData } = await supabase.from('sports').select('*').order('name')
    setSports(sportsData || [])

    let query = supabase.from('teams').select('*, sports(*)').order('name')
    if (sportFilter) {
      const sport = sportsData?.find(s => s.slug === sportFilter)
      if (sport) query = query.eq('sport_id', sport.id)
    }
    const { data: teamsData } = await query
    setTeams(teamsData || [])
    setLoading(false)
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.sport_id) {
      setError('Name and sport are required.')
      return
    }

    setSaving(true)
    setError('')

    const slug = formData.slug || generateSlug(formData.name)

    const payload = {
      name: formData.name,
      slug,
      branch_location: formData.branch_location || null,
      sport_id: formData.sport_id,
    }

    let err
    if (editingTeam) {
      const { error } = await supabase.from('teams').update(payload).eq('id', editingTeam.id)
      err = error
    } else {
      const { error } = await supabase.from('teams').insert(payload)
      err = error
    }

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    resetForm()
    loadData()
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', branch_location: '', sport_id: '' })
    setEditingTeam(null)
    setShowAddForm(false)
    setSaving(false)
    setError('')
  }

  const handleEdit = (team: Team) => {
    setFormData({ name: team.name, slug: team.slug, branch_location: team.branch_location || '', sport_id: team.sport_id })
    setEditingTeam(team)
    setShowAddForm(true)
  }

  const handleDelete = async (team: Team) => {
    if (!confirm(`Delete team "${team.name}"? This will also delete players and matches.`)) return
    await supabase.from('teams').delete().eq('id', team.id)
    loadData()
  }

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.branch_location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Teams</h1>
          <p className="text-gray-500 mt-1">{filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingTeam(null); setFormData({ name: '', slug: '', branch_location: '', sport_id: sportFilter ? sports.find(s => s.slug === sportFilter)?.id || '' : '' }) }}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" /> Add Team
        </button>
      </div>

      {/* Sport filter tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <a href="/admin/teams" className={`px-4 py-2 text-sm font-medium border-b-2 transition ${!sportFilter ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}>
          All Sports
        </a>
        {sports.map(s => (
          <a key={s.id} href={`/admin/teams?sport=${s.slug}`} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${sportFilter === s.slug ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}>
            {s.name}
          </a>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search teams..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
      </div>

      {/* Teams table */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No teams found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Team</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sport</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-light transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-7 h-7 object-contain" />
                        ) : (
                          <Flag className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-dark">{team.name}</p>
                        <p className="text-xs text-gray-400">{team.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{team.sports?.name || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{team.branch_location || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(team)} className="p-2 hover:bg-gray-100 rounded-lg transition" title="Edit">
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(team)} className="p-2 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-dark">{editingTeam ? 'Edit Team' : 'Add Team'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                  placeholder="e.g. SF Winner Sawangan" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-from-name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
                <select value={formData.sport_id} onChange={e => setFormData({ ...formData, sport_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required>
                  <option value="">Select sport...</option>
                  {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Location</label>
                <input type="text" value={formData.branch_location} onChange={e => setFormData({ ...formData, branch_location: e.target.value })}
                  placeholder="e.g. Sawangan, Depok" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {saving ? (editingTeam ? 'Saving...' : 'Creating...') : (editingTeam ? 'Save Changes' : 'Create Team')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}