'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Search, Users, ChevronRight, Eye } from 'lucide-react'

interface Player {
  id: string
  display_name: string
  photo_url: string | null
  jersey_number: number | null
  position: string | null
  status: string
  team_id: string
  age_class_id: string | null
  created_at: string
  teams?: { name: string; slug: string; sports?: { name: string; slug: string } }
  age_classes?: { name: string }
}

export default function AdminPlayersPage() {
  const searchParams = useSearchParams()
  const sportFilter = searchParams.get('sport') || ''
  const teamFilter = searchParams.get('team') || ''

  const [players, setPlayers] = useState<Player[]>([])
  const [sports, setSports] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const supabase = createClient()

  useEffect(() => { loadData() }, [sportFilter, teamFilter])

  const loadData = async () => {
    setLoading(true)
    const [{ data: sportsData }, { data: teamsData }, { data: playersData }] = await Promise.all([
      supabase.from('sports').select('*').order('name'),
      supabase.from('teams').select('*, sports(*)').order('name'),
      supabase.from('players').select('*, teams(*, sports(*)), age_classes(*)').order('display_name')
    ])
    setSports(sportsData || [])
    setTeams(teamsData || [])
    setPlayers(playersData || [])
    setLoading(false)
  }

  const filteredPlayers = players.filter(p => {
    const matchSport = !sportFilter || p.teams?.sports?.slug === sportFilter
    const matchTeam = !teamFilter || p.teams?.slug === teamFilter
    const matchSearch = !searchTerm || p.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSport && matchTeam && matchSearch
  })

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark font-heading">All Players</h1>
        <p className="text-gray-500 mt-1">{filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Sport filter tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        <a href="/admin/players" className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${!sportFilter ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}>
          All Sports
        </a>
        {sports.map(s => (
          <a key={s.id} href={`/admin/players?sport=${s.slug}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${sportFilter === s.slug ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}>
            {s.name}
          </a>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search players by name..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
      </div>

      {/* Players grid */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No players found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPlayers.map((player) => {
            const sportColor = player.teams?.sports?.slug === 'basket' ? 'orange'
              : player.teams?.sports?.slug === 'renang' ? 'cyan'
              : 'primary'
            const statusBadge = player.status === 'active' ? 'bg-green-100 text-green-700'
              : player.status === 'promoted' ? 'bg-blue-100 text-blue-700'
              : player.status === 'graduated' ? 'bg-gray-100 text-gray-600'
              : 'bg-red-100 text-red-700'

            return (
              <div key={player.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        {player.teams?.sports?.slug === 'futsal' ? '⚽' : player.teams?.sports?.slug === 'renang' ? '🏊' : '🏀'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark truncate">{player.display_name}</p>
                    {player.jersey_number && (
                      <p className="text-xs text-gray-400">#{player.jersey_number}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Team</span>
                    <span className={`text-xs font-medium text-${sportColor}`}>
                      {player.teams?.name || '-'}
                    </span>
                  </div>
                  {player.age_classes && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Class</span>
                      <span className="text-xs font-medium text-dark">{player.age_classes.name}</span>
                    </div>
                  )}
                  {player.position && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Position</span>
                      <span className="text-xs text-gray-600">{player.position}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge}`}>
                      {player.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlayer(player)}
                  className="w-full mt-4 text-xs text-primary hover:underline flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" /> View Details
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Player detail modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark">Player Details</h2>
              <button onClick={() => setSelectedPlayer(null)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {selectedPlayer.photo_url ? (
                    <img src={selectedPlayer.photo_url} alt={selectedPlayer.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg text-dark">{selectedPlayer.display_name}</p>
                  {selectedPlayer.jersey_number && <p className="text-gray-500">#{selectedPlayer.jersey_number}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Team:</span> <span className="font-medium">{selectedPlayer.teams?.name || '-'}</span></div>
                <div><span className="text-gray-500">Sport:</span> <span className="font-medium">{selectedPlayer.teams?.sports?.name || '-'}</span></div>
                <div><span className="text-gray-500">Class:</span> <span className="font-medium">{selectedPlayer.age_classes?.name || '-'}</span></div>
                <div><span className="text-gray-500">Position:</span> <span className="font-medium">{selectedPlayer.position || '-'}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${selectedPlayer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{selectedPlayer.status}</span></div>
                <div><span className="text-gray-500">Joined:</span> <span className="font-medium">{new Date(selectedPlayer.created_at).toLocaleDateString('id-ID')}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}