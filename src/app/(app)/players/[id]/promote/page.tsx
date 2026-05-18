'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react'

export default function PromotePlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [currentAgeClass, setCurrentAgeClass] = useState('')
  const [targetAgeClassId, setTargetAgeClassId] = useState('')
  const [ageClasses, setAgeClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    params.then(p => setPlayerId(p.id))
  }, [params])

  useEffect(() => {
    if (!playerId) return

    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Get user team
      const { data: userData } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single()

      // Get player
      const { data: player } = await supabase
        .from('players')
        .select('display_name, age_class:age_classes(name)')
        .eq('id', playerId)
        .single() as any

      if (player) {
        setPlayerName(player.display_name)
        setCurrentAgeClass(player.age_class?.name || '')
      }

      // Get age classes (excluding current)
      if (userData?.team_id) {
        const { data: acData } = await supabase
          .from('age_classes')
          .select('id, name')
          .eq('team_id', userData.team_id)
          .order('name')

        setAgeClasses((acData || []).filter(ac => ac.name !== currentAgeClass))
      }

      setLoading(false)
    }

    getData()
  }, [playerId])

  const handlePromote = async () => {
    if (!targetAgeClassId || !playerId) return
    setPromoting(true)

    const { error } = await supabase
      .from('players')
      .update({
        age_class_id: targetAgeClassId,
        status: 'promoted',
      })
      .eq('id', playerId)

    if (error) {
      alert('Failed to promote: ' + error.message)
      setPromoting(false)
      return
    }

    router.push(`/players/${playerId}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-md">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/players/${playerId}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Promote Player</h1>
          <p className="text-gray-500 mt-1">Move to a higher age class</p>
        </div>
      </div>

      {/* Player info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-sm text-gray-500 mb-1">Player</p>
        <p className="text-lg font-semibold text-dark">{playerName}</p>
        <p className="text-sm text-gray-500 mt-2">Current: <span className="font-medium text-dark">{currentAgeClass}</span></p>
      </div>

      {/* Age class select */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="flex items-center gap-3">
          <Link
            href={`/players/${playerId}`}
            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            onClick={handlePromote}
            disabled={!targetAgeClassId || promoting}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {promoting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            {promoting ? 'Promoting...' : 'Promote Player'}
          </button>
        </div>
      </div>
    </div>
  )
}