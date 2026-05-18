import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Plus, Search, Edit } from 'lucide-react'

export default async function PlayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's team
  const { data: userData } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single() as any

  const teamId = userData?.team_id

  // Get all age classes for this team
  const { data: ageClasses } = teamId
    ? await supabase
        .from('age_classes')
        .select('id, name')
        .eq('team_id', teamId)
        .order('name')
    : { data: [] }

  // Get players with age class info
  const { data: players } = teamId
    ? await supabase
        .from('players')
        .select(`
          id, display_name, photo_url, jersey_number, position, status,
          age_class:age_classes (id, name)
        `)
        .eq('team_id', teamId)
        .order('display_name')
    : { data: [] }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Players</h1>
          <p className="text-gray-500 mt-1">
            {players?.length || 0} player{players?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/players/add"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Player
        </Link>
      </div>

      {/* No team */}
      {!teamId ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800">
            No team assigned. Please contact super admin to assign a team.
          </p>
        </div>
      ) : players?.length === 0 ? (
        /* No players yet */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">No players yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first player to the team.</p>
          <Link
            href="/players/add"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add First Player
          </Link>
        </div>
      ) : (
        /* Players table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Player</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Age Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Jersey #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-dark">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {players?.map((player: any) => (
                  <tr key={player.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt={player.display_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {player.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-dark">{player.display_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{(player.age_class as any)?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{player.position || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {player.jersey_number ? `#${player.jersey_number}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={player.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/players/${player.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="View / Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    promoted: 'bg-blue-100 text-blue-800',
    graduated: 'bg-gray-100 text-gray-800',
    inactive: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.inactive}`}>
      {status || 'active'}
    </span>
  )
}