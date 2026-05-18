'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Plus, Calendar, Search, ChevronRight, Loader2, Shield, Target, Clock } from 'lucide-react'

interface Match {
  id: string
  tournament_id: string
  team_home_id: string
  team_away_id: string
  age_class_id: string
  score_home: number
  score_away: number
  match_date: string | null
  venue: string | null
  status: string
  tournament?: { name: string; sport_id: string } | any
  age_class?: { name: string } | any
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get user's team
      const { data: userData } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single() as any

      if (!userData?.team_id) {
        setLoading(false)
        return
      }

      // Get matches where this team is home or away
      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          id, tournament_id, team_home_id, team_away_id, age_class_id,
          score_home, score_away, match_date, venue, status,
          tournament:tournaments (name, sport_id),
          age_class:age_classes (name)
        `)
        .or(`team_home_id.eq.${userData.team_id},team_away_id.eq.${userData.team_id}`)
        .order('match_date', { ascending: false })

      setMatches(matchData || [])
      setLoading(false)
    }

    getData()
  }, [])

  const filteredMatches = matches.filter(m =>
    m.tournament?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getScoreDisplay = (match: Match, teamId: string) => {
    const isHome = match.team_home_id === teamId
    return isHome
      ? `${match.score_home} - ${match.score_away}`
      : `${match.score_away} - ${match.score_home}`
  }

  const getResultClass = (match: Match, teamId: string) => {
    if (match.status !== 'completed') return ''
    const isHome = match.team_home_id === teamId
    const ourScore = isHome ? match.score_home : match.score_away
    const theirScore = isHome ? match.score_away : match.score_home
    if (ourScore > theirScore) return 'text-green-600'
    if (ourScore < theirScore) return 'text-red-600'
    return 'text-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Matches</h1>
          <p className="text-gray-500 mt-1">
            {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Link
          href="/matches/add"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Match
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search matches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </div>

      {/* No matches */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">No matches yet</h3>
          <p className="text-gray-500 mb-6">Record your team's match results and statistics.</p>
          <Link
            href="/matches/add"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add First Match
          </Link>
        </div>
      ) : (
        /* Match list */
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                {/* Tournament + Age Class */}
                <div className="flex-1">
                  <p className="font-semibold text-dark">{match.tournament?.name || 'Tournament'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {match.age_class && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {match.age_class.name}
                      </span>
                    )}
                    {match.venue && (
                      <span className="text-sm text-gray-500">{match.venue}</span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-center px-6">
                  <p className={`text-2xl font-bold ${getResultClass(match, match.team_home_id)}`}>
                    {getScoreDisplay(match, match.team_home_id)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {match.match_date
                      ? new Date(match.match_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'TBD'}
                  </p>
                </div>

                {/* Status + Action */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    match.status === 'completed' ? 'bg-green-100 text-green-700' :
                    match.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {match.status}
                  </span>
                  <Link
                    href={`/matches/${match.id}`}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}