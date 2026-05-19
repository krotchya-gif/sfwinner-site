'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, ChevronRight } from 'lucide-react'

interface Match {
  id: string
  match_date: string | null
  venue: string | null
  status: string
  score_home: number
  score_away: number
  tournament: { name: string }
  team_away: { name: string } | null
}

interface UpcomingMatchesWidgetProps {
  teamId: string
}

export default function UpcomingMatchesWidget({ teamId }: UpcomingMatchesWidgetProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      try {
        const res = await fetch(`/api/matches?team=${teamId}`)
        const data = await res.json()

        if (data.data) {
          // Filter to upcoming/scheduled matches
          const upcoming = data.data
            .filter((m: any) => m.status === 'scheduled')
            .slice(0, 5)
          setMatches(upcoming)
        }
      } catch (err) {
        console.error('Error fetching upcoming matches:', err)
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchUpcomingMatches()
    }
  }, [teamId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-dark font-heading mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Matches
        </h2>
        <p className="text-gray-500 text-center py-4">No upcoming matches scheduled.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark font-heading flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Matches
        </h2>
        <Link href="/matches" className="text-sm text-primary hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="flex items-center justify-between p-4 bg-light rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex-1">
              <p className="font-medium text-dark">{match.tournament?.name || 'Match'}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                {match.match_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(match.match_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
                {match.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {match.venue}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">vs {match.team_away?.name || 'TBD'}</p>
              <p className="text-xs text-gray-400">Scheduled</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}