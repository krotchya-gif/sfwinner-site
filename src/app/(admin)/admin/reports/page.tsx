'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, FileSpreadsheet, Download, Users, Flag, Target } from 'lucide-react'

type ExportType = 'players' | 'teams' | 'matches' | 'tournaments'

export default function AdminReportsPage() {
  const [exportType, setExportType] = useState<ExportType>('players')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleExport = async () => {
    setLoading(true)
    setError('')

    try {
      let data: any[] = []
      let filename = ''

      if (exportType === 'players') {
        const { data: players } = await supabase
          .from('players')
          .select('display_name, jersey_number, position, status, created_at, teams(name, sports(name)), age_classes(name)')
        data = players || []
        filename = 'sfwinner-players.csv'

        // Convert to CSV-friendly format
        const rows = data.map(p => ({
          display_name: p.display_name,
          jersey_number: p.jersey_number || '',
          position: p.position || '',
          status: p.status,
          team: p.teams?.name || '',
          sport: p.teams?.sports?.name || '',
          age_class: p.age_classes?.name || '',
          created_at: p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '',
        }))
        downloadCSV([
          ['Display Name', 'Jersey', 'Position', 'Status', 'Team', 'Sport', 'Age Class', 'Joined'],
          ...rows.map(r => [r.display_name, r.jersey_number, r.position, r.status, r.team, r.sport, r.age_class, r.created_at])
        ], filename)

      } else if (exportType === 'teams') {
        const { data: teams } = await supabase
          .from('teams')
          .select('name, slug, branch_location, created_at, sports(name)')
        data = teams || []
        filename = 'sfwinner-teams.csv'

        const rows = data.map(t => ({
          name: t.name,
          slug: t.slug,
          sport: t.sports?.name || '',
          branch: t.branch_location || '',
          created: t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '',
        }))
        downloadCSV([
          ['Team Name', 'Slug', 'Sport', 'Branch', 'Created'],
          ...rows.map(r => [r.name, r.slug, r.sport, r.branch, r.created])
        ], filename)

      } else if (exportType === 'matches') {
        const { data: matches } = await supabase
          .from('matches')
          .select('match_date, score_home, score_away, venue, status, teams_home(name), teams_away(name), tournaments(name)')
        data = matches || []
        filename = 'sfwinner-matches.csv'

        const rows = data.map(m => ({
          date: m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID') : '',
          home_team: m.teams_home?.name || '',
          away_team: m.teams_away?.name || '',
          score: `${m.score_home} - ${m.score_away}`,
          venue: m.venue || '',
          tournament: m.tournaments?.name || '',
          status: m.status,
        }))
        downloadCSV([
          ['Date', 'Home Team', 'Away Team', 'Score', 'Venue', 'Tournament', 'Status'],
          ...rows.map(r => [r.date, r.home_team, r.away_team, r.score, r.venue, r.tournament, r.status])
        ], filename)

      } else if (exportType === 'tournaments') {
        const { data: tournaments } = await supabase
          .from('tournaments')
          .select('name, slug, description, location, start_date, end_date, sports(name)')
        data = tournaments || []
        filename = 'sfwinner-tournaments.csv'

        const rows = data.map(t => ({
          name: t.name,
          sport: t.sports?.name || '',
          description: t.description || '',
          location: t.location || '',
          start: t.start_date ? new Date(t.start_date).toLocaleDateString('id-ID') : '',
          end: t.end_date ? new Date(t.end_date).toLocaleDateString('id-ID') : '',
        }))
        downloadCSV([
          ['Tournament Name', 'Sport', 'Description', 'Location', 'Start Date', 'End Date'],
          ...rows.map(r => [r.name, r.sport, r.description, r.location, r.start, r.end])
        ], filename)
      }

    } catch (err: any) {
      setError('Export failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = (rows: string[][], filename: string) => {
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportOptions = [
    { key: 'players', label: 'Players', icon: Users, desc: 'All players across all teams with sport and age class info' },
    { key: 'teams', label: 'Teams', icon: Flag, desc: 'All teams with sport and branch location' },
    { key: 'matches', label: 'Matches', icon: Target, desc: 'All match results with scores and tournament info' },
    { key: 'tournaments', label: 'Tournaments', icon: FileSpreadsheet, desc: 'All tournaments with dates and locations' },
  ] as const

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-dark font-heading">Reports & Export</h1>
        <p className="text-gray-500 mt-1">Export SF Winner data as CSV files</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-dark font-heading mb-4">Select Export Type</h2>
        <div className="space-y-3">
          {exportOptions.map((opt) => (
            <label
              key={opt.key}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                exportType === opt.key
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="exportType"
                value={opt.key}
                checked={exportType === opt.key}
                onChange={() => setExportType(opt.key)}
                className="sr-only"
              />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                exportType === opt.key ? 'bg-primary/10' : 'bg-gray-100'
              }`}>
                <opt.icon className={`w-6 h-6 ${exportType === opt.key ? 'text-primary' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-dark">{opt.label}</p>
                <p className="text-sm text-gray-500">{opt.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                exportType === opt.key ? 'border-primary bg-primary' : 'border-gray-300'
              }`}>
                {exportType === opt.key && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-8 rounded-xl transition disabled:opacity-50 w-full justify-center"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {loading ? 'Exporting...' : `Export ${exportOptions.find(o => o.key === exportType)?.label} as CSV`}
      </button>
    </div>
  )
}