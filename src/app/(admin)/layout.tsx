'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Flag,
  FileSpreadsheet,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const adminNav = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Teams', href: '/admin/teams', icon: Flag },
  { name: 'Players', href: '/admin/players', icon: Users },
  { name: 'Sports', href: '/admin/sports', icon: Shield },
  { name: 'Tournaments', href: '/admin/tournaments', icon: Calendar },
  { name: 'Reports', href: '/admin/reports', icon: FileSpreadsheet },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      // Check if super_admin
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single() as any

      if (!userData || userData.role !== 'super_admin') {
        router.push('/dashboard')
        return
      }

      setUser(authUser)
      setRole(userData.role)
      setLoading(false)
    }

    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-dark text-white transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-4 lg:hidden border-b border-white/10">
            <span className="font-bold text-white">Admin Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Logo */}
          <div className="px-6 py-6 border-b border-white/10 hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold font-heading">Admin Panel</h1>
                <p className="text-xs text-gray-400">SF Winner</p>
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div className="px-6 py-3 border-b border-white/10">
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
              <Shield className="w-3 h-3" />
              Super Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {adminNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
                    ${isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User + Logout */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="bg-dark text-white lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-white">Admin Panel</span>
            <div className="w-10" />
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}