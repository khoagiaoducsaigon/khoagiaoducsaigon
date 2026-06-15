import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Layout from '@/components/Layout'

const featureBullets = [
  '8 phương pháp thống kê chuyên sâu',
  '6 loại biểu đồ chuyên nghiệp',
  'Báo cáo xuất PDF/Word tự động',
  'Miễn phí đến 3 dự án',
]

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3h8v8H3z" fill="#F25022"/>
      <path d="M13 3h8v8h-8z" fill="#7FBA00"/>
      <path d="M3 13h8v8H3z" fill="#00A4EF"/>
      <path d="M13 13h8v8h-8z" fill="#FFB900"/>
    </svg>
  )
}

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const user = {
      id: 'user-' + Date.now(),
      email,
      name: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : 'user',
      plan: 'free',
      avatar: '',
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('auth_user', JSON.stringify(user))
    toast.success('Đăng nhập thành công!', { description: 'Chào mừng bạn quay lại.' })
    navigate('/dashboard')
  }

  const handleSocialLogin = (provider: string) => {
    const user = {
      id: 'user-' + Date.now(),
      email: 'user@example.com',
      name: 'Ngườ i dùng ' + provider,
      role: 'user',
      plan: 'free',
      avatar: '',
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('auth_user', JSON.stringify(user))
    toast.success(`Đăng nhập ${provider} thành công!`)
    navigate('/dashboard')
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast.error('Vui lòng nhập email hợp lệ')
      return
    }
    toast.success('Đã gửi liên kết khôi phục!', { description: 'Vui lòng kiểm tra hộp thư của bạn.' })
    setShowForgot(false)
    setForgotEmail('')
  }

  return (
    <AnimatePresence mode="wait">
      {showForgot ? (
        <motion.div
          key="forgot"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full max-w-[420px] px-6 sm:px-10"
        >
          <button
            onClick={() => setShowForgot(false)}
            className="flex items-center gap-2 text-sm text-[#1B5F99] hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </button>
          <h2 className="text-heading-xl text-[#0C2D57] mb-2">Khôi Phục Mật Khẩu</h2>
          <p className="text-body-md text-[#6B7280] mb-6">
            Nhập email của bạn để nhận liên kết khôi phục.
          </p>
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-body-sm font-semibold text-[#374151] mb-1">Email</label>
              <Input
                type="email"
                placeholder="ten@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-[#1B5F99] hover:bg-[#247BA0] text-base">
              Gửi Liên Kết
            </Button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          className="w-full max-w-[420px] px-6 sm:px-10"
        >
          <h2 className="text-heading-xl text-[#0C2D57] mb-2">Chào Mừng Trở Lại!</h2>
          <p className="text-body-md text-[#6B7280] mb-6">
            Đăng nhập để tiếp tục phân tích dữ liệu.
          </p>

          {/* Social Login */}
          <div className="flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Button
                variant="outline"
                className="w-full h-11 justify-center gap-2 text-sm font-medium"
                onClick={() => handleSocialLogin('Google')}
              >
                <GoogleIcon className="w-5 h-5" />
                Đăng nhập với Google
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.3 }}
            >
              <Button
                variant="outline"
                className="w-full h-11 justify-center gap-2 text-sm font-medium"
                onClick={() => handleSocialLogin('Microsoft')}
              >
                <MicrosoftIcon className="w-5 h-5" />
                Đăng nhập với Microsoft
              </Button>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <Separator className="flex-1" />
            <span className="text-body-sm text-[#9CA3AF] whitespace-nowrap">hoặc đăng nhập bằng email</span>
            <Separator className="flex-1" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-sm font-semibold text-[#374151] mb-1">Email</label>
              <Input
                type="email"
                placeholder="ten@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                }}
                className={`h-11 ${errors.email ? 'border-[#E76F51] focus-visible:ring-[#E76F51]/20' : ''}`}
              />
              {errors.email && <p className="text-xs text-[#E76F51] mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-body-sm font-semibold text-[#374151]">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[13px] text-[#1B5F99] hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  className={`h-11 pr-10 ${errors.password ? 'border-[#E76F51] focus-visible:ring-[#E76F51]/20' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[#E76F51] mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <label htmlFor="remember" className="text-body-sm text-[#4B5563] cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#1B5F99] hover:bg-[#247BA0] hover:scale-[1.02] text-base font-medium transition-all"
            >
              Đăng nhập
            </Button>
          </form>

          <p className="text-center text-body-md text-[#6B7280] mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#1B5F99] font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function LeftPanel() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0C2D57 0%, #1B5F99 100%)' }}
    >
      {/* Background pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url(/hero-bg-pattern.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'float 4s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-[420px] px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <img src="/logo-white.svg" alt="Logo" className="w-10 h-10" />
          <span className="text-heading-lg font-bold text-white">Thống Kê Khoa Học</span>
        </div>

        {/* Headline */}
        <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight mb-4">
          Phân Tích Thống Kê — Đơn Giản & Chính Xác
        </h1>
        <p className="text-body-lg text-white/75 mb-8">
          Nền tảng phân tích dữ liệu toàn diện cho nhà nghiên cứu, giảng viên, và sinh viên.
        </p>

        {/* Feature bullets */}
        <div className="flex flex-col gap-3 items-start w-full mb-10">
          {featureBullets.map((text, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1, duration: 0.4, ease: easeOutExpo }}
              className="flex items-center gap-3"
            >
              <Check className="w-4 h-4 text-[#2A9D8F] flex-shrink-0" />
              <span className="text-body-md text-white/85">{text}</span>
            </motion.div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="mt-auto">
          <p className="text-body-md text-white/70 italic mb-2">
            "Tôi đã thay thế hoàn toàn SPSS bằng nền tảng này. Giao diện trực quan hơn nhiều!"
          </p>
          <p className="text-body-sm text-white/50">— PGS.TS. Trần Văn Hùng</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function Login() {
  return (
    <Layout>
      <div className="flex min-h-[100dvh]">
        <LeftPanel />
        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center bg-white">
          <LoginForm />
        </div>
      </div>
    </Layout>
  )
}
