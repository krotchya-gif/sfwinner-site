import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Edit, Trash2, Award, ChevronRight, Shield } from 'lucide-react'
import { DeletePlayerButton } from '@/components/DeletePlayerButton'
import { PromoteButton } from '@/components/PromoteButton'

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user's team with role
  const { data: userData } = await supabase
    .from('users')
    .select('team_id, role')
    .eq('id', user.id)
    .single()

  const teamId = userData?.team_id

  // Get player with full info
  const { data: player } = teamId
    ? await supabase
        .from('players')
        .select(`
          *,
          age_class:age_classes (name),
          team:teams (name, created_by),
          achievements (id, tournament_name, award, date)
        `)
        .eq('id', id)
        .eq('team_id', teamId)
        .single()
    : { data: null }

  if (!player) notFound()

  // Access check
  const ud = userData as any
  if ((player as any).team?.created_by !== user.id && ud?.role !== 'super_admin') {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold text-dark">Access Denied</h1>
        <p className="text-gray-500 mt-2">You don't have permission to view this player.</p>
        <Link href="/players" className="text-primary hover:underline mt-4 inline-block">
          Back to Players
        </Link>
      </div>
    )
  }

  const playerData = player as any
  const isOwner = (playerData as any).team?.created_by === user.id || ud?.role === 'super_admin'

  const statusStyles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    promoted: 'bg-blue-100 text-blue-800',
    graduated: 'bg-gray-100 text-gray-800',
    inactive: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/players" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark font-heading">{playerData.display_name}</h1>
          <p className="text-gray-500 mt-1">
            {playerData.age_class?.name || 'No age class'} • {playerData.position || 'No position'}
          </p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <PromoteButton playerId={playerData.id} currentAgeClass={playerData.age_class?.name} />
            <Link
              href={`/players/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <DeletePlayerButton playerId={playerData.id} playerName={playerData.display_name} />
          </div>
        )}
      </div>

      {/* Status + Jersey */}
      <div className="flex flex-wrap items-center gap-4">
        {playerData.jersey_number && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-500">Jersey Number</p>
            <p className="text-3xl font-bold text-primary">#{playerData.jersey_number}</p>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
          <p className="text-sm text-gray-500">Status</p>
          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusStyles[playerData.status] || statusStyles.active}`}>
            {playerData.status || 'active'}
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
          <p className="text-sm text-gray-500">Age Class</p>
          <p className="text-lg font-semibold text-dark">{playerData.age_class?.name || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Public Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-dark font-heading">Public Information</h2>
            <span className="text-xs text-gray-400 ml-auto">Visible to all</span>
          </div>

          {playerData.photo_url && (
            <div className="mb-4">
              <img
                src={playerData.photo_url}
                alt={playerData.display_name}
                className="w-32 h-32 rounded-xl object-cover"
              />
            </div>
          )}

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Display Name</dt>
              <dd className="font-medium text-dark">{playerData.display_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Position</dt>
              <dd className="font-medium text-dark">{playerData.position || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Private Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-dark font-heading">Private Information</h2>
            <span className="text-xs text-gray-400 ml-auto">Team managers only</span>
          </div>

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Full Name</dt>
              <dd className="font-medium text-dark">{playerData.full_name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">NISN</dt>
              <dd className="font-medium text-dark">{playerData.nisn || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date of Birth</dt>
              <dd className="font-medium text-dark">
                {playerData.date_of_birth
                  ? new Date(playerData.date_of_birth).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Parent/Guardian</dt>
              <dd className="font-medium text-dark">{playerData.parent_name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Parent Phone</dt>
              <dd className="font-medium text-dark">{playerData.parent_phone || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Medical Info</dt>
              <dd className="font-medium text-dark">{playerData.medical_info || '—'}</dd>
            </div>
            <div className="pt-2 border-t">
              <dt className="text-gray-500 mb-1">Address</dt>
              <dd className="font-medium text-dark text-sm">{playerData.address || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-dark font-heading">Achievements</h2>
          </div>
          <Link
            href={`/players/${id}/achievements/add`}
            className="text-sm text-primary hover:underline"
          >
            + Add Achievement
          </Link>
        </div>

        {playerData.achievements && playerData.achievements.length > 0 ? (
          <div className="space-y-3">
            {playerData.achievements.map((ach: any) => (
              <div key={ach.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-dark">{ach.award || 'Achievement'}</p>
                  <p className="text-sm text-gray-500">{ach.tournament_name}</p>
                </div>
                <span className="text-sm text-gray-400">
                  {ach.date
                    ? new Date(ach.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No achievements yet.</p>
        )}
      </div>
    </div>
  )
}