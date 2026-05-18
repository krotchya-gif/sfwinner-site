'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AgeClass {
  id: string
  name: string
}

export default function AddPlayerPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [sportSlug, setSportSlug] = useState<string>('')
  const [ageClasses, setAgeClasses] = useState<AgeClass[]>([])
  const [formData, setFormData] = useState({
    display_name: '',
    photo_url: '',
    jersey_number: '',
    position: '',
    full_name: '',
    nisn: '',
    date_of_birth: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    medical_info: '',
    age_class_id: '',
  })

  const router = useRouter()
  const supabase = createClient()

  // Get user and team info
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: userData } = await supabase
        .from('users')
        .select('team_id, teams:sport_id (slug)')
        .eq('id', user.id)
        .single()

      if (userData?.team_id) {
        setTeamId(userData.team_id)

        // Get sport slug
        const sportSlug = (userData as any)?.teams?.slug || 'futsal'
        setSportSlug(sportSlug)

        // Get age classes
        const { data: acData } = await supabase
          .from('age_classes')
          .select('id, name')
          .eq('team_id', userData.team_id)
          .order('name')

        setAgeClasses(acData || [])
      }
    }
    getUser()
  }, [])

  const positions = sportSlug === 'futsal'
    ? ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
    : sportSlug === 'basket'
    ? ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center']
    : []

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamId || !user) return

    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('players').insert({
      team_id: teamId,
      sport_id: (user as any).sport_id, // will be set via trigger or join table
      ...formData,
      jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/players')
    router.refresh()
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/players"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark font-heading">Add Player</h1>
          <p className="text-gray-500 mt-1">Add a new player to your team</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {/* Public Info */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-dark font-heading mb-4">Public Information</h2>
          <p className="text-sm text-gray-500 mb-6">
            This information will be visible on the public team page.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Rafi Ahmad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Class
              </label>
              <select
                name="age_class_id"
                value={formData.age_class_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Select age class</option>
                {ageClasses.map(ac => (
                  <option key={ac.id} value={ac.id}>{ac.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jersey Number
              </label>
              <input
                type="number"
                name="jersey_number"
                value={formData.jersey_number}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="10"
                min="1"
                max="99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Select position</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo URL
              </label>
              <input
                type="url"
                name="photo_url"
                value={formData.photo_url}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
        </div>

        {/* Private Info */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-dark font-heading mb-2">Private Information</h2>
          <p className="text-sm text-gray-500 mb-6">
            This information is only visible to team managers and admins.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Rafi Ahmad Wijaya"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NISN
              </label>
              <input
                type="text"
                name="nisn"
                value={formData.nisn}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="0012345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian Name
              </label>
              <input
                type="text"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ahmad Wijaya"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian Phone
              </label>
              <input
                type="tel"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="081234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Info
              </label>
              <input
                type="text"
                name="medical_info"
                value={formData.medical_info}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="No known allergies"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                placeholder="Jl. Merdeka No. 123, Jakarta"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="p-6 flex items-center justify-end gap-4">
          <Link
            href="/players"
            className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Saving...' : 'Save Player'}
          </button>
        </div>
      </form>
    </div>
  )
}