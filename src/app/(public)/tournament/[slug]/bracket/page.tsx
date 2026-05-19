'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Match {
  id: string
  round: number
  position: number
  team_home_id: string | null
  team_away_id: string | null
  team_home_name: string | null
  team_away_name: string | null
  score_home: number
  score_away: number
  winner_id: string | null
  next_match_id: string | null
}

interface BracketMatch {
  id: string
  round: number
  position: number
  team_home_id: string | null
  team_home: { id: string; name: string } | null
  team_away_id: string | null
  team_away: { id: string; name: string } | null
  score_home: number
  score_away: number
  status: string
  next_match_id: string | null
}

interface Tournament {
  id: string
  name: string
  slug: string
  sport_id: string
}

interface BracketPageProps {
  params: Promise<{ slug: string }>
}

export default function TournamentBracketPage({ params }: BracketPageProps) {
  const [slug, setSlug] = useState<string>('')
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [bracket, setBracket] = useState<Record<number, BracketMatch[]>>({})
  const [loading, setLoading] = useState(true)
  const [rounds, setRounds] = useState<number[]>([])

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { slug: s } = await params
      setSlug(s)
      await fetchBracket(s)
    }
    init()
  }, [params])

  const fetchBracket = async (tournamentSlug: string) => {
    setLoading(true)
    try {
      // Get tournament
      const { data: tourData } = await supabase
        .from('tournaments')
        .select('id, name, slug, sport_id')
        .eq('slug', tournamentSlug)
        .single()

      if (!tourData) {
        setLoading(false)
        return
      }
      setTournament(tourData)

      // Get all matches for this tournament
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id,
          team_home_id,
          team_away_id,
          score_home,
          score_away,
          status,
          round,
          position,
          next_match_id,
          team_home:teams!team_home_id_fkey(id, name),
          team_away:teams!team_away_id_fkey(id, name)
        `)
        .eq('tournament_id', tourData.id)
        .order('round', { ascending: true })
        .order('position', { ascending: true })

      if (!matches) {
        setLoading(false)
        return
      }

      // Organize matches by round
      const bracketData: Record<number, BracketMatch[]> = {}
      const maxRound = Math.max(...matches.map((m: any) => m.round || 1), 0)

      // Initialize rounds
      for (let i = 1; i <= maxRound; i++) {
        bracketData[i] = []
      }

      // Fill in matches
      matches.forEach((match: any) => {
        const round = match.round || 1
        if (!bracketData[round]) bracketData[round] = []
        bracketData[round].push({
          id: match.id,
          round,
          position: match.position || 0,
          team_home_id: match.team_home_id,
          team_home: match.team_home,
          team_away_id: match.team_away_id,
          team_away: match.team_away,
          score_home: match.score_home || 0,
          score_away: match.score_away || 0,
          status: match.status,
          next_match_id: match.next_match_id,
        })
      })

      // Sort each round by position
      Object.keys(bracketData).forEach(round => {
        bracketData[parseInt(round)].sort((a, b) => a.position - b.position)
      })

      setBracket(bracketData)
      setRounds(Object.keys(bracketData).map(Number).sort((a, b) => a - b))
    } catch (err) {
      console.error('Error fetching bracket:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSportIcon = (sportId: string) => {
    if (sportId === '22222222-2222-2222-2222-222222222222') return '🏀'
    if (sportId === '33333333-3333-3333-3333-333333333333') return '🏊'
    return '⚽'
  }

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final'
    if (round === totalRounds - 1) return 'Semi-Final'
    if (round === totalRounds - 2) return 'Quarter-Final'
    return `Round ${round}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const sportSlug = tournament?.sport_id === '22222222-2222-2222-2222-222222222222' ? 'basketball'
    : tournament?.sport_id === '33333333-3333-3333-3333-333333333333' ? 'renang'
    : 'futsal'

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-dark text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`https://${sportSlug}.sfwinner.site/tournament/${slug}`}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-heading">
                {tournament?.name} - Bracket
              </h1>
              <p className="text-gray-400 text-sm">Tournament Bracket</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {Object.keys(bracket).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No bracket data available for this tournament.</p>
            <p className="text-sm text-gray-400 mt-2">Matches need to be assigned to rounds and positions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-8 pb-4" style={{ minWidth: '100%' }}>
              {rounds.map((round) => (
                <div key={round} className="flex-shrink-0" style={{ minWidth: '250px' }}>
                  {/* Round Header */}
                  <div className="bg-primary text-white text-center py-3 px-4 rounded-lg mb-4">
                    <p className="font-semibold">{getRoundName(round, Math.max(...rounds))}</p>
                  </div>

                  {/* Matches in this round */}
                  <div className="space-y-4">
                    {bracket[round]?.map((match) => (
                      <div
                        key={match.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                      >
                        {/* Home Team */}
                        <div className={`flex items-center justify-between py-2 ${match.status === 'completed' && match.score_home > match.score_away ? 'font-bold' : ''}`}>
                          <span className={`text-sm truncate flex-1 ${match.team_home ? 'text-dark' : 'text-gray-400'}`}>
                            {match.team_home?.name || 'TBD'}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 rounded ${
                            match.status === 'completed' && match.score_home > match.score_away ? 'bg-green-100 text-green-700' :
                            match.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-gray-50'
                          }`}>
                            {match.score_home}
                          </span>
                        </div>

                        {/* Away Team */}
                        <div className={`flex items-center justify-between py-2 border-t ${match.status === 'completed' && match.score_away > match.score_home ? 'font-bold' : ''}`}>
                          <span className={`text-sm truncate flex-1 ${match.team_away ? 'text-dark' : 'text-gray-400'}`}>
                            {match.team_away?.name || 'TBD'}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 rounded ${
                            match.status === 'completed' && match.score_away > match.score_home ? 'bg-green-100 text-green-700' :
                            match.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-gray-50'
                          }`}>
                            {match.score_away}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 SF Winner Sports Club
          </p>
        </div>
      </footer>
    </div>
  )
}