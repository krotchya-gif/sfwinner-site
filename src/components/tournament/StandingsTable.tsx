'use client'

import { Trophy, TrendingUp } from 'lucide-react'

interface StandingsTableProps {
  standings: Array<{
    rank: number
    team_id: string
    team_name: string
    team_slug: string
    team_logo_url: string | null
    played: number
    won: number
    drawn: number
    lost: number
    goals_for: number
    goals_against: number
    goal_difference: number
    points: number
  }>
}

export default function StandingsTable({ standings }: StandingsTableProps) {
  if (!standings || standings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada participant di tournament ini.</p>
        <p className="text-gray-400 text-sm mt-2">Tambahkan team participant melalui admin panel.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Team</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">P</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">W</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">D</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">L</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">GF</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">GA</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">GD</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {standings.map((team) => (
              <tr key={team.team_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    team.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    team.rank === 2 ? 'bg-gray-200 text-gray-600' :
                    team.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {team.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {team.team_logo_url ? (
                        <img src={team.team_logo_url} alt={team.team_name} className="w-5 h-5 object-contain" />
                      ) : (
                        <Trophy className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className="font-medium text-dark">{team.team_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{team.played}</td>
                <td className="px-4 py-3 text-center text-green-600 font-medium">{team.won}</td>
                <td className="px-4 py-3 text-center text-gray-600">{team.drawn}</td>
                <td className="px-4 py-3 text-center text-red-600 font-medium">{team.lost}</td>
                <td className="px-4 py-3 text-center text-gray-600">{team.goals_for}</td>
                <td className="px-4 py-3 text-center text-gray-600">{team.goals_against}</td>
                <td className={`px-4 py-3 text-center font-medium ${
                  team.goal_difference > 0 ? 'text-green-600' :
                  team.goal_difference < 0 ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                </td>
                <td className="px-4 py-3 text-center font-bold text-dark">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}