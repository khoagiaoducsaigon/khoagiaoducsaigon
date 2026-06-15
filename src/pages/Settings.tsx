import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Package,
  Camera,
  Plus,
  Trash2,
  Smartphone,
  Globe,
  Mail,
  Check,
  X,
  Clock,
  AlertTriangle,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import AppLayout from '@/components/AppLayout'

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ─────────────── Profile Tab ─────────────── */

function ProfileTab() {
  const [name, setName] = useState('Nguyễn Văn An')
  const [email, setEmail] = useState('an.nguyen@hust.edu.vn')
  const [organization, setOrganization] = useState('ĐH Bách Khoa Hà Nội')
  const [bio, setBio] = useState('Nghiên cứu viên về thống kê ứng dụng trong y sinh. Đang thực hiện nhiều dự án nghiên cứu về phân tích dữ liệu lâm sàng.')
  const [phone, setPhone] = useState('0901234567')

  const handleSave = () => {
    toast.success('Đã lưu thay đổi!', { description: 'Thông tin cá nhân đã được cập nhật.' })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#E8F5FC] flex items-center justify-center text-2xl font-bold text-[#1B5F99]">
            {name.charAt(0)}
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#1B5F99] text-white flex items-center justify-center hover:bg-[#247BA0] transition-colors shadow-sm">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div>
          <h4 className="text-heading-sm font-semibold text-[#111827]">Ảnh đại diện</h4>
          <p className="text-body-sm text-[#6B7280]">JPG, PNG hoặc GIF. Tối đa 2MB.</p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4">
        <div>
          <label className="block text-body-sm font-semibold text-[#374151] mb-1">Họ và tên</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-[#374151] mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-[#374151] mb-1">Số điện thoại</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-[#374151] mb-1">Tổ chức / Trường học</label>
          <Input value={organization} onChange={(e) => setOrganization(e.target.value)} className="h-10" />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-[#374151] mb-1">Giới thiệu</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-[#D1D5DB] bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-[#1B5F99] focus-visible:ring-[3px] focus-visible:ring-[#1B5F99]/12 transition-all resize-none"
          />
        </div>
      </div>

      <Button onClick={handleSave} className="bg-[#1B5F99] hover:bg-[#247BA0] hover:scale-[1.02] transition-all">
        <Save className="w-4 h-4 mr-2" />
        Lưu thay đổi
      </Button>
    </div>
  )
}

/* ─────────────── Plan Tab ─────────────── */

const plansList = [
  {
    id: 'free',
    name: 'Miễn phí',
    price: '0đ',
    period: '/tháng',
    color: '#6B7280',
    bgColor: '#F9FAFB',
    features: [
      { text: '3 dự án', included: true },
      { text: 'Phân tích cơ bản', included: true },
      { text: 'Biểu đồ cơ bản', included: true },
      { text: 'Hỗ trợ cộng đồng', included: true },
      { text: 'Báo cáo PDF/Word', included: false },
      { text: 'Phân tích nâng cao', included: false },
      { text: 'Hỗ trợ ưu tiên', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Chuyên nghiệp',
    price: '199k',
    period: '/tháng',
    color: '#1B5F99',
    bgColor: '#E8F5FC',
    features: [
      { text: 'Không giới hạn dự án', included: true },
      { text: 'Tất cả phân tích nâng cao', included: true },
      { text: 'Tất cả loại biểu đồ', included: true },
      { text: 'Báo cáo PDF/Word', included: true },
      { text: 'Ưu tiên hỗ trợ', included: true },
      { text: 'Tích hợp API', included: false },
      { text: 'Hỗ trợ 24/7', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Doanh nghiệp',
    price: '499k',
    period: '/tháng',
    color: '#E8723A',
    bgColor: '#FFF0E8',
    features: [
      { text: 'Tất cả tính năng Pro', included: true },
      { text: 'Tích hợp API', included: true },
      { text: 'Hỗ trợ 24/7', included: true },
      { text: 'Tùy chỉnh báo cáo', included: true },
      { text: 'Quản lý nhóm', included: true },
      { text: 'Tích hợp SSO', included: true },
      { text: 'Chuyên viên riêng', included: true },
    ],
  },
]

function PlanTab() {
  const [currentPlan, setCurrentPlan] = useState('pro')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-md font-semibold text-[#0C2D57] mb-1">Gói dịch vụ của bạn</h3>
        <p className="text-body-sm text-[#6B7280]">Quản lý gói đăng ký và nâng cấp tính năng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plansList.map((plan) => {
          const isCurrent = currentPlan === plan.id
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className={`rounded-card border-2 p-5 transition-all ${
                isCurrent ? 'shadow-card-hover' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
              }`}
              style={isCurrent ? { borderColor: plan.color, backgroundColor: plan.bgColor } : { backgroundColor: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-heading-sm font-semibold" style={{ color: plan.color }}>{plan.name}</h4>
                {isCurrent && (
                  <Badge className="bg-[#2A9D8F] text-white hover:bg-[#2A9D8F]">Đang dùng</Badge>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-data-lg font-semibold text-[#111827]">{plan.price}</span>
                <span className="text-body-sm text-[#6B7280]">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2">
                    {f.included ? (
                      <Check className="w-4 h-4 text-[#2A9D8F] flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-[#D1D5DB] flex-shrink-0" />
                    )}
                    <span className={`text-sm ${f.included ? 'text-[#374151]' : 'text-[#9CA3AF]'}`}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? 'outline' : 'default'}
                className={`w-full ${
                  isCurrent
                    ? 'border-[#1B5F99] text-[#1B5F99] hover:bg-[#E8F5FC]'
                    : 'bg-[#1B5F99] hover:bg-[#247BA0]'
                }`}
                onClick={() => {
                  if (!isCurrent) {
                    setCurrentPlan(plan.id)
                    toast.success(`Đã chuyển sang gói ${plan.name}`)
                  }
                }}
                disabled={isCurrent}
              >
                {isCurrent ? 'Gói hiện tại' : 'Chọn gói này'}
              </Button>
            </motion.div>
          )
        })}
      </div>

      <Card className="border border-[#E5E7EB] shadow-card bg-[#F9FAFB]">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F4A261] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-heading-sm font-semibold text-[#111827] mb-1">Lưu ý về thay đổi gói</h4>
              <p className="text-body-sm text-[#6B7280]">
                Khi nâng cấp gói, bạn sẽ được tính phí prorated cho thờ i gian còn lại của chu kỳ hiện tại.
                Khi hạ cấp, thay đổi sẽ có hiệu lực từ chu kỳ tiếp theo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────── Payment Tab ─────────────── */

interface PaymentMethod {
  id: string
  type: 'MoMo' | 'ZaloPay' | 'Bank'
  name: string
  number: string
  isDefault: boolean
}

const initialPaymentMethods: PaymentMethod[] = [
  { id: '1', type: 'MoMo', name: 'Ví MoMo', number: '**** **** 4567', isDefault: true },
  { id: '2', type: 'Bank', name: 'Vietcombank', number: '**** **** 8910', isDefault: false },
]

const billingHistory = [
  { id: 'INV-2025-001', description: 'Gói Chuyên nghiệp - Tháng 1/2025', amount: 199000, status: 'Đã thanh toán', date: '2025-01-01' },
  { id: 'INV-2024-012', description: 'Gói Chuyên nghiệp - Tháng 12/2024', amount: 199000, status: 'Đã thanh toán', date: '2024-12-01' },
  { id: 'INV-2024-011', description: 'Gói Chuyên nghiệp - Tháng 11/2024', amount: 199000, status: 'Đã thanh toán', date: '2024-11-01' },
  { id: 'INV-2024-010', description: 'Gói Miễn phí → Chuyên nghiệp (Nâng cấp)', amount: 132000, status: 'Đã thanh toán', date: '2024-10-15' },
  { id: 'INV-2024-009', description: 'Gói Miễn phí - Tháng 10/2024', amount: 0, status: 'Miễn phí', date: '2024-10-01' },
]

function PaymentTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>(initialPaymentMethods)

  const removeMethod = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id))
    toast.success('Đã xóa phương thức thanh toán')
  }

  const setDefault = (id: string) => {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })))
    toast.success('Đã đặt phương thức mặc định')
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Payment Methods */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading-md font-semibold text-[#0C2D57]">Phương thức thanh toán</h3>
          <Button variant="outline" size="sm" className="text-[#1B5F99] border-[#1B5F99] hover:bg-[#E8F5FC]">
            <Plus className="w-4 h-4 mr-1" />
            Thêm
          </Button>
        </div>
        <div className="space-y-3">
          {methods.map((m) => (
            <Card key={m.id} className="border border-[#E5E7EB] shadow-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    m.type === 'MoMo' ? 'bg-[#FFF0F5]' : m.type === 'ZaloPay' ? 'bg-[#EBF5FF]' : 'bg-[#E6F7F5]'
                  }`}>
                    {m.type === 'MoMo' ? (
                      <Smartphone className="w-5 h-5 text-[#D82D8B]" />
                    ) : m.type === 'ZaloPay' ? (
                      <CreditCard className="w-5 h-5 text-[#0068FF]" />
                    ) : (
                      <Globe className="w-5 h-5 text-[#2A9D8F]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">
                      {m.name} {m.isDefault && <Badge className="ml-2 bg-[#E8F5FC] text-[#1B5F99] hover:bg-[#E8F5FC] text-xs">Mặc định</Badge>}
                    </p>
                    <p className="text-xs text-[#6B7280]">{m.number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!m.isDefault && (
                    <button
                      onClick={() => setDefault(m.id)}
                      className="p-2 rounded hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#1B5F99] transition-colors"
                      title="Đặt mặc định"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => removeMethod(m.id)}
                    className="p-2 rounded hover:bg-[#FEF2F2] text-[#6B7280] hover:text-[#E76F51] transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Billing History */}
      <div>
        <h3 className="text-heading-md font-semibold text-[#0C2D57] mb-4">Lịch sử thanh toán</h3>
        <div className="overflow-x-auto rounded-card border border-[#E5E7EB]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151]">Mã hóa đơn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151]">Nội dung</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151]">Số tiền</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151]">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#374151]">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((b) => (
                <tr key={b.id} className="border-t border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#374151]">{b.id}</td>
                  <td className="px-4 py-3 text-[#111827]">{b.description}</td>
                  <td className="px-4 py-3 font-medium text-[#111827]">{b.amount.toLocaleString('vi-VN')}đ</td>
                  <td className="px-4 py-3">
                    <Badge className={b.status === 'Đã thanh toán' ? 'bg-[#E6F7F5] text-[#2A9D8F] hover:bg-[#E6F7F5]' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100'}>
                      {b.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] text-xs">{b.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Notifications Tab ─────────────── */

function NotificationsTab() {
  const [settings, setSettings] = useState({
    emailNewAnalysis: true,
    emailWeeklyReport: true,
    emailPromotions: false,
    emailSecurity: true,
    pushAnalysisDone: true,
    pushNewFeature: false,
    pushTeamInvite: true,
  })

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Email Notifications */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-[#1B5F99]" />
          <h3 className="text-heading-md font-semibold text-[#0C2D57]">Thông báo qua email</h3>
        </div>
        <Card className="border border-[#E5E7EB] shadow-card divide-y divide-[#E5E7EB]">
          {[
            { key: 'emailNewAnalysis' as const, label: 'Phân tích mới hoàn thành', desc: 'Nhận email khi phân tích của bạn đã xong' },
            { key: 'emailWeeklyReport' as const, label: 'Báo cáo hàng tuần', desc: 'Tổng kết hoạt động và thống kê tuần' },
            { key: 'emailPromotions' as const, label: 'Khuyến mãi và ưu đãi', desc: 'Thông tin về khuyến mãi, giảm giá gói dịch vụ' },
            { key: 'emailSecurity' as const, label: 'Cảnh báo bảo mật', desc: 'Thông báo khi có đăng nhập bất thường' },
          ].map((item) => (
            <CardContent key={item.key} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#111827]">{item.label}</p>
                <p className="text-xs text-[#6B7280]">{item.desc}</p>
              </div>
              <Switch checked={settings[item.key]} onCheckedChange={() => toggle(item.key)} />
            </CardContent>
          ))}
        </Card>
      </div>

      {/* Push Notifications */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-[#1B5F99]" />
          <h3 className="text-heading-md font-semibold text-[#0C2D57]">Thông báo đẩy</h3>
        </div>
        <Card className="border border-[#E5E7EB] shadow-card divide-y divide-[#E5E7EB]">
          {[
            { key: 'pushAnalysisDone' as const, label: 'Phân tích hoàn tất', desc: 'Thông báo khi phân tích xong' },
            { key: 'pushNewFeature' as const, label: 'Tính năng mới', desc: 'Thông báo khi có tính năng mới' },
            { key: 'pushTeamInvite' as const, label: 'Lờ i mợi nhóm', desc: 'Khi có ngườ i mợi bạn vào nhóm' },
          ].map((item) => (
            <CardContent key={item.key} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#111827]">{item.label}</p>
                <p className="text-xs text-[#6B7280]">{item.desc}</p>
              </div>
              <Switch checked={settings[item.key]} onCheckedChange={() => toggle(item.key)} />
            </CardContent>
          ))}
        </Card>
      </div>

      <Button
        onClick={() => toast.success('Đã lưu cài đặt thông báo!')}
        className="bg-[#1B5F99] hover:bg-[#247BA0] hover:scale-[1.02] transition-all"
      >
        <Save className="w-4 h-4 mr-2" />
        Lưu cài đặt
      </Button>
    </div>
  )
}

/* ─────────────── Security Tab ─────────────── */

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFA, setTwoFA] = useState(false)
  const [sessions] = useState([
    { id: '1', device: 'Chrome - Windows 11', location: 'Hà Nội, Việt Nam', ip: '14.232.xxx.xxx', current: true, time: 'Hiện tại' },
    { id: '2', device: 'Safari - iPhone 15', location: 'TP.HCM, Việt Nam', ip: '113.xxx.xxx.xxx', current: false, time: '2 giờ trước' },
    { id: '3', device: 'Firefox - macOS', location: 'Đà Nẵng, Việt Nam', ip: '42.xxx.xxx.xxx', current: false, time: '3 ngày trước' },
  ])

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }
    toast.success('Đã đổi mật khẩu thành công!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Change Password */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[#1B5F99]" />
          <h3 className="text-heading-md font-semibold text-[#0C2D57]">Đổi mật khẩu</h3>
        </div>
        <Card className="border border-[#E5E7EB] shadow-card">
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="block text-body-sm font-semibold text-[#374151] mb-1">Mật khẩu hiện tại</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-[#374151] mb-1">Mật khẩu mới</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-[#374151] mb-1">Xác nhận mật khẩu mới</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10"
              />
            </div>
            <Button onClick={handleChangePassword} className="bg-[#1B5F99] hover:bg-[#247BA0] hover:scale-[1.02] transition-all">
              Cập nhật mật khẩu
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 2FA */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-[#1B5F99]" />
          <h3 className="text-heading-md font-semibold text-[#0C2D57]">Xác thực hai yếu tố (2FA)</h3>
        </div>
        <Card className="border border-[#E5E7EB] shadow-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#111827]">Bảo vệ tài khoản bằng 2FA</p>
              <p className="text-xs text-[#6B7280]">Yêu cầu mã xác thực khi đăng nhập từ thiết bị mới</p>
            </div>
            <Switch checked={twoFA} onCheckedChange={(v) => {
              setTwoFA(v)
              toast.success(v ? 'Đã bật xác thực hai yếu tố' : 'Đã tắt xác thực hai yếu tố')
            }} />
          </CardContent>
        </Card>
      </div>

      {/* Session Management */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#1B5F99]" />
          <h3 className="text-heading-md font-semibold text-[#0C2D57]">Phiên đăng nhập</h3>
        </div>
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className={`border shadow-card ${s.current ? 'border-[#1B5F99] bg-[#F4FAFF]' : 'border-[#E5E7EB]'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.current ? 'bg-[#E8F5FC]' : 'bg-[#F9FAFB]'}`}>
                    <Globe className={`w-4 h-4 ${s.current ? 'text-[#1B5F99]' : 'text-[#6B7280]'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">
                      {s.device}
                      {s.current && <Badge className="ml-2 bg-[#E6F7F5] text-[#2A9D8F] hover:bg-[#E6F7F5] text-xs">Hiện tại</Badge>}
                    </p>
                    <p className="text-xs text-[#6B7280]">{s.location} • {s.ip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7280]">{s.time}</span>
                  {!s.current && (
                    <button
                      onClick={() => toast.success('Đã đăng xuất phiên')}
                      className="p-2 rounded hover:bg-[#FEF2F2] text-[#6B7280] hover:text-[#E76F51] transition-colors"
                      title="Đăng xuất"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Main Settings Page ─────────────── */

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { value: 'profile', label: 'Thông tin cá nhân', icon: User },
    { value: 'plan', label: 'Gói dịch vụ', icon: Package },
    { value: 'payment', label: 'Thanh toán', icon: CreditCard },
    { value: 'notifications', label: 'Thông báo', icon: Bell },
    { value: 'security', label: 'Bảo mật', icon: Shield },
  ]

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
        >
          <h1 className="text-heading-xl text-[#0C2D57]">Cài đặt tài khoản</h1>
          <p className="text-body-md text-[#6B7280] mt-1">Quản lý thông tin cá nhân, gói dịch vụ và bảo mật</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: easeOutExpo }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border border-[#E5E7EB] p-1 h-auto flex-wrap gap-1">
              {tabs.map((t) => {
                const Icon = t.icon
                return (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="data-[state=active]:bg-[#1B5F99] data-[state=active]:text-white px-4 py-2 text-sm font-medium transition-all"
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    {t.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <TabsContent value="profile" className="mt-0">
              <ProfileTab />
            </TabsContent>
            <TabsContent value="plan" className="mt-0">
              <PlanTab />
            </TabsContent>
            <TabsContent value="payment" className="mt-0">
              <PaymentTab />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationsTab />
            </TabsContent>
            <TabsContent value="security" className="mt-0">
              <SecurityTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  )
}
