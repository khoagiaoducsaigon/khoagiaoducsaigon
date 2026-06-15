import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { label: 'Tính Năng', href: '/#features' },
  { label: 'Phân Tích', href: '/#analysis' },
  { label: 'Biểu Đồ', href: '/#charts' },
  { label: 'Bảng Giá', href: '/#pricing' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '')
      if (location.pathname === '/') {
        e.preventDefault()
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-neutral-200 shadow-xs'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-landing mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <span className={`text-heading-sm font-bold transition-colors duration-300 ${
              scrolled ? 'text-primary-900' : 'text-white'
            }`}>
              Thống Kê Khoa Học
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  scrolled
                    ? 'text-neutral-700 hover:text-primary-900'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className={`px-3 py-1.5 text-sm font-medium rounded-btn transition-all duration-200 ${
                scrolled
                  ? 'text-neutral-700 hover:bg-neutral-100'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Đăng Nhập
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium rounded-btn bg-primary-700 text-white hover:bg-primary-600 transition-all duration-200 hover:scale-[1.02]"
            >
              Bắt Đầu Miễn Phí
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className={`w-6 h-6 ${scrolled ? 'text-neutral-900' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${scrolled ? 'text-neutral-900' : 'text-white'}`} />
            )}
          </button>
        </div>
      </motion.nav>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-primary-900 flex flex-col items-center justify-center gap-6"
          >
            <button
              className="absolute top-4 right-4 p-2 text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleAnchorClick(e, link.href)
                  setMobileOpen(false)
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="text-white text-xl font-medium"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex flex-col gap-3 mt-4"
            >
              <Link
                to="/login"
                className="px-6 py-2.5 text-center text-white border border-white/30 rounded-btn hover:bg-white/10 transition-colors"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 text-center bg-accent-orange text-white rounded-btn hover:bg-accent-orange/90 transition-colors"
              >
                Bắt Đầu Miễn Phí
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
