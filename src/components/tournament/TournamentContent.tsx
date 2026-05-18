'use client'

import { useEffect, useState } from 'react'
import TournamentTabs from './TournamentTabs'

interface TournamentContentProps {
  tournamentSlug: string
  sportSlug: string
  initialMatches: any[]
}

export default function TournamentContent({ tournamentSlug, sportSlug, initialMatches }: TournamentContentProps) {
  const [standings, setStandings] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [ageClasses, setAgeClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch standings
        const standingsRes = await fetch(`/api/tournaments/${tournamentSlug}/standings`)
        const standingsData = await standingsRes.json()
        setStandings(standingsData.data?.standings || [])

        // Fetch stats
        const statsRes = await fetch(`/api/tournaments/${tournamentSlug}/stats`)
        const statsData = await statsRes.json()
        setStats(statsData.data?.stats || [])
        setAgeClasses(statsData.data?.age_classes || [])
      } catch (err) {
        console.error('Error fetching tournament data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tournamentSlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <TournamentTabs
      tournamentSlug={tournamentSlug}
      sportSlug={sportSlug}
      matches={initialMatches}
      standings={standings}
      stats={stats}
      ageClasses={ageClasses}
    />
  )
}