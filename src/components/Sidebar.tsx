import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  Sigma,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderKanban, label: 'Dự án', href: '/projects' },
  { icon: Database, label: 'Dữ liệu', href: '/data' },
  { icon: Sigma, label: 'Phân tích', href: '/analysis' },
  { icon: BarChart3, label: 'Trực quan', href: '/charts' },
  { icon: FileText, label: 'Báo cáo', href: '/reports' },
  { icon: Settings, label: 'Cài đặt', href: '/#settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'h-screen bg-primary-900 flex flex-col transition-all duration-300 sticky top-0 left-0',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
          <img src="/logo-white.svg" alt="Logo" className="w-8 h-8 flex-shrink-0" />
          {!collapsed && (
            <span className="text-heading-sm font-bold text-white whitespace-nowrap">
              TKKH
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = location.pathname === href
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex items-center gap-3 h-11 rounded-lg transition-all duration-150',
                collapsed ? 'justify-center px-0' : 'px-4',
                isActive
                  ? 'bg-white/[0.12] text-white border-l-[3px] border-primary-500'
                  : 'text-white/65 hover:bg-white/[0.08] border-l-[3px] border-transparent hover:text-white'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full h-10 rounded-lg text-white/65 hover:bg-white/[0.08] hover:text-white transition-all duration-150"
          aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  )
}
