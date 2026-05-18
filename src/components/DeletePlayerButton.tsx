'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

export function DeletePlayerButton({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    const { error } = await supabase.from('players').delete().eq('id', playerId)

    if (error) {
      alert('Failed to delete player: ' + error.message)
      setLoading(false)
      setShowConfirm(false)
      return
    }

    router.push('/players')
    router.refresh()
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">Delete {playerName}?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          {loading ? 'Deleting...' : 'Yes, Delete'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 text-sm rounded-lg transition"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  )
}