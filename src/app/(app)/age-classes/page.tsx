'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Edit, Trash2, Loader2, AlertCircle, X } from 'lucide-react'

interface AgeClass {
  id: string
  name: string
  min_age: number | null
  max_age: number | null
}

export default function AgeClassesPage() {
  const [ageClasses, setAgeClasses] = useState<AgeClass[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', min_age: '', max_age: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single()

      if (userData?.team_id) {
        setTeamId(userData.team_id)

        const { data } = await supabase
          .from('age_classes')
          .select('id, name, min_age, max_age')
          .eq('team_id', userData.team_id)
          .order('name')

        setAgeClasses(data || [])
      }
      setLoading(false)
    }

    getData()
  }, [])

  const resetForm = () => {
    setFormData({ name: '', min_age: '', max_age: '' })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamId) return
    setSaving(true)
    setError('')

    const payload = {
      team_id: teamId,
      name: formData.name,
      min_age: formData.min_age ? parseInt(formData.min_age) : null,
      max_age: formData.max_age ? parseInt(formData.max_age) : null,
    }

    let result
    if (editingId) {
      result = await supabase.from('age_classes').update(payload).eq('id', editingId)
    } else {
      result = await supabase.from('age_classes').insert(payload)
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    // Refresh
    const { data } = await supabase
      .from('age_classes')
      .select('id, name, min_age, max_age')
      .eq('team_id', teamId)
      .order('name')

    setAgeClasses(data || [])
    resetForm()
    setSaving(false)
  }

  const handleEdit = (ac: AgeClass) => {
    setFormData({
      name: ac.name,
      min_age: ac.min_age?.toString() || '',
      max_age: ac.max_age?.toString() || '',
    })
    setEditingId(ac.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this age class?')) return

    await supabase.from('age_classes').delete().eq('id', id)
    setAgeClasses(prev => prev.filter(ac => ac.id !== id))
  }

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
          <h1 className="text-2xl font-bold text-dark font-heading">Age Classes</h1>
          <p className="text-gray-500 mt-1">
            Manage U-7, U-8, U-10, etc. for your team
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', min_age: '', max_age: '' }) }}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Age Class
        </button>
      </div>

      {/* No team */}
      {!teamId ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800">No team assigned. Contact super admin.</p>
        </div>
      ) : ageClasses.length === 0 && !showForm ? (
        /* Empty state */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">No age classes yet</h3>
          <p className="text-gray-500 mb-6">Create age classes like U-7, U-8, U-10, etc.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add First Age Class
          </button>
        </div>
      ) : (
        /* Age classes list */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-light">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Age Range</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-dark">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ageClasses.map((ac) => (
                <tr key={ac.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-dark">{ac.name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {ac.min_age !== null || ac.max_age !== null
                      ? `${ac.min_age ?? '?'} - ${ac.max_age ?? '?'} years`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(ac)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(ac.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
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
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={resetForm} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark font-heading">
                  {editingId ? 'Edit Age Class' : 'Add Age Class'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="U-8"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Age
                    </label>
                    <input
                      type="number"
                      value={formData.min_age}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_age: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="7"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Age
                    </label>
                    <input
                      type="number"
                      value={formData.max_age}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_age: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="8"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add Age Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}