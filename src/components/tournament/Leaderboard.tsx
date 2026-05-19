'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, TrendingUp } from 'lucide-react'

interface Standing {
  team_id: string
  team_name: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}

interface TopScorer {
  player_id: string
  player_name: string
  photo_url: string | null
  team_name: string
  total_goals: number
}

interface LeaderboardProps {
  tournamentSlug: string
  sportSlug: string
}

export default function Leaderboard({ tournamentSlug, sportSlug }: LeaderboardProps) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [topScorers, setTopScorers] = useState<TopScorer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers'>('standings')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`/api/tournaments/${tournamentSlug}/leaderboard`)
        const data = await res.json()

        if (data.data) {
          setStandings(data.data.standings || [])
          setTopScorers(data.data.top_scorers || [])
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [tournamentSlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b">
        <button
          onClick={() => setActiveTab('standings')}
          className={`pb-3 px-2 font-medium transition ${
            activeTab === 'standings'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-dark'
          }`}
        >
          <span className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Standings
          </span>
        </button>
        <button
          onClick={() => setActiveTab('scorers')}
          className={`pb-3 px-2 font-medium transition ${
            activeTab === 'scorers'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-dark'
          }`}
        >
          <span className="flex items-center gap-2">
            <Medal className="w-4 h-4" />
            Top Scorers
          </span>
        </button>
      </div>

      {/* Standings Table */}
      {activeTab === 'standings' && (
        <div className="overflow-x-auto">
          {standings.length > 0 ? (
            <table className="w-full">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Team</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">P</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">W</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">D</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">L</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">GD</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standings.map((standing, index) => (
                  <tr key={standing.team_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-dark">{standing.team_name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{standing.played}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{standing.won}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{standing.drawn}</td>
                    <td className="px-4 py-3 text-center text-red-600">{standing.lost}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {standing.goals_for - standing.goals_against > 0 ? '+' : ''}
                      {standing.goals_for - standing.goals_against}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-dark">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">No standings data yet</div>
          )}
        </div>
      )}

      {/* Top Scorers */}
      {activeTab === 'scorers' && (
        <div className="space-y-3">
          {topScorers.length > 0 ? (
            topScorers.map((scorer, index) => (
              <div key={scorer.player_id} className="flex items-center gap-4 p-4 bg-light rounded-lg">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-200 text-gray-600' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
                  {scorer.photo_url ? (
                    <img src={scorer.photo_url} alt={scorer.player_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                      {scorer.player_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark">{scorer.player_name}</p>
                  <p className="text-sm text-gray-500">{scorer.team_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{scorer.total_goals}</span>
                  <p className="text-xs text-gray-500">goals</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No scorer data yet</div>
          )}
        </div>
      )}
    </div>
  )
}