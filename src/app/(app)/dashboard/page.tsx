import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Users, Calendar, Award, TrendingUp, Plus, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user with team info
  const { data: userData } = await supabase
    .from('users')
    .select(`
      id, name, role,
      team:teams (
        id, name, slug, branch_location,
        sport:sports (name, slug)
      )
    `)
    .eq('id', user.id)
    .single() as any

  if (!userData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User data not found.</p>
      </div>
    )
  }

  const team = userData.team as any
  const sport = team?.sport as any

  // Get player count
  const { count: totalPlayers } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team?.id)
    .eq('status', 'active')

  // Get age class breakdown
  const { data: ageClassStats } = await supabase
    .from('age_classes')
    .select(`
      id, name,
      players:players (id)
    `)
    .eq('team_id', team?.id) as any

  const ageClassBreakdown = ageClassStats?.map((ac: any) => ({
    name: ac.name,
    count: ac.players?.length || 0
  })) || []

  // Get player IDs first
  const { data: playerIds } = await supabase
    .from('players')
    .select('id')
    .eq('team_id', team?.id)

  const recentAchievements = playerIds && playerIds.length > 0
    ? await supabase
        .from('achievements')
        .select(`
          id, tournament_name, award, date,
          player:players (display_name)
        `)
        .in('player_id', playerIds.map((p: any) => p.id))
        .order('date', { ascending: false })
        .limit(5)
    : { data: [] }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">
            Welcome{userData.name ? `, ${userData.name}` : ''}
          </h1>
          <p className="text-gray-500 mt-1">
            {team ? `${team.name} - ${sport?.name || 'No sport'}` : 'No team assigned'}
            {team?.branch_location && ` • ${team.branch_location}`}
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Players"
          value={totalPlayers || 0}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Calendar}
          label="Age Classes"
          value={ageClassBreakdown.length}
          color="text-blue-600"
          bgColor="bg-blue-600/10"
        />
        <StatCard
          icon={Award}
          label="Achievements"
          value={recentAchievements?.data?.length || 0}
          subtitle="recent"
          color="text-yellow-600"
          bgColor="bg-yellow-600/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Sport"
          value={sport?.name || '—'}
          color="text-purple-600"
          bgColor="bg-purple-600/10"
        />
      </div>

      {/* Age class breakdown */}
      {ageClassBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-dark font-heading mb-4">
            Players by Age Class
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ageClassBreakdown.map((ac: { name: string; count: number }) => (
              <div key={ac.name} className="bg-light rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{ac.count}</p>
                <p className="text-sm text-gray-500 mt-1">{ac.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No team message */}
      {!team && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800">
            No team assigned to your account. Please contact super admin.
          </p>
        </div>
      )}

      {/* Recent achievements */}
      {recentAchievements?.data && recentAchievements.data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-dark font-heading mb-4">
            Recent Achievements
          </h2>
          <div className="space-y-3">
            {recentAchievements.data.map((ach: any) => (
              <div key={ach.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-dark">{ach.award || 'Achievement'}</p>
                  <p className="text-sm text-gray-500">
                    {ach.player?.display_name} • {ach.tournament_name}
                  </p>
                </div>
                <span className="text-sm text-gray-400">
                  {ach.date ? new Date(ach.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'No date'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {team && (
        <UpcomingMatchesWidget teamId={team.id} />
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  bgColor,
}: {
  icon: any
  label: string
  value: string | number
  subtitle?: string
  color: string
  bgColor: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-dark">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}