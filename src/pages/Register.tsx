import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Zap,
  Building,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Layout from '@/components/Layout'
import { Separator } from '@/components/ui/separator'

const easeInOut = [0.65, 0, 0.35, 1] as [number, number, number, number]
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ─────────────── Password Strength ─────────────── */

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => {
    return [
      { label: 'Ít nhất 8 ký tự', pass: password.length >= 8 },
      { label: 'Chữ hoa + chữ thường', pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
      { label: 'Số', pass: /\d/.test(password) },
      { label: 'Ký tự đặc biệt', pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ]
  }, [password])

  const score = checks.filter((c) => c.pass).length

  const colors = ['bg-[#E76F51]', 'bg-[#F4A261]', 'bg-[#1B5F99]', 'bg-[#2A9D8F]']
  const labels = ['Yếu', 'Trung bình', 'Khá', 'Mạnh']

  if (!password) return null

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score - 1] : 'bg-[#E5E7EB]'
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: score === 4 ? '#2A9D8F' : score >= 2 ? '#1B5F99' : '#E76F51' }}>
        {labels[score - 1] || 'Yếu'}
      </p>
      <div className="space-y-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            {c.pass ? (
              <Check className="w-3.5 h-3.5 text-[#2A9D8F]" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-[#D1D5DB]" />
            )}
            <span className={`text-xs ${c.pass ? 'text-[#374151]' : 'text-[#9CA3AF]'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────── Plan Cards ─────────────── */

const plans = [
  {
    id: 'free',
    name: 'Miễn phí',
    price: '0đ',
    period: '/tháng',
    description: 'Dành cho sinh viên và ngườ i mới bắt đầu',
    features: ['3 dự án', 'Phân tích cơ bản', 'Biểu đồ cơ bản', 'Hỗ trợ cộng đồng'],
    icon: Zap,
    color: '#6B7280',
    bgColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  {
    id: 'pro',
    name: 'Chuyên nghiệp',
    price: '199k',
    period: '/tháng',
    description: 'Dành cho nhà nghiên cứu và giảng viên',
    features: ['Không giới hạn dự án', 'Tất cả phân tích nâng cao', 'Tất cả loại biểu đồ', 'Báo cáo PDF/Word', 'Ưu tiên hỗ trợ'],
    icon: BarChart3,
    color: '#1B5F99',
    bgColor: '#E8F5FC',
    borderColor: '#1B5F99',
  },
  {
    id: 'enterprise',
    name: 'Doanh nghiệp',
    price: '499k',
    period: '/tháng',
    description: 'Dành cho tổ chức và doanh nghiệp',
    features: ['Tất cả tính năng Pro', 'Tích hợp API', 'Hỗ trợ 24/7', 'Tùy chỉnh báo cáo', 'Quản lý nhóm'],
    icon: Building,
    color: '#E8723A',
    bgColor: '#FFF0E8',
    borderColor: '#E8723A',
  },
]

function PlanSelection({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid gap-4">
      {plans.map((plan) => {
        const Icon = plan.icon
        const isSelected = selected === plan.id
        return (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(plan.id)}
            className={`relative cursor-pointer rounded-card border-2 p-5 transition-all duration-200 ${
              isSelected ? 'shadow-card-hover' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
            }`}
            style={{
              borderColor: isSelected ? plan.borderColor : undefined,
              backgroundColor: isSelected ? plan.bgColor : '#FFFFFF',
            }}
          >
            {isSelected && (
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="w-5 h-5" style={{ color: plan.color }} />
              </div>
            )}
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: plan.bgColor }}
              >
                <Icon className="w-5 h-5" style={{ color: plan.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-heading-sm font-semibold text-[#111827]">{plan.name}</h3>
                  <span className="text-data-md font-semibold" style={{ color: plan.color }}>
                    {plan.price}
                  </span>
                  <span className="text-body-sm text-[#6B7280]">{plan.period}</span>
                </div>
                <p className="text-body-sm text-[#6B7280] mb-3">{plan.description}</p>
                <div className="flex flex-wrap gap-2">
                  {plan.features.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 text-xs text-[#374151] bg-white/80 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3 text-[#2A9D8F]" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ─────────────── Step Indicator ─────────────── */

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep
        return (
          <div key={stepNum} className="flex items-center gap-3">
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${
                isCompleted
                  ? 'bg-[#2A9D8F] text-white'
                  : isActive
                  ? 'bg-[#1B5F99] text-white'
                  : 'bg-[#F3F4F6] text-[#9CA3AF] border border-[#D1D5DB]'
              }`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
            </motion.div>
            {stepNum < totalSteps && (
              <div
                className={`w-10 h-0.5 rounded transition-colors duration-300 ${
                  isCompleted ? 'bg-[#2A9D8F]' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────── Main Register Component ─────────────── */

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 1: Account info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Step 2: Plan
  const [selectedPlan, setSelectedPlan] = useState('free')

  // Step 3: Personal info
  const [organization, setOrganization] = useState('')
  const [role, setRole] = useState('')
  const [researchField, setResearchField] = useState('')

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên'
    if (!email.trim()) e.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ'
    if (!password) e.password = 'Vui lòng nhập mật khẩu'
    else if (password.length < 8) e.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    if (!confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    else if (password !== confirmPassword) e.confirmPassword = 'Mật khẩu không khớp'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = () => {
    const e: Record<string, string> = {}
    if (!organization.trim()) e.organization = 'Vui lòng nhập tổ chức'
    if (!role.trim()) e.role = 'Vui lòng nhập vai trò'
    if (!researchField.trim()) e.researchField = 'Vui lòng nhập lĩnh vực nghiên cứu'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 3 && !validateStep3()) return
    setDirection(1)
    setStep((s) => s + 1)
    setErrors({})
  }

  const prevStep = () => {
    setDirection(-1)
    setStep((s) => s - 1)
    setErrors({})
  }

  const handleSubmit = () => {
    const user = {
      id: 'user-' + Date.now(),
      name,
      email,
      plan: selectedPlan,
      role: 'user',
      organization,
      position: role,
      researchField,
      avatar: '',
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('auth_user', JSON.stringify(user))
    toast.success('Đăng ký thành công!', { description: 'Tài khoản của bạn đã được tạo.' })
    navigate('/dashboard')
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <Layout>
      <div className="flex min-h-[100dvh]">
        {/* Left Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0C2D57 0%, #1B5F99 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url(/hero-bg-pattern.svg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 flex flex-col items-center text-center max-w-[420px] px-8">
            <div className="flex items-center gap-2.5 mb-10">
              <img src="/logo-white.svg" alt="Logo" className="w-10 h-10" />
              <span className="text-heading-lg font-bold text-white">Thống Kê Khoa Học</span>
            </div>
            <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight mb-4">
              Bắt Đầu Hành Trình Phân Tích Dữ Liệu
            </h1>
            <p className="text-body-lg text-white/75 mb-8">
              Tham gia cộng đồng 10.000+ nhà nghiên cứu đang sử dụng nền tảng của chúng tôi.
            </p>
            <div className="flex flex-col gap-3 items-start w-full">
              {[
                'Miễn phí 3 dự án đầu tiên',
                'Không cần thẻ tín dụng',
                'Hỗ trợ 24/7 từ đội ngũ chuyên gia',
              ].map((text, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: easeOutExpo }}
                  className="flex items-center gap-3"
                >
                  <Check className="w-4 h-4 text-[#2A9D8F] flex-shrink-0" />
                  <span className="text-body-md text-white/85">{text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white py-10">
          <div className="w-full max-w-[520px] px-6 sm:px-10">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
            >
              <h2 className="text-heading-xl text-[#0C2D57] mb-2 text-center">Tạo Tài Khoản Mới</h2>
              <p className="text-body-md text-[#6B7280] mb-6 text-center">
                Bắt đầu phân tích dữ liệu miễn phí ngay hôm nay.
              </p>
            </motion.div>

            <StepIndicator currentStep={step} totalSteps={4} />

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: easeInOut }}
              >
                {/* Step 1: Account Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-body-sm font-semibold text-[#374151] mb-1">Họ và tên</label>
                      <Input
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          setErrors((p) => { const np = { ...p }; delete np.name; return np; })
                        }}
                        className={`h-11 ${errors.name ? 'border-[#E76F51]' : ''}`}
                      />
                      {errors.name && <p className="text-xs text-[#E76F51] mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-body-sm font-semibold text-[#374151] mb-1">Email</label>
                      <Input
                        type="email"
                        placeholder="ten@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setErrors((p) => { const np = { ...p }; delete np.email; return np; })
                        }}
                        className={`h-11 ${errors.email ? 'border-[#E76F51]' : ''}`}
                      />
                      {errors.email && <p className="text-xs text-[#E76F51] mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-body-sm font-semibold text-[#374151] mb-1">Mật khẩu</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            setErrors((p) => { const np = { ...p }; delete np.password; return np; })
                          }}
                          className={`h-11 pr-10 ${errors.password ? 'border-[#E76F51]' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-[#E76F51] mt-1">{errors.password}</p>}
                      <PasswordStrength password={password} />
                    </div>
                    <div>
                      <label className="block text-body-sm font-semibold text-[#374151] mb-1">Xác nhận mật khẩu</label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            setErrors((p) => { const np = { ...p }; delete np.confirmPassword; return np; })
                          }}
                          className={`h-11 pr-10 ${errors.confirmPassword ? 'border-[#E76F51]' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-[#E76F51] mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                    <Button
                      onClick={nextStep}
                      className="w-full h-12 bg-[#1B5F99] hover:bg-[#247BA0] hover:scale-[1.02] text-base font-medium transition-all"
                    >
                      Tiếp tục
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Plan Selection */}
                {step === 2 && (
                  <div className="space-y-5">
                    <PlanSelection selected={selectedPlan} onSelect={setSelectedPlan} />
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={prevStep} className="flex-1 h-11">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Quay lại
                      </Button>
                      <Button
                        onClick={nextStep}
                        className="flex-1 h-12 bg-[#1B5F99] hover:bg-[#247BA0] hover:scale-[1.02] text-base font-medium transition-all"
                      >
                        Tiếp tục
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Personal Info */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 className="w-5 h-5 text-[#1B5F99]" />
                      <span className="text-heading-sm font-semibold text-[#0C2D57]">Thông tin cá nhân</span>
                    </div>
                    <div>
                      <label className="block text-body-sm font-semibold text-[#374151] mb-1">Tổ chức / Trường học</label>
                      <Input
                        placeholder="Đại học Quốc gia Hà Nội"
                        value={organization}
                        onChange={(e) => {
                          setOrganization(e.target.value)
                          setErrors((p) => { const np = { ...p }; delete np.organization; return np; })
                        }}
                        className={`h-11 ${errors.organization ? 'border-[#E76F51]' : ''}`}
                      />
                      {errors.organization && (
                        <p className="text-xs text-[#E76F51] mt-1">{errors.organization}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-body-sm font-semibold text-[#374151] mb-1">Vai trò</label>
                      <Input
                        placeholder="Nghiên cứu viên, Giảng viên, Sinh viên..."
                        value={role}
                        onChange={(e) => {
                          setRole(e.target.value)
                          setErrors((p) => { const np = { ...p }; delete np.role; return np; })
                        }}
                        className={`h-11 ${errors.role ? 'border-[#E76F51]' : ''}`}
                      />
                      {errors.role && <p className="text-xs text-[#E76F51] mt-1">{errors.role}</p>}
                    </div>
                    <div>
                      <label className="block text-body-sm font-semibold text-[#374151] mb-1">Lĩnh vực nghiên cứu</label>
                      <Input
                        placeholder="Y sinh, Kinh tế, Xã hội học..."
                        value={researchField}
                        onChange={(e) => {
                          setResearchField(e.target.value)
                          setErrors((p) => { const np = { ...p }; delete np.researchField; return np; })
                        }}
                        className={`h-11 ${errors.researchField ? 'border-[#E76F51]' : ''}`}
                      />
                      {errors.researchField && (
                        <p className="text-xs text-[#E76F51] mt-1">{errors.researchField}</p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="ghost" onClick={prevStep} className="flex-1 h-11">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Quay lại
                      </Button>
                      <Button
                        onClick={nextStep}
                        className="flex-1 h-12 bg-[#1B5F99] hover:bg-[#247BA0] hover:scale-[1.02] text-base font-medium transition-all"
                      >
                        Tiếp tục
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {step === 4 && (
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                      className="w-16 h-16 rounded-full bg-[#E6F7F5] flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 className="w-8 h-8 text-[#2A9D8F]" />
                    </motion.div>

                    <div>
                      <h3 className="text-heading-lg font-semibold text-[#0C2D57] mb-2">Xác nhận thông tin</h3>
                      <p className="text-body-md text-[#6B7280]">Vui lòng kiểm tra lại thông tin trước khi hoàn tất.</p>
                    </div>

                    <div className="bg-[#F9FAFB] rounded-card p-5 text-left space-y-3">
                      <div className="flex justify-between">
                        <span className="text-body-sm text-[#6B7280]">Họ tên</span>
                        <span className="text-body-sm font-medium text-[#111827]">{name}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-body-sm text-[#6B7280]">Email</span>
                        <span className="text-body-sm font-medium text-[#111827]">{email}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-body-sm text-[#6B7280]">Gói dịch vụ</span>
                        <span className="text-body-sm font-medium" style={{ color: plans.find((p) => p.id === selectedPlan)?.color || '#374151' }}>
                          {plans.find((p) => p.id === selectedPlan)?.name}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-body-sm text-[#6B7280]">Tổ chức</span>
                        <span className="text-body-sm font-medium text-[#111827]">{organization}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-body-sm text-[#6B7280]">Vai trò</span>
                        <span className="text-body-sm font-medium text-[#111827]">{role}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-body-sm text-[#6B7280]">Lĩnh vực</span>
                        <span className="text-body-sm font-medium text-[#111827]">{researchField}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={prevStep} className="flex-1 h-11">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Quay lại
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        className="flex-1 h-12 bg-[#1B5F99] hover:bg-[#247BA0] hover:scale-[1.02] text-base font-medium transition-all"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Hoàn tất đăng ký
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-body-md text-[#6B7280] mt-6">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-[#1B5F99] font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
