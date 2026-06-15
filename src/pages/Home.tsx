import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Upload, Sigma, BarChart3, FileText, ArrowRight,
  GitCompare, Grid3X3, Table2, ScatterChart, TrendingUp, Spline,
  Calculator, Activity, Check, X,
} from 'lucide-react'

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ==========================================
   Animated Counter Hook
   ========================================== */
function useAnimatedCounter(target: number, suffix = '', duration = 1200) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, target, duration])

  return { ref, display: `${count.toLocaleString('vi')}${suffix}` }
}

/* ==========================================
   Section 1 — Hero
   ========================================== */
function HeroSection() {
  return (
    <section
      className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: '#0C2D57',
      }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: 'url(/hero-bg-pattern.svg)', backgroundSize: '400px', backgroundRepeat: 'repeat', opacity: 0.08 }} />
      <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 text-center pt-24 pb-12">
        {/* Tagline badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: easeOutExpo }}
          className="inline-flex items-center px-4 py-2 rounded-full border border-white/20 bg-white/10"
        >
          <span className="text-[13px] font-semibold text-white">
            Nền Tảng Phân Tích Thống Kê #1 Cho Nghiên Cứu Khoa Học
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: easeOutExpo }}
          className="text-display-xl text-white mt-6"
        >
          Phân Tích Thống Kê Khoa Học — Đơn Giản & Chính Xác
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5, ease: easeOutExpo }}
          className="text-body-lg text-white/75 max-w-[640px] mx-auto mt-5"
        >
          Nhập dữ liệu, chạy phân tích T-test, ANOVA, Hồi quy, vẽ biểu đồ và xuất báo cáo — tất cả trên nền tảng đám mây. Không cần cài đặt phần mềm.
        </motion.p>

        {/* CTA group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5, ease: easeOutExpo }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-9"
        >
          <Link
            to="/register"
            className="px-6 py-3.5 text-base font-medium rounded-btn bg-accent-orange text-white hover:bg-[#D4632E] transition-all duration-200 hover:scale-[1.02]"
          >
            Bắt Đầu Miễn Phí
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3.5 text-base font-medium rounded-btn border border-white/30 text-white hover:bg-white/[0.08] transition-all duration-200"
          >
            Xem Demo
          </Link>
        </motion.div>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.8, ease: easeOutExpo }}
          className="mt-12 mx-auto"
          style={{ perspective: '1200px' }}
        >
          <img
            src="/hero-dashboard.png"
            alt="Dashboard preview"
            className="w-[85%] max-w-[1000px] mx-auto rounded-card shadow-[0_24px_80px_rgba(0,0,0,0.3)]"
            style={{ transform: 'rotateX(4deg)' }}
          />
        </motion.div>
      </div>
    </section>
  )
}

/* ==========================================
   Section 2 — Stats Bar
   ========================================== */
function StatsBar() {
  const stat1 = useAnimatedCounter(15000, '+')
  const stat2 = useAnimatedCounter(50000, '+')
  const stat3 = useAnimatedCounter(8, ' Phương Pháp')
  const stat4 = useAnimatedCounter(99, '.8%', 1500)

  const stats = [
    { ref: stat1.ref, value: stat1.display, label: 'Nhà Nghiên Cứu Tin Dùng' },
    { ref: stat2.ref, value: stat2.display, label: 'Phân Tích Đã Thực Hiện' },
    { ref: stat3.ref, value: stat3.display, label: 'Thống Kê Đa Dạng' },
    { ref: stat4.ref, value: stat4.display, label: 'Độ Chính Xác Kết Quả' },
  ]

  return (
    <section className="bg-white py-12">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: easeOutExpo }}
              className="text-center"
            >
              <div ref={stat.ref} className="text-data-lg text-primary-700">
                {stat.value}
              </div>
              <p className="text-body-sm text-neutral-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ==========================================
   Section 3 — Features Grid
   ========================================== */
const features = [
  {
    icon: Upload,
    image: '/feature-data-import.png',
    title: 'Nhập Dữ Liệu Dễ Dàng',
    body: 'Nhập dữ liệu từ file CSV, Excel (.xlsx), hoặc Google Sheets. Hệ thống tự động nhận diện kiểu dữ liệu và đề xuất phân tích phù hợp.',
    link: 'Tìm Hiểu Thêm',
  },
  {
    icon: Sigma,
    image: '/feature-statistics.png',
    title: 'Phân Tích Thống Kê Toàn Diện',
    body: 'Chạy T-test, ANOVA, Kiểm định Chi-square, Tương quan Pearson/Spearman, Hồi quy tuyến tính & Logistic. Kết quả đầy đủ với p-value, khoảng tin cậy, và kiểm định giả định.',
    link: 'Xem Các Phép Phân Tích',
  },
  {
    icon: BarChart3,
    image: '/feature-charts.png',
    title: 'Trực Quan Hóa Dữ Liệu',
    body: 'Tạo 6 loại biểu đồ chuyên nghiệp: Cột, Đường, Tròn, Phân tán, Hộp, và Tần suất. Tùy chỉnh màu sắc, nhãn, và định dạng xuất.',
    link: 'Khám Phá Biểu Đồ',
  },
  {
    icon: FileText,
    image: '/feature-reports.png',
    title: 'Báo Cáo Kết Quả Tự Động',
    body: 'Xuất báo cáo hoàn chỉnh với bảng kết quả, biểu đồ, và diễn giải thống kê. Định dạng PDF hoặc Word, sẵn sàng nộp cho hội đồng khoa học.',
    link: 'Xem Mẫu Báo Cáo',
  },
]

function FeaturesGrid() {
  return (
    <section id="features" className="bg-neutral-50 py-24">
      <div className="max-w-landing mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center"
        >
          <span className="text-xs font-bold tracking-[0.1em] text-primary-700 uppercase">
            TÍNH NĂNG NỔI BẬT
          </span>
          <h2 className="text-display-lg text-primary-900 mt-3">
            Mọi Công Cụ Bạn Cần Cho Phân Tích Dữ Liệu
          </h2>
          <p className="text-body-lg text-neutral-500 max-w-[560px] mx-auto mt-4">
            Từ nhập dữ liệu đến xuất báo cáo — một nền tảng hoàn chỉnh cho nghiên cứu khoa học.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: easeOutExpo }}
              className="group bg-white rounded-card-lg overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200"
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary-700" />
                  </div>
                  <h3 className="text-heading-md text-primary-900">{feature.title}</h3>
                </div>
                <p className="text-body-md text-neutral-600">{feature.body}</p>
                <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 mt-4 hover:underline">
                  {feature.link} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ==========================================
   Section 4 — Analysis Methods
   ========================================== */
const methods = [
  { icon: GitCompare, color: '#1B5F99', bg: '#E8F5FC', title: 'T-test', desc: 'So sánh trung bình giữa 2 nhóm độc lập hoặc cặp.', example: 'Ví dụ: So sánh điểm thi trước và sau khóa học.' },
  { icon: Grid3X3, color: '#2A9D8F', bg: '#E6F7F5', title: 'ANOVA', desc: 'Phân tích phương sai cho 3+ nhóm. Kiểm định sự khác biệt đồng thờ.', example: 'Ví dụ: So sánh hiệu quả 4 phương pháp điều trị.' },
  { icon: Table2, color: '#F4A261', bg: '#FFF8ED', title: 'Chi-square', desc: 'Kiểm định mức độ liên quan giữa 2 biến phân loại.', example: 'Ví dụ: Mối liên hệ giữa giới tính và lựa chọn nghề nghiệp.' },
  { icon: ScatterChart, color: '#8B5CF6', bg: '#F3F0FF', title: 'Correlation', desc: 'Đo lường mối tương quan giữa 2 biến liên tục.', example: 'Ví dụ: Mối liên hệ giữa tuổi và huyết áp.' },
  { icon: TrendingUp, color: '#E76F51', bg: '#FEF2F2', title: 'Regression', desc: 'Mô hình hóa mối quan hệ giữa biến phụ thuộc và biến độc lập.', example: 'Ví dụ: Dự đoán doanh số từ chi tiêu quảng cáo.' },
  { icon: Spline, color: '#06B6D4', bg: '#ECFEFF', title: 'Logistic Regression', desc: 'Mô hình hóa xác suất cho biến phân loại nhị giá trị.', example: 'Ví dụ: Dự đoán khả năng đậu đại học.' },
  { icon: Calculator, color: '#1B5F99', bg: '#E8F5FC', title: 'Descriptive Stats', desc: 'Thống kê mô tả: trung bình, độ lệch chuẩn, phân vị.', example: 'Ví dụ: Tóm tắt đặc điểm mẫu nghiên cứu.' },
  { icon: Activity, color: '#84CC16', bg: '#F7FEE7', title: 'Normality Test', desc: 'Kiểm tra phân phối chuẩn của dữ liệu.', example: 'Ví dụ: Shapiro-Wilk, Kolmogorov-Smirnov.' },
]

function AnalysisMethods() {
  return (
    <section id="analysis" className="bg-white py-24">
      <div className="max-w-landing mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center"
        >
          <span className="text-xs font-bold tracking-[0.1em] text-primary-700 uppercase">
            PHƯƠNG PHÁP PHÂN TÍCH
          </span>
          <h2 className="text-display-lg text-primary-900 mt-3">
            8 Phương Pháp Thống Kê Chuyên Sâu
          </h2>
          <p className="text-body-lg text-neutral-500 max-w-[560px] mx-auto mt-4">
            Phù hợp cho mọi loại dữ liệu và mục tiêu nghiên cứu.
          </p>
        </motion.div>

        {/* Method cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {methods.map((method, i) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: easeOutExpo }}
              className="group bg-neutral-50 border border-neutral-200 rounded-card p-6 hover:border-primary-300 transition-colors duration-200"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: method.bg }}
              >
                <method.icon className="w-5 h-5" style={{ color: method.color }} />
              </div>
              <h3 className="text-heading-sm text-primary-900 mb-2">{method.title}</h3>
              <p className="text-body-sm text-neutral-500 mb-2 line-clamp-2">{method.desc}</p>
              <p className="text-body-sm text-neutral-600">{method.example}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ==========================================
   Section 5 — Charts Showcase
   ========================================== */
const chartTypes = [
  { name: 'Biểu Đồ Cột (Bar Chart)', desc: 'So sánh giá trị giữa các nhóm hoặc danh mục.', color: '#1B5F99' },
  { name: 'Biểu Đồ Đường (Line Chart)', desc: 'Hiển thị xu hướng theo thờ gian hoặc chuỗi liên tục.', color: '#E8723A' },
  { name: 'Biểu Đồ Tròn (Pie Chart)', desc: 'Thể hiện tỷ lệ phần trăm của các phần trong tổng thể.', color: '#2A9D8F' },
  { name: 'Biểu Đồ Phân Tán (Scatter Plot)', desc: 'Khám phá mối quan hệ giữa 2 biến số.', color: '#8B5CF6' },
  { name: 'Biểu Đồ Hộp (Box Plot)', desc: 'So sánh phân phối giữa các nhóm, hiển thị ngoại lai.', color: '#F4A261' },
  { name: 'Biểu Đồ Tần Suất (Histogram)', desc: 'Hiển thị phân phối tần suất của một biến liên tục.', color: '#E76F51' },
]

function BarChartPreview({ color }: { color: string }) {
  const bars = [65, 45, 80, 55, 70]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {bars.map((h, i) => (
        <rect key={i} x={20 + i * 35} y={110 - h} width="25" height={h} fill={color} opacity={0.7 + i * 0.06} rx="3">
          <animate attributeName="height" from="0" to={h} dur="0.8s" begin={`${i * 0.1}s`} fill="freeze" />
          <animate attributeName="y" from="110" to={110 - h} dur="0.8s" begin={`${i * 0.1}s`} fill="freeze" />
        </rect>
      ))}
      <line x1="10" y1="110" x2="190" y2="110" stroke="#E5E7EB" strokeWidth="1" />
    </svg>
  )
}

function LineChartPreview({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <polyline
        points="20,85 60,55 100,70 140,30 180,45"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate attributeName="stroke-dasharray" from="0,300" to="300,0" dur="1s" fill="freeze" />
      </polyline>
      {[[20,85],[60,55],[100,70],[140,30],[180,45]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill={color}>
          <animate attributeName="r" from="0" to="4" dur="0.3s" begin={`${0.5 + i * 0.1}s`} fill="freeze" />
        </circle>
      ))}
      <line x1="10" y1="110" x2="190" y2="110" stroke="#E5E7EB" strokeWidth="1" />
    </svg>
  )
}

function PieChartPreview({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <circle cx="100" cy="60" r="45" fill={color} opacity="0.8">
        <animate attributeName="r" from="0" to="45" dur="0.6s" fill="freeze" />
      </circle>
      <path d="M100,60 L100,15 A45,45 0 0,1 145,60 Z" fill="#E8723A" opacity="0.7">
        <animateTransform attributeName="transform" type="scale" from="0" to="1" dur="0.6s" begin="0.3s" fill="freeze" additive="sum" />
      </path>
      <path d="M100,60 L145,60 A45,45 0 0,1 55,105 Z" fill="#2A9D8F" opacity="0.6">
        <animateTransform attributeName="transform" type="scale" from="0" to="1" dur="0.6s" begin="0.5s" fill="freeze" additive="sum" />
      </path>
    </svg>
  )
}

function ScatterChartPreview({ color }: { color: string }) {
  const points = [[40,30],[70,50],[90,25],[120,60],[150,35],[60,70],[110,45],[140,55],[80,40],[130,65],[50,55],[100,35],[160,50],[30,60],[170,40]]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {points.map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="3.5" fill={color} opacity={0.6 + (i%3)*0.1}>
          <animate attributeName="r" from="0" to="3.5" dur="0.3s" begin={`${i * 0.04}s`} fill="freeze" />
        </circle>
      ))}
      <line x1="10" y1="110" x2="190" y2="110" stroke="#E5E7EB" strokeWidth="1" />
      <line x1="10" y1="10" x2="10" y2="110" stroke="#E5E7EB" strokeWidth="1" />
    </svg>
  )
}

function BoxPlotPreview({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {[40,100,160].map((x,i) => (
        <g key={i}>
          <line x1={x} y1="30" x2={x} y2="90" stroke={color} strokeWidth="2" opacity={0.5 + i*0.15}>
            <animate attributeName="y1" from="60" to="30" dur="0.5s" begin={`${i*0.15}s`} fill="freeze" />
            <animate attributeName="y2" from="60" to="90" dur="0.5s" begin={`${i*0.15}s`} fill="freeze" />
          </line>
          <rect x={x-15} y="50" width="30" height="30" fill={color} opacity={0.3 + i*0.2} rx="2">
            <animate attributeName="height" from="0" to="30" dur="0.5s" begin={`${0.2 + i*0.15}s`} fill="freeze" />
            <animate attributeName="y" from="65" to="50" dur="0.5s" begin={`${0.2 + i*0.15}s`} fill="freeze" />
          </rect>
        </g>
      ))}
      <line x1="10" y1="110" x2="190" y2="110" stroke="#E5E7EB" strokeWidth="1" />
    </svg>
  )
}

function HistogramPreview({ color }: { color: string }) {
  const bars = [30, 55, 80, 65, 40, 25, 15]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {bars.map((h, i) => (
        <rect key={i} x={15 + i * 26} y={110 - h} width="22" height={h} fill={color} opacity={0.5 + i * 0.06} rx="2">
          <animate attributeName="height" from="0" to={h} dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
          <animate attributeName="y" from="110" to={110 - h} dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
        </rect>
      ))}
      <line x1="10" y1="110" x2="190" y2="110" stroke="#E5E7EB" strokeWidth="1" />
    </svg>
  )
}

const chartPreviews = [BarChartPreview, LineChartPreview, PieChartPreview, ScatterChartPreview, BoxPlotPreview, HistogramPreview]

function ChartsShowcase() {
  return (
    <section id="charts" className="bg-neutral-50 py-24">
      <div className="max-w-landing mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center"
        >
          <span className="text-xs font-bold tracking-[0.1em] text-primary-700 uppercase">
            TRỰC QUAN HÓA DỮ LIỆU
          </span>
          <h2 className="text-display-lg text-primary-900 mt-3">
            6 Loại Biểu Đồ Chuyên Nghiệp
          </h2>
          <p className="text-body-lg text-neutral-500 max-w-[560px] mx-auto mt-4">
            Tạo biểu đồ xuất bản phẩm chất chỉ với vài cú click.
          </p>
        </motion.div>

        {/* Chart cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {chartTypes.map((chart, i) => {
            const Preview = chartPreviews[i]
            return (
              <motion.div
                key={chart.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: easeOutExpo }}
                className="bg-white rounded-card p-5 shadow-card"
              >
                <div className="h-[200px] sm:h-[240px] bg-neutral-50 rounded-card-sm flex items-center justify-center p-4">
                  <Preview color={chart.color} />
                </div>
                <h3 className="text-heading-sm text-primary-900 mt-4">{chart.name}</h3>
                <p className="text-body-sm text-neutral-500 mt-1">{chart.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ==========================================
   Section 6 — How It Works
   ========================================== */
const steps = [
  { title: 'Nhập Dữ Liệu', body: 'Tải lên file CSV, Excel, hoặc nhập trực tiếp. Hệ thống tự động phát hiện kiểu dữ liệu.' },
  { title: 'Chọn Phân Tích', body: 'Chọn phương pháp thống kê phù hợp từ menu. Giao diện trực quan giúp bạn dễ dàng cấu hình.' },
  { title: 'Chạy Phân Tích', body: 'Nhấn nút và nhận kết quả trong giây lát. Kiểm định đầy đủ, p-value, và khoảng tin cậy.' },
  { title: 'Xuất Báo Cáo', body: 'Tạo báo cáo PDF hoặc Word với biểu đồ và bảng kết quả. Sẵn sàng trình bày.' },
]

function HowItWorks() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center"
        >
          <span className="text-xs font-bold tracking-[0.1em] text-primary-700 uppercase">
            QUY TRÌNH LÀM VIỆC
          </span>
          <h2 className="text-display-lg text-primary-900 mt-3">
            Phân Tích Dữ Liệu Chỉ Trong 4 Bước
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-200 -translate-x-1/2 hidden md:block" />

          {steps.map((step, i) => {
            const isLeft = i % 2 === 0
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: easeOutExpo }}
                className={`relative flex items-center gap-8 mb-12 last:mb-0 ${
                  isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                } flex-col`}
              >
                {/* Content */}
                <div className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'} text-center`}>
                  <h3 className="text-heading-md text-primary-900">{step.title}</h3>
                  <p className="text-body-md text-neutral-600 mt-2">{step.body}</p>
                </div>

                {/* Circle */}
                <div className="relative z-10 w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-semibold text-sm">{i + 1}</span>
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ==========================================
   Section 7 — Testimonials
   ========================================== */
const testimonials = [
  {
    quote: 'Nền tảng này đã giúp tôi tiết kiệm hàng giờ làm việc với SPSS. Giao diện trực quan, kết quả chính xác — hoàn hảo cho luận văn thạc sĩ của tôi.',
    name: 'Nguyễn Thị Minh Anh',
    role: 'Nghiên cứu sinh, ĐHQG Hà Nội',
    avatar: '/testimonial-avatar-1.jpg',
  },
  {
    quote: 'Tôi sử dụng để dạy thống kê cho sinh viên. Họ nắm bắt nhanh hơn rất nhiều so với phần mềm truyền thống. Việc xuất báo cáo cũng rất tiện lợi.',
    name: 'PGS.TS. Trần Văn Hùng',
    role: 'Khoa Y, Đại học Y Dược TP.HCM',
    avatar: '/testimonial-avatar-2.jpg',
  },
  {
    quote: 'Từ nhập dữ liệu đến xuất biểu đồ — mọi thứ đều mượt mà. Tôi đặc biệt thích tính năng kiểm định giả định tự động.',
    name: 'Lê Hoàng Nam',
    role: 'Chuyên viên phân tích dữ liệu, VNPT',
    avatar: '/testimonial-avatar-3.jpg',
  },
]

function Testimonials() {
  return (
    <section className="bg-primary-900 py-24">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center"
        >
          <span className="text-xs font-bold tracking-[0.1em] text-white/50 uppercase">
            PHẢN HỒI
          </span>
          <h2 className="text-display-lg text-white mt-3">
            Nhà Nghiên Cứu Nói Gì Về Chúng Tôi?
          </h2>
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: easeOutExpo }}
              className="bg-white/[0.06] border border-white/10 rounded-card-lg p-7"
            >
              <p className="text-body-md text-white/85 italic leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 mt-6">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-heading-sm text-white">{t.name}</h4>
                  <p className="text-body-sm text-white/50">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ==========================================
   Section 8 — Pricing
   ========================================== */
const freeFeatures = [
  { text: 'Tối đa 3 dự án', included: true },
  { text: 'Nhập 100 dòng dữ liệu', included: true },
  { text: '3 phương pháp phân tích cơ bản', included: true },
  { text: '2 loại biểu đồ', included: true },
  { text: 'Báo cáo xuất', included: false },
  { text: 'Lưu trữ dữ liệu', included: false },
]

const proFeatures = [
  { text: 'Không giới hạn dự án', included: true },
  { text: 'Nhập 10,000 dòng dữ liệu', included: true },
  { text: 'Tất cả 8 phương pháp phân tích', included: true },
  { text: 'Tất cả 6 loại biểu đồ', included: true },
  { text: 'Xuất báo cáo PDF/Word', included: true },
  { text: 'Lưu trữ dữ liệu đám mây', included: true },
]

const enterpriseFeatures = [
  { text: 'Tất cả tính năng Chuyên Nghiệp', included: true },
  { text: 'Không giới hạn dữ liệu', included: true },
  { text: 'API truy cập', included: true },
  { text: 'Hỗ trợ 24/7', included: true },
  { text: 'Tùy chỉnh thương hiệu', included: true },
  { text: 'Đào tạo nhóm', included: true },
]

function PricingCard({
  name,
  price,
  period,
  features,
  highlighted = false,
  badge,
  cta,
  ctaStyle,
}: {
  name: string
  price: string
  period?: string
  features: { text: string; included: boolean }[]
  highlighted?: boolean
  badge?: string
  cta: string
  ctaStyle: 'primary' | 'secondary'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      className={`relative bg-white rounded-card-lg p-8 ${
        highlighted
          ? 'border-2 border-primary-700 animate-pulse-glow'
          : 'border border-neutral-200'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-700 text-white text-xs font-bold rounded-full">
          {badge}
        </div>
      )}
      <h3 className="text-heading-lg text-primary-900">{name}</h3>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-display-md text-primary-900">{price}</span>
        {period && <span className="text-body-md text-neutral-500">{period}</span>}
      </div>
      <hr className="border-neutral-200 my-5" />
      <ul className="space-y-3">
        {features.map((f) => (
          <li key={f.text} className="flex items-center gap-3">
            {f.included ? (
              <Check className="w-5 h-5 text-accent-teal flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            )}
            <span className={`text-body-md ${f.included ? 'text-neutral-700' : 'text-neutral-400'}`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
      <Link
        to="/register"
        className={`block text-center mt-6 py-3 rounded-btn font-medium transition-all duration-200 ${
          ctaStyle === 'primary'
            ? 'bg-primary-700 text-white hover:bg-primary-600 hover:scale-[1.02]'
            : 'border border-primary-700 text-primary-700 hover:bg-primary-50'
        }`}
      >
        {cta}
      </Link>
    </motion.div>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="bg-neutral-50 py-24">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          className="text-center"
        >
          <span className="text-xs font-bold tracking-[0.1em] text-primary-700 uppercase">
            BẢNG GIÁ
          </span>
          <h2 className="text-display-lg text-primary-900 mt-3">
            Chọn Gói Phù Hợp Với Bạn
          </h2>
          <p className="text-body-lg text-neutral-500 max-w-[560px] mx-auto mt-4">
            Bắt đầu miễn phí. Nâng cấp khi bạn cần nhiều hơn.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <PricingCard
            name="Miễn Phí"
            price="0đ"
            period="/tháng"
            features={freeFeatures}
            cta="Đăng Ký Ngay"
            ctaStyle="secondary"
          />
          <PricingCard
            name="Chuyên Nghiệp"
            price="199,000đ"
            period="/tháng"
            features={proFeatures}
            highlighted
            badge="PHỔ BIẾN NHẤT"
            cta="Bắt Đầu Dùng Thử"
            ctaStyle="primary"
          />
          <PricingCard
            name="Doanh Nghiệp"
            price="Liên Hệ"
            features={enterpriseFeatures}
            cta="Liên Hệ"
            ctaStyle="secondary"
          />
        </div>
      </div>
    </section>
  )
}

/* ==========================================
   Section 9 — CTA Banner
   ========================================== */
function CTABanner() {
  return (
    <section
      className="py-20"
      style={{ background: 'linear-gradient(135deg, #0C2D57 0%, #1B5F99 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="max-w-[640px] mx-auto px-4 sm:px-6 text-center"
      >
        <h2 className="text-display-md text-white">
          Sẵn Sàng Bắt Đầu Phân Tích Dữ Liệu?
        </h2>
        <p className="text-body-lg text-white/75 mt-4">
          Đăng ký miễn phí ngay hôm nay. Không cần thẻ tín dụng.
        </p>
        <Link
          to="/register"
          className="inline-block mt-7 px-6 py-3.5 text-base font-medium rounded-btn bg-accent-orange text-white hover:bg-[#D4632E] transition-all duration-200 hover:scale-[1.02]"
        >
          Tạo Tài Khoản Miễn Phí
        </Link>
      </motion.div>
    </section>
  )
}

/* ==========================================
   Home Page — Compose all sections
   ========================================== */
export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <AnalysisMethods />
      <ChartsShowcase />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTABanner />
    </div>
  )
}
