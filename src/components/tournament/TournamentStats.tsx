'use client'

import { useState } from 'react'
import { Award, Target, Filter } from 'lucide-react'

interface PlayerStat {
  rank: number
  id: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  player: {
    id: string
    display_name: string
    photo_url: string | null
    jersey_number: number | null
    position: string | null
    team: {
      id: string
      name: string
      slug: string
    }
    age_class: {
      id: string
      name: string
    } | null
  }
}

interface TournamentStatsProps {
  stats: PlayerStat[]
  ageClasses: Array<{ id: string; name: string }>
  selectedAgeClass?: string
  onAgeClassChange?: (ageClassId: string | null) => void
}

export default function TournamentStats({
  stats,
  ageClasses,
  selectedAgeClass,
  onAgeClassChange
}: TournamentStatsProps) {
  const [activeTab, setActiveTab] = useState<'goals' | 'assists'>('goals')

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada statistik untuk tournament ini.</p>
        <p className="text-gray-400 text-sm mt-2">Statistik pemain akan muncul setelah admin menginput data.</p>
      </div>
    )
  }

  const sortedByGoals = [...stats].sort((a, b) => b.goals - a.goals).map((s, i) => ({ ...s, rank: i + 1 }))
  const sortedByAssists = [...stats].sort((a, b) => b.assists - a.assists).map((s, i) => ({ ...s, rank: i + 1 }))

  const displayStats = activeTab === 'goals' ? sortedByGoals : sortedByAssists

  return (
    <div className="space-y-4">
      {/* Age Class Filter */}
      {ageClasses.length > 0 && onAgeClassChange && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            Age Class:
          </div>
          <select
            value={selectedAgeClass || ''}
            onChange={(e) => onAgeClassChange(e.target.value || null)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Ages</option>
            {ageClasses.map((ac) => (
              <option key={ac.id} value={ac.id}>{ac.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition ${
              activeTab === 'goals'
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Top Scorers
          </button>
          <button
            onClick={() => setActiveTab('assists')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition ${
              activeTab === 'assists'
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Top Assists
          </button>
        </div>

        {/* Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Player</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Team</th>
                {selectedAgeClass === null && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Age</th>
                )}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {activeTab === 'goals' ? 'Goals' : 'Assists'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      stat.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      stat.rank === 2 ? 'bg-gray-200 text-gray-600' :
                      stat.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {stat.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {stat.player.photo_url ? (
                          <img src={stat.player.photo_url} alt={stat.player.display_name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-primary">
                            {stat.player.display_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-dark">{stat.player.display_name}</p>
                        <p className="text-xs text-gray-500">{stat.player.position || 'Player'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{stat.player.team?.name}</td>
                  {selectedAgeClass === null && (
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {stat.player.age_class?.name || '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-sm font-bold ${
                      stat.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {activeTab === 'goals' ? stat.goals : stat.assists}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}