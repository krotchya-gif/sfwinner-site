'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Calendar, MapPin, ChevronRight } from 'lucide-react'

interface Tournament {
  id: string
  name: string
  slug: string
  description: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  sports?: { name: string; slug: string }
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('*, sports(*)')
      .order('start_date', { ascending: false })
    setTournaments(data || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark font-heading">Tournaments</h1>
        <p className="text-gray-500 mt-1">{tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}</p>
      </div>

      {tournaments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No tournaments yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tournament</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sport</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tournaments.map((t) => {
                const sportSlug = t.sports?.slug || 'futsal'
                const sportColor = sportSlug === 'basket' ? 'text-orange-500'
                  : sportSlug === 'renang' ? 'text-cyan-500'
                  : 'text-primary'

                return (
                  <tr key={t.id} className="hover:bg-light transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-dark">{t.name}</p>
                          {t.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{t.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${sportColor}`}>{t.sports?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {t.location ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {t.location}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {t.start_date ? (
                        <span className="text-sm text-gray-600">
                          {new Date(t.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {t.end_date && ` — ${new Date(t.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://${sportSlug === 'renang' ? 'renang' : sportSlug === 'basket' ? 'basketball' : 'futsal'}.sfwinner.site/tournament/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}