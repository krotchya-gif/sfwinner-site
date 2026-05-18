'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { TrendingUp, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgeClass {
  id: string
  name: string
}

export function PromoteButton({ playerId, currentAgeClass }: { playerId: string; currentAgeClass?: string }) {
  const [showModal, setShowModal] = useState(false)
  const [targetAgeClassId, setTargetAgeClassId] = useState('')
  const [ageClasses, setAgeClasses] = useState<AgeClass[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingClasses, setFetchingClasses] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const openModal = async () => {
    setShowModal(true)
    setFetchingClasses(true)
    // Get user's team age classes
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()

    if (userData?.team_id) {
      const { data } = await supabase
        .from('age_classes')
        .select('id, name')
        .eq('team_id', userData.team_id)
        .order('name')

      // Filter out current age class
      setAgeClasses((data || []).filter(ac => ac.name !== currentAgeClass))
    }
    setFetchingClasses(false)
  }

  const handlePromote = async () => {
    if (!targetAgeClassId) return
    setLoading(true)

    const { error } = await supabase
      .from('players')
      .update({
        age_class_id: targetAgeClassId,
        status: 'promoted',
      })
      .eq('id', playerId)

    setLoading(false)

    if (error) {
      alert('Failed to promote player: ' + error.message)
      return
    }

    setShowModal(false)
    router.refresh()
    router.push(`/players/${playerId}`)
  }

  if (!showModal) {
    return (
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
      >
        <TrendingUp className="w-4 h-4" />
        Promote
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setShowModal(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-dark font-heading mb-2">
            Promote Player
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Move this player from {currentAgeClass || 'current class'} to a higher age class.
          </p>

          {fetchingClasses ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Age Class
              </label>
              <select
                value={targetAgeClassId}
                onChange={(e) => setTargetAgeClassId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-6"
              >
                <option value="">Choose age class...</option>
                {ageClasses.map(ac => (
                  <option key={ac.id} value={ac.id}>{ac.name}</option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePromote}
                  disabled={!targetAgeClassId || loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  {loading ? 'Promoting...' : 'Promote Player'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}