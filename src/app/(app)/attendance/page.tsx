'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Calendar, CheckCircle, XCircle, Clock, Plus, AlertCircle } from 'lucide-react'

interface Attendance {
  id: string
  event_type: string
  event_name: string
  event_date: string
  status: string
  notes: string | null
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
}

export default function AttendancePage() {
  const supabase = createClient()
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    player_id: '',
    event_type: 'training',
    event_name: '',
    event_date: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [attendanceRes, playersRes] = await Promise.all([
      fetch('/api/attendance').then(r => r.json()),
      supabase.from('players').select('id, display_name, jersey_number').eq('status', 'active').order('display_name')
    ])

    setAttendance(attendanceRes.data || [])
    setPlayers(playersRes.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.player_id || !formData.event_name) {
      setError('Player and event name are required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setSaving(false)
        return
      }

      setShowAddForm(false)
      setFormData({ player_id: '', event_type: 'training', event_name: '', event_date: new Date().toISOString().split('T')[0], status: 'present', notes: '' })
      loadData()
    } catch (err) {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'absent': return <XCircle className="w-5 h-5 text-red-500" />
      case 'late': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'excused': return <AlertCircle className="w-5 h-5 text-blue-500" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700'
      case 'absent': return 'bg-red-100 text-red-700'
      case 'late': return 'bg-yellow-100 text-yellow-700'
      case 'excused': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'training': return '🏋️'
      case 'match': return '⚽'
      case 'tournament': return '🏆'
      default: return '📅'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Attendance</h1>
          <p className="text-gray-500 mt-1">{attendance.length} records</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Attendance
        </button>
      </div>

      {/* Attendance Records */}
      {attendance.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No attendance records yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-light">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Player</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Event</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden">
                        {record.player?.photo_url ? (
                          <img src={record.player.photo_url} alt={record.player.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                            {record.player?.display_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-dark">{record.player?.display_name || 'Unknown'}</p>
                        {record.player?.jersey_number && (
                          <p className="text-xs text-gray-400">#{record.player.jersey_number}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{getEventIcon(record.event_type)}</span>
                      <div>
                        <p className="font-medium text-dark">{record.event_name}</p>
                        <p className="text-xs text-gray-400 capitalize">{record.event_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(record.event_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                      {getStatusIcon(record.status)}
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark">Add Attendance</h2>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
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
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}{p.jersey_number ? ` (#${p.jersey_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="training">Training</option>
                  <option value="match">Match</option>
                  <option value="tournament">Tournament</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  placeholder="e.g. Morning Practice"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}