'use client'

import { useState } from 'react'
import { Calendar, Trophy, Target, Medal } from 'lucide-react'
import StandingsTable from './StandingsTable'
import TournamentStats from './TournamentStats'
import Leaderboard from './Leaderboard'

interface Tab {
  id: 'matches' | 'standings' | 'stats' | 'leaderboard'
  label: string
  icon: any
}

const tabs: Tab[] = [
  { id: 'matches', label: 'Matches', icon: Calendar },
  { id: 'standings', label: 'Standings', icon: Trophy },
  { id: 'stats', label: 'Stats', icon: Target },
  { id: 'leaderboard', label: 'Top Scorers', icon: Medal },
]

interface Match {
  id: string
  score_home: number
  score_away: number
  match_date: string
  venue: string | null
  status: string
  team_home: { id: string; name: string; slug: string; logo_url: string | null } | null
  team_away: { id: string; name: string; slug: string; logo_url: string | null } | null
}

interface TournamentTabsProps {
  tournamentSlug: string
  sportSlug: string
  matches: Match[]
  standings: any[]
  stats: any[]
  ageClasses: any[]
}

export default function TournamentTabs({
  tournamentSlug,
  sportSlug,
  matches,
  standings,
  stats,
  ageClasses,
}: TournamentTabsProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'stats' | 'leaderboard'>('matches')

  const baseUrl = `https://${sportSlug}.sfwinner.site`

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matches && matches.length > 0 ? (
            matches.map((match) => (
              <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500">
                    {match.match_date && new Date(match.match_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    match.status === 'completed' ? 'bg-green-100 text-green-700' :
                    match.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {match.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      {match.team_home?.logo_url ? (
                        <img src={match.team_home.logo_url} alt={match.team_home?.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-xl">🏅</span>
                      )}
                    </div>
                    <p className="font-semibold text-dark text-sm">{match.team_home?.name || 'TBD'}</p>
                  </div>

                  <div className="px-6">
                    {match.status === 'completed' ? (
                      <span className="text-3xl font-bold text-dark">
                        {match.score_home} <span className="text-gray-300 mx-2">—</span> {match.score_away}
                      </span>
                    ) : (
                      <span className="text-lg font-semibold text-gray-400">vs</span>
                    )}
                  </div>

                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      {match.team_away?.logo_url ? (
                        <img src={match.team_away.logo_url} alt={match.team_away?.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-xl">🏅</span>
                      )}
                    </div>
                    <p className="font-semibold text-dark text-sm">{match.team_away?.name || 'TBD'}</p>
                  </div>
                </div>

                {match.venue && (
                  <p className="text-xs text-gray-400 text-center mt-3">📍 {match.venue}</p>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500">Belum ada match untuk tournament ini.</p>
            </div>
          )}
        </div>
      )}

      {/* Standings Tab */}
      {activeTab === 'standings' && (
        <StandingsTable standings={standings} />
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <TournamentStats stats={stats} ageClasses={ageClasses} />
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <Leaderboard tournamentSlug={tournamentSlug} sportSlug={sportSlug} />
      )}
    </div>
  )
}