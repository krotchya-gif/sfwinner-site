'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Plus, X, Pencil, Trash2, Shield } from 'lucide-react'

interface Sport {
  id: string
  name: string
  slug: string
  short_name: string | null
  logo_url: string | null
  created_at: string
}

export default function AdminSportsPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSport, setEditingSport] = useState<Sport | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', slug: '', short_name: '', logo_url: '' })

  const supabase = createClient()

  useEffect(() => { loadSports() }, [])

  const loadSports = async () => {
    const { data } = await supabase.from('sports').select('*').order('name')
    setSports(data || [])
    setLoading(false)
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) { setError('Sport name is required.'); return }

    setSaving(true)
    setError('')

    const payload = {
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      short_name: formData.short_name || null,
      logo_url: formData.logo_url || null,
    }

    let err
    if (editingSport) {
      const { error } = await supabase.from('sports').update(payload).eq('id', editingSport.id)
      err = error
    } else {
      const { error } = await supabase.from('sports').insert(payload)
      err = error
    }

    if (err) { setError(err.message); setSaving(false); return }

    resetForm()
    loadSports()
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', short_name: '', logo_url: '' })
    setEditingSport(null)
    setShowAddForm(false)
    setSaving(false)
    setError('')
  }

  const handleEdit = (sport: Sport) => {
    setFormData({ name: sport.name, slug: sport.slug, short_name: sport.short_name || '', logo_url: sport.logo_url || '' })
    setEditingSport(sport)
    setShowAddForm(true)
  }

  const handleDelete = async (sport: Sport) => {
    if (!confirm(`Delete sport "${sport.name}"? This will delete all teams, players, and matches in this sport.`)) return
    await supabase.from('sports').delete().eq('id', sport.id)
    loadSports()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const sportEmoji: Record<string, string> = { futsal: '⚽', renang: '🏊', basket: '🏀' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Sports</h1>
          <p className="text-gray-500 mt-1">{sports.length} sport{sports.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingSport(null); setFormData({ name: '', slug: '', short_name: '', logo_url: '' }) }}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" /> Add Sport
        </button>
      </div>

      {/* Sports grid */}
      {sports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No sports configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sports.map((sport) => (
            <div key={sport.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`h-2 ${
                sport.slug === 'futsal' ? 'bg-primary' :
                sport.slug === 'renang' ? 'bg-cyan-500' :
                sport.slug === 'basket' ? 'bg-orange-500' : 'bg-gray-400'
              }`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                      {sport.logo_url ? (
                        <img src={sport.logo_url} alt={sport.name} className="w-8 h-8 object-contain" />
                      ) : (
                        sportEmoji[sport.slug] || '🏆'
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-dark">{sport.name}</h3>
                      <p className="text-xs text-gray-400">/{sport.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(sport)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(sport)} className="p-2 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                {sport.short_name && (
                  <p className="text-sm text-gray-500">Short name: {sport.short_name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-dark">{editingSport ? 'Edit Sport' : 'Add Sport'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                  placeholder="e.g. Basketball" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. basketball" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                <input type="text" value={formData.short_name} onChange={e => setFormData({ ...formData, short_name: e.target.value })}
                  placeholder="e.g. Basket" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input type="url" value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {saving ? (editingSport ? 'Saving...' : 'Creating...') : (editingSport ? 'Save Changes' : 'Create Sport')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}