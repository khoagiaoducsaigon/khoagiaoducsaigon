import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  TrendingUp,
  CreditCard,
  Search,
  Eye,
  Pencil,
  Lock,
  LockOpen,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Calendar,
  Shield,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import AppLayout from '@/components/AppLayout'

/* ─────────────── Types ─────────────── */

interface MockUser {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro' | 'enterprise'
  role: 'user' | 'admin'
  status: 'active' | 'blocked' | 'pending'
  analysesCount: number
  registeredAt: string
  lastActive: string
  organization: string
  phone: string
}

interface Transaction {
  id: string
  userName: string
  userEmail: string
  plan: string
  amount: number
  paymentMethod: 'MoMo' | 'ZaloPay' | 'Bank'
  status: 'success' | 'pending' | 'failed'
  date: string
}

/* ─────────────── Mock Data ─────────────── */

const mockUsers: MockUser[] = [
  { id: 'U001', name: 'Nguyễn Văn An', email: 'an.nguyen@hust.edu.vn', plan: 'pro', role: 'user', status: 'active', analysesCount: 24, registeredAt: '2024-01-15', lastActive: '2 giờ trước', organization: 'ĐH Bách Khoa HN', phone: '0901234567' },
  { id: 'U002', name: 'Trần Thị Bích', email: 'bich.tran@vnu.edu.vn', plan: 'free', role: 'user', status: 'active', analysesCount: 8, registeredAt: '2024-02-20', lastActive: '5 phút trước', organization: 'ĐH Quốc gia HN', phone: '0912345678' },
  { id: 'U003', name: 'Lê Hoàng Nam', email: 'nam.lh@uel.edu.vn', plan: 'enterprise', role: 'admin', status: 'active', analysesCount: 156, registeredAt: '2023-08-10', lastActive: '1 phút trước', organization: 'ĐH Kinh tế TP.HCM', phone: '0923456789' },
  { id: 'U004', name: 'Phạm Minh Tuấn', email: 'tuan.pm@hcmus.edu.vn', plan: 'pro', role: 'user', status: 'active', analysesCount: 42, registeredAt: '2024-03-05', lastActive: '30 phút trước', organization: 'ĐH Khoa học Tự nhiên', phone: '0934567890' },
  { id: 'U005', name: 'Hoàng Thị Lan', email: 'lan.ht@ftu.edu.vn', plan: 'free', role: 'user', status: 'pending', analysesCount: 0, registeredAt: '2025-01-10', lastActive: 'Chưa hoạt động', organization: 'ĐH Ngoại thương', phone: '0945678901' },
  { id: 'U006', name: 'Vũ Đức Thịnh', email: 'thinh.vd@neu.edu.vn', plan: 'pro', role: 'user', status: 'active', analysesCount: 67, registeredAt: '2023-11-22', lastActive: '3 giờ trước', organization: 'ĐH Kinh tế Quốc dân', phone: '0956789012' },
  { id: 'U007', name: 'Đặng Thị Hoa', email: 'hoa.dt@hueuni.edu.vn', plan: 'free', role: 'user', status: 'blocked', analysesCount: 3, registeredAt: '2024-06-01', lastActive: '15 ngày trước', organization: 'ĐH Huế', phone: '0967890123' },
  { id: 'U008', name: 'Bùi Văn Hùng', email: 'hung.bv@tnu.edu.vn', plan: 'enterprise', role: 'user', status: 'active', analysesCount: 89, registeredAt: '2023-09-18', lastActive: '1 giờ trước', organization: 'ĐH Thái Nguyên', phone: '0978901234' },
  { id: 'U009', name: 'Ngô Thị Mai', email: 'mai.nt@hcmiu.edu.vn', plan: 'pro', role: 'user', status: 'active', analysesCount: 35, registeredAt: '2024-04-12', lastActive: '6 giờ trước', organization: 'ĐH Quốc tế TP.HCM', phone: '0989012345' },
  { id: 'U010', name: 'Dương Văn Phúc', email: 'phuc.dv@ulsa.edu.vn', plan: 'free', role: 'user', status: 'active', analysesCount: 12, registeredAt: '2024-07-25', lastActive: '2 ngày trước', organization: 'ĐH Lao động Xã hội', phone: '0990123456' },
  { id: 'U011', name: 'Lý Thị Thu', email: 'thu.lt@agu.edu.vn', plan: 'pro', role: 'user', status: 'active', analysesCount: 51, registeredAt: '2024-05-08', lastActive: '4 giờ trước', organization: 'ĐH An Giang', phone: '0902233445' },
  { id: 'U012', name: 'Trịnh Văn Sơn', email: 'son.tv@qnu.edu.vn', plan: 'free', role: 'user', status: 'pending', analysesCount: 0, registeredAt: '2025-01-05', lastActive: 'Chưa hoạt động', organization: 'ĐH Quy Nhơn', phone: '0913344556' },
  { id: 'U013', name: 'Phan Thị Kim', email: 'kim.pt@ctu.edu.vn', plan: 'enterprise', role: 'admin', status: 'active', analysesCount: 112, registeredAt: '2023-06-14', lastActive: '30 phút trước', organization: 'ĐH Cần Thơ', phone: '0924455667' },
  { id: 'U014', name: 'Tô Văn Đạt', email: 'dat.tv@tlu.edu.vn', plan: 'pro', role: 'user', status: 'active', analysesCount: 28, registeredAt: '2024-08-19', lastActive: '12 giờ trước', organization: 'ĐH Thủy lợi', phone: '0935566778' },
  { id: 'U015', name: 'Hồ Thị Linh', email: 'linh.ht@haui.edu.vn', plan: 'free', role: 'user', status: 'blocked', analysesCount: 5, registeredAt: '2024-09-30', lastActive: '20 ngày trước', organization: 'ĐH Công nghiệp HN', phone: '0946677889' },
  { id: 'U016', name: 'Lương Văn Tài', email: 'tai.lv@utehy.edu.vn', plan: 'pro', role: 'user', status: 'active', analysesCount: 73, registeredAt: '2023-12-03', lastActive: '1 giờ trước', organization: 'ĐH Sư phạm Kỹ thuật Hưng Yên', phone: '0957788990' },
  { id: 'U017', name: 'Mai Thị Hồng', email: 'hong.mt@ptit.edu.vn', plan: 'pro', role: 'user', status: 'active', analysesCount: 38, registeredAt: '2024-02-14', lastActive: '7 giờ trước', organization: 'Học viện Bưu chính Viễn thông', phone: '0968899001' },
  { id: 'U018', name: 'Tống Văn Khánh', email: 'khanh.tv@utt.edu.vn', plan: 'free', role: 'user', status: 'active', analysesCount: 15, registeredAt: '2024-10-22', lastActive: '3 ngày trước', organization: 'ĐH Công nghệ Giao thông Vận tải', phone: '0979900112' },
]

const mockTransactions: Transaction[] = [
  { id: 'TRX-001', userName: 'Nguyễn Văn An', userEmail: 'an.nguyen@hust.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'MoMo', status: 'success', date: '2025-01-15' },
  { id: 'TRX-002', userName: 'Lê Hoàng Nam', userEmail: 'nam.lh@uel.edu.vn', plan: 'Doanh nghiệp', amount: 499000, paymentMethod: 'Bank', status: 'success', date: '2025-01-14' },
  { id: 'TRX-003', userName: 'Phạm Minh Tuấn', userEmail: 'tuan.pm@hcmus.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'ZaloPay', status: 'success', date: '2025-01-14' },
  { id: 'TRX-004', userName: 'Vũ Đức Thịnh', userEmail: 'thinh.vd@neu.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'MoMo', status: 'success', date: '2025-01-13' },
  { id: 'TRX-005', userName: 'Bùi Văn Hùng', userEmail: 'hung.bv@tnu.edu.vn', plan: 'Doanh nghiệp', amount: 499000, paymentMethod: 'Bank', status: 'success', date: '2025-01-12' },
  { id: 'TRX-006', userName: 'Ngô Thị Mai', userEmail: 'mai.nt@hcmiu.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'ZaloPay', status: 'pending', date: '2025-01-12' },
  { id: 'TRX-007', userName: 'Lý Thị Thu', userEmail: 'thu.lt@agu.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'MoMo', status: 'success', date: '2025-01-11' },
  { id: 'TRX-008', userName: 'Phan Thị Kim', userEmail: 'kim.pt@ctu.edu.vn', plan: 'Doanh nghiệp', amount: 499000, paymentMethod: 'Bank', status: 'success', date: '2025-01-10' },
  { id: 'TRX-009', userName: 'Tô Văn Đạt', userEmail: 'dat.tv@tlu.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'MoMo', status: 'failed', date: '2025-01-10' },
  { id: 'TRX-010', userName: 'Lương Văn Tài', userEmail: 'tai.lv@utehy.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'ZaloPay', status: 'success', date: '2025-01-09' },
  { id: 'TRX-011', userName: 'Mai Thị Hồng', userEmail: 'hong.mt@ptit.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'MoMo', status: 'success', date: '2025-01-08' },
  { id: 'TRX-012', userName: 'Nguyễn Văn An', userEmail: 'an.nguyen@hust.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'Bank', status: 'success', date: '2024-12-15' },
  { id: 'TRX-013', userName: 'Trần Thị Bích', userEmail: 'bich.tran@vnu.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'MoMo', status: 'success', date: '2024-12-10' },
  { id: 'TRX-014', userName: 'Bùi Văn Hùng', userEmail: 'hung.bv@tnu.edu.vn', plan: 'Doanh nghiệp', amount: 499000, paymentMethod: 'ZaloPay', status: 'success', date: '2024-12-05' },
  { id: 'TRX-015', userName: 'Hồ Thị Linh', userEmail: 'linh.ht@haui.edu.vn', plan: 'Chuyên nghiệp', amount: 199000, paymentMethod: 'Bank', status: 'failed', date: '2024-11-28' },
]

const areaChartData = [
  { month: 'Th8', users: 1800, newUsers: 120 },
  { month: 'Th9', users: 1950, newUsers: 150 },
  { month: 'Th10', users: 2150, newUsers: 200 },
  { month: 'Th11', users: 2420, newUsers: 270 },
  { month: 'Th12', users: 2680, newUsers: 260 },
  { month: 'Th1', users: 2847, newUsers: 167 },
]

const donutData = [
  { name: 'Miễn phí', value: 1936, percentage: 68, color: '#E5E7EB' },
  { name: 'Chuyên nghiệp', value: 712, percentage: 25, color: '#1B5F99' },
  { name: 'Doanh nghiệp', value: 199, percentage: 7, color: '#E8723A' },
]

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ─────────────── Helpers ─────────────── */

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

function planBadge(plan: string) {
  const map: Record<string, { label: string; className: string }> = {
    free: { label: 'Miễn phí', className: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100' },
    pro: { label: 'Chuyên nghiệp', className: 'bg-[#E8F5FC] text-[#1B5F99] hover:bg-[#E8F5FC]' },
    enterprise: { label: 'Doanh nghiệp', className: 'bg-[#FFF0E8] text-[#E8723A] hover:bg-[#FFF0E8]' },
  }
  const m = map[plan] || map.free
  return <Badge variant="outline" className={m.className}>{m.label}</Badge>
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Hoạt động', className: 'bg-[#E6F7F5] text-[#2A9D8F] hover:bg-[#E6F7F5]' },
    blocked: { label: 'Bị khóa', className: 'bg-[#FEF2F2] text-[#E76F51] hover:bg-[#FEF2F2]' },
    pending: { label: 'Chờ xác nhận', className: 'bg-[#FFF8ED] text-[#F4A261] hover:bg-[#FFF8ED]' },
  }
  const m = map[status] || map.active
  return <Badge variant="outline" className={m.className}>{m.label}</Badge>
}

function txStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    success: { label: 'Thành công', className: 'bg-[#E6F7F5] text-[#2A9D8F] hover:bg-[#E6F7F5]' },
    pending: { label: 'Đang xử lý', className: 'bg-[#FFF8ED] text-[#F4A261] hover:bg-[#FFF8ED]' },
    failed: { label: 'Thất bại', className: 'bg-[#FEF2F2] text-[#E76F51] hover:bg-[#FEF2F2]' },
  }
  const m = map[status] || map.pending
  return <Badge variant="outline" className={m.className}>{m.label}</Badge>
}

function paymentIcon(method: string) {
  const colors: Record<string, string> = { MoMo: '#D82D8B', ZaloPay: '#0068FF', Bank: '#2A9D8F' }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[method] || '#6B7280' }} />
      <span className="text-sm text-[#374151]">{method}</span>
    </span>
  )
}

/* ─────────────── KPI Card ─────────────── */

function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  changeColor,
  borderColor,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  change: string
  changeColor: string
  borderColor: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: easeOutExpo }}
    >
      <Card className="border border-[#E5E7EB] shadow-card hover:shadow-card-hover transition-shadow duration-200" style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F5FC] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#1B5F99]" />
            </div>
          </div>
          <p className="text-data-lg text-[#111827] mb-0.5">{value}</p>
          <p className="text-body-sm text-[#6B7280] mb-1">{label}</p>
          <p className="text-xs font-medium" style={{ color: changeColor }}>{change}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─────────────── User Detail Sheet ─────────────── */

function UserDetailSheet({ user, open, onClose }: { user: MockUser | null; open: boolean; onClose: () => void }) {
  if (!user) return null
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-heading-lg text-[#0C2D57]">Chi tiết ngườ i dùng</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F5FC] flex items-center justify-center text-xl font-bold text-[#1B5F99]">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-heading-sm font-semibold text-[#111827]">{user.name}</h3>
              <p className="text-body-sm text-[#6B7280]">{user.email}</p>
              <div className="flex gap-2 mt-1.5">
                {planBadge(user.plan)}
                <Badge variant="outline" className={user.role === 'admin' ? 'bg-[#FFF0E8] text-[#E8723A]' : 'bg-neutral-100 text-neutral-600'}>
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#6B7280]" />
              <div>
                <p className="text-xs text-[#6B7280]">Tổ chức</p>
                <p className="text-sm text-[#111827] font-medium">{user.organization}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#6B7280]" />
              <div>
                <p className="text-xs text-[#6B7280]">Email</p>
                <p className="text-sm text-[#111827] font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6B7280]" />
              <div>
                <p className="text-xs text-[#6B7280]">Ngày đăng ký</p>
                <p className="text-sm text-[#111827] font-medium">{user.registeredAt}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#6B7280]" />
              <div>
                <p className="text-xs text-[#6B7280]">Trạng thái</p>
                <div className="mt-0.5">{statusBadge(user.status)}</div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-heading-sm font-semibold text-[#0C2D57] mb-3">Thống kê</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F9FAFB] rounded-lg p-3 text-center">
                <p className="text-data-md text-[#1B5F99] font-semibold">{user.analysesCount}</p>
                <p className="text-xs text-[#6B7280]">Phân tích</p>
              </div>
              <div className="bg-[#F9FAFB] rounded-lg p-3 text-center">
                <p className="text-data-md text-[#2A9D8F] font-semibold">{user.lastActive}</p>
                <p className="text-xs text-[#6B7280]">Hoạt động cuối</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─────────────── Main Admin Page ─────────────── */

export default function Admin() {
  const navigate = useNavigate()

  /* Admin guard */
  useEffect(() => {
    const raw = localStorage.getItem('auth_user')
    const user = raw ? JSON.parse(raw) : null
    if (!user || user.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang quản trị')
      navigate('/dashboard')
    }
  }, [navigate])

  /* Users state */
  const [users, setUsers] = useState(mockUsers)
  const [userSearch, setUserSearch] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('all')
  const [userPlanFilter, setUserPlanFilter] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  /* Transactions state */
  const [txSearch, setTxSearch] = useState('')
  const [txStatusFilter, setTxStatusFilter] = useState('all')
  const [txPage, setTxPage] = useState(1)

  const userPageSize = 8
  const txPageSize = 7

  /* Filtered users */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !userSearch ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter
      const matchPlan = userPlanFilter === 'all' || u.plan === userPlanFilter
      return matchSearch && matchStatus && matchPlan
    })
  }, [users, userSearch, userStatusFilter, userPlanFilter])

  const userTotalPages = Math.ceil(filteredUsers.length / userPageSize)
  const pagedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize)

  /* Filtered transactions */
  const filteredTx = useMemo(() => {
    return mockTransactions.filter((t) => {
      const matchSearch =
        !txSearch ||
        t.userName.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(txSearch.toLowerCase())
      const matchStatus = txStatusFilter === 'all' || t.status === txStatusFilter
      return matchSearch && matchStatus
    })
  }, [txSearch, txStatusFilter])

  const txTotalPages = Math.ceil(filteredTx.length / txPageSize)
  const pagedTx = filteredTx.slice((txPage - 1) * txPageSize, txPage * txPageSize)

  const toggleBlock = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'blocked' ? 'active' : 'blocked' } : u
      )
    )
    const u = users.find((x) => x.id === id)
    if (u) {
      toast.success(u.status === 'blocked' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
        >
          <h1 className="text-heading-xl text-[#0C2D57]">Bảng điều khiển quản trị</h1>
          <p className="text-body-md text-[#6B7280] mt-1">Quản lý ngườ i dùng, gói dịch vụ và doanh thu</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <KpiCard icon={Users} label="tổng ngườ i dùng" value="2,847" change="+124 tuần này" changeColor="#2A9D8F" borderColor="#1B5F99" delay={0} />
          <KpiCard icon={UserPlus} label="đăng ký tháng này" value="156" change="+23% so với tháng trước" changeColor="#2A9D8F" borderColor="#2A9D8F" delay={0.06} />
          <KpiCard icon={TrendingUp} label="doanh thu tháng này" value="45.2Mđ" change="+12% so với tháng trước" changeColor="#2A9D8F" borderColor="#E8723A" delay={0.12} />
          <KpiCard icon={CreditCard} label="gói Chuyên nghiệp" value="712" change="+8% so với tháng trước" changeColor="#2A9D8F" borderColor="#8B5CF6" delay={0.18} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: easeOutExpo }}
          >
            <Card className="border border-[#E5E7EB] shadow-card">
              <CardContent className="p-5">
                <h3 className="text-heading-lg font-semibold text-[#0C2D57] mb-1">Tăng trưởng ngườ i dùng</h3>
                <p className="text-body-sm text-[#6B7280] mb-4">6 tháng gần đây</p>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={areaChartData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B5F99" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1B5F99" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === 'users' ? 'Tổng ngườ i dùng' : 'Ngườ i dùng mới',
                      ]}
                    />
                    <Area type="monotone" dataKey="users" stroke="#1B5F99" strokeWidth={2} fill="url(#colorUsers)" name="users" />
                    <Area type="monotone" dataKey="newUsers" stroke="#2A9D8F" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorNew)" name="newUsers" />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-xs text-[#374151]">
                          {value === 'users' ? 'Tổng ngườ i dùng' : 'Ngườ i dùng mới'}
                        </span>
                      )}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: easeOutExpo }}
          >
            <Card className="border border-[#E5E7EB] shadow-card">
              <CardContent className="p-5">
                <h3 className="text-heading-lg font-semibold text-[#0C2D57] mb-1">Doanh thu theo gói dịch vụ</h3>
                <p className="text-body-sm text-[#6B7280] mb-4">Phân bổ ngườ i dùng theo gói</p>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                      formatter={(value: number, _name: string, props: { payload?: { name: string; percentage: number } }) => [
                        `${value.toLocaleString()} (${props?.payload?.percentage ?? 0}%)`,
                        props?.payload?.name ?? '',
                      ]}
                    />
                    <Legend
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: string, entry: any) => (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-[#374151]">{value}</span>
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Users Management Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: easeOutExpo }}
        >
          <Card className="border border-[#E5E7EB] shadow-card">
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#E5E7EB]">
                <h3 className="text-heading-lg font-semibold text-[#0C2D57]">Ngườ i dùng</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <Input
                      placeholder="Tìm theo tên, email..."
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1) }}
                      className="pl-9 w-[260px] h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'active', label: 'Hoạt động' },
                  { key: 'blocked', label: 'Bị khóa' },
                  { key: 'pending', label: 'Chờ xác nhận' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setUserStatusFilter(f.key); setUserPage(1) }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      userStatusFilter === f.key
                        ? 'bg-[#1B5F99] text-white'
                        : 'bg-white text-[#374151] border border-[#E5E7EB] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <Separator orientation="vertical" className="h-5 mx-1" />
                {[
                  { key: 'all', label: 'Tất cả gói' },
                  { key: 'free', label: 'Miễn phí' },
                  { key: 'pro', label: 'Chuyên nghiệp' },
                  { key: 'enterprise', label: 'Doanh nghiệp' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setUserPlanFilter(f.key); setUserPage(1) }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      userPlanFilter === f.key
                        ? 'bg-[#1B5F99] text-white'
                        : 'bg-white text-[#374151] border border-[#E5E7EB] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9FAFB]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Ngườ i dùng</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Gói</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Phân tích</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Ngày đăng ký</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {pagedUsers.map((u, i) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#E8F5FC] flex items-center justify-center text-xs font-bold text-[#1B5F99] flex-shrink-0">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-[#111827]">{u.name}</p>
                                <p className="text-xs text-[#6B7280]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{planBadge(u.plan)}</td>
                          <td className="px-4 py-3">{statusBadge(u.status)}</td>
                          <td className="px-4 py-3 text-[#374151]">{u.analysesCount}</td>
                          <td className="px-4 py-3 text-[#6B7280] text-xs">{u.registeredAt}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setSelectedUser(u); setDetailOpen(true) }}
                                className="p-1.5 rounded hover:bg-[#E8F5FC] text-[#6B7280] hover:text-[#1B5F99] transition-colors"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 rounded hover:bg-[#E8F5FC] text-[#6B7280] hover:text-[#1B5F99] transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleBlock(u.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  u.status === 'blocked'
                                    ? 'hover:bg-[#E6F7F5] text-[#6B7280] hover:text-[#2A9D8F]'
                                    : 'hover:bg-[#FEF2F2] text-[#6B7280] hover:text-[#E76F51]'
                                }`}
                                title={u.status === 'blocked' ? 'Mở khóa' : 'Khóa'}
                              >
                                {u.status === 'blocked' ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280]">
                    Hiển thị {(userPage - 1) * userPageSize + 1}–{Math.min(userPage * userPageSize, filteredUsers.length)} / {filteredUsers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                      className="p-1.5 rounded hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: userTotalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setUserPage(i + 1)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                          userPage === i + 1 ? 'bg-[#1B5F99] text-white' : 'hover:bg-[#F3F4F6] text-[#374151]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
                      disabled={userPage === userTotalPages}
                      className="p-1.5 rounded hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: easeOutExpo }}
        >
          <Card className="border border-[#E5E7EB] shadow-card">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#E5E7EB]">
                <h3 className="text-heading-lg font-semibold text-[#0C2D57]">Giao dịch thanh toán</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <Input
                      placeholder="Tìm theo tên, mã giao dịch..."
                      value={txSearch}
                      onChange={(e) => { setTxSearch(e.target.value); setTxPage(1) }}
                      className="pl-9 w-[260px] h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'success', label: 'Thành công' },
                  { key: 'pending', label: 'Đang xử lý' },
                  { key: 'failed', label: 'Thất bại' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setTxStatusFilter(f.key); setTxPage(1) }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      txStatusFilter === f.key
                        ? 'bg-[#1B5F99] text-white'
                        : 'bg-white text-[#374151] border border-[#E5E7EB] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9FAFB]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Mã giao dịch</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Ngườ i dùng</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Gói</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Số tiền</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Thanh toán</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151] uppercase tracking-wider">Ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTx.map((t, i) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-[#374151]">{t.id}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-[#111827]">{t.userName}</p>
                            <p className="text-xs text-[#6B7280]">{t.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#374151]">{t.plan}</td>
                        <td className="px-4 py-3 font-medium text-[#111827]">{formatCurrency(t.amount)}</td>
                        <td className="px-4 py-3">{paymentIcon(t.paymentMethod)}</td>
                        <td className="px-4 py-3">{txStatusBadge(t.status)}</td>
                        <td className="px-4 py-3 text-[#6B7280] text-xs">{t.date}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {txTotalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280]">
                    Hiển thị {(txPage - 1) * txPageSize + 1}–{Math.min(txPage * txPageSize, filteredTx.length)} / {filteredTx.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                      disabled={txPage === 1}
                      className="p-1.5 rounded hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: txTotalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTxPage(i + 1)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                          txPage === i + 1 ? 'bg-[#1B5F99] text-white' : 'hover:bg-[#F3F4F6] text-[#374151]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                      disabled={txPage === txTotalPages}
                      className="p-1.5 rounded hover:bg-[#F3F4F6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* User Detail Sheet */}
      <UserDetailSheet
        user={selectedUser}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </AppLayout>
  )
}
