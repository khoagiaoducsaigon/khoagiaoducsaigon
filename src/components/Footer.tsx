import { Link } from 'react-router-dom'
import { Facebook, Twitter, Linkedin, Youtube } from 'lucide-react'
import { motion } from 'framer-motion'

const productLinks = [
  { label: 'Tính Năng', href: '/#features' },
  { label: 'Phân Tích', href: '/#analysis' },
  { label: 'Biểu Đồ', href: '/#charts' },
  { label: 'Báo Cáo', href: '/#reports' },
  { label: 'API', href: '/#api' },
]

const resourceLinks = [
  { label: 'Hướng Dẫn Sử Dụng', href: '/#guide' },
  { label: 'Blog', href: '/#blog' },
  { label: 'Câu Hỏi Thường Gặp', href: '/#faq' },
  { label: 'Diễn Đàn', href: '/#forum' },
]

const companyLinks = [
  { label: 'Về Chúng Tôi', href: '/#about' },
  { label: 'Liên Hệ', href: '/#contact' },
  { label: 'Chính Sách Bảo Mật', href: '/#privacy' },
  { label: 'Điều Khoản Sử Dụng', href: '/#terms' },
]

const socialIcons = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-landing mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand column */}
          <motion.div variants={itemVariants}>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo-white.svg" alt="Logo" className="w-8 h-8" />
              <span className="text-heading-sm font-bold text-white">
                Thống Kê Khoa Học
              </span>
            </Link>
            <p className="text-body-sm text-neutral-400 mt-3">
              Nền tảng phân tích thống kê cho nghiên cứu khoa học.
            </p>
            <div className="flex items-center gap-4 mt-4">
              {socialIcons.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Product column */}
          <motion.div variants={itemVariants}>
            <h4 className="text-heading-sm text-white mb-4">Sản Phẩm</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-body-sm text-neutral-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources column */}
          <motion.div variants={itemVariants}>
            <h4 className="text-heading-sm text-white mb-4">Tài Nguyên</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-body-sm text-neutral-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company column */}
          <motion.div variants={itemVariants}>
            <h4 className="text-heading-sm text-white mb-4">Công Ty</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-body-sm text-neutral-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-body-sm text-neutral-500">
            &copy; 2025 Thống Kê Khoa Học. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-body-sm text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
              Tiếng Việt &#9662;
            </span>
            <a href="#" className="text-body-sm text-neutral-500 hover:text-neutral-300 transition-colors">
              Hỗ Trợ
            </a>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}
