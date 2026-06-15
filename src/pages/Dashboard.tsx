import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FolderOpen,
  Sigma,
  Database,
  FileText,
  ArrowUp,
  Eye,
  Download,
  Loader2,
  XCircle,
  RotateCcw,
  Trash2,
  Plus,
  BarChart3,
  FileBarChart,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const activityData = [
  { day: 'T2', count: 5 },
  { day: 'T3', count: 8 },
  { day: 'T4', count: 3 },
  { day: 'T5', count: 10 },
  { day: 'T6', count: 7 },
  { day: 'T7', count: 4 },
  { day: 'CN', count: 6 },
]

const analysisDistribution = [
  { name: 'T-test', value: 35, color: '#1B5F99' },
  { name: 'ANOVA', value: 20, color: '#E8723A' },
  { name: 'Correlation', value: 15, color: '#2A9D8F' },
  { name: 'Regression', value: 15, color: '#8B5CF6' },
  { name: 'Chi-square', value: 10, color: '#F4A261' },
  { name: 'Khác', value: 5, color: '#9CA3AF' },
]

const recentAnalyses = [
  {
    id: 1,
    name: 'So sánh điểm thi',
    method: 'T-test',
    project: 'NCKH Giáo Dục',
    date: '15/01/2025',
    status: 'completed' as const,
  },
  {
    id: 2,
    name: 'Phân tích phương sai',
    method: 'ANOVA',
    project: 'Y Học Lâm Sàng',
    date: '14/01/2025',
    status: 'completed' as const,
  },
  {
    id: 3,
    name: 'Tương quan yếu tố',
    method: 'Correlation',
    project: 'Kinh Tế Vĩ Mô',
    date: '14/01/2025',
    status: 'running' as const,
  },
  {
    id: 4,
    name: 'Hồi quy đa biến',
    method: 'Regression',
    project: 'Dự Báo Giá Nhà',
    date: '13/01/2025',
    status: 'completed' as const,
  },
  {
    id: 5,
    name: 'Kiểm định độc lập',
    method: 'Chi-square',
    project: 'Khảo Sát Xã Hội',
    date: '12/01/2025',
    status: 'error' as const,
  },
]

const activityFeed = [
  { id: 1, dot: '#2A9D8F', text: 'Bạn đã hoàn thành phân tích T-test', time: '2 phút trước' },
  { id: 2, dot: '#1B5F99', text: 'Đã xuất báo cáo PDF — "Kết quả ANOVA"', time: '1 giờ trước' },
  { id: 3, dot: '#E8723A', text: 'Đã nhập bộ dữ liệu mới (500 dòng)', time: '3 giờ trước' },
  { id: 4, dot: '#8B5CF6', text: 'Minh Anh đã mờ bạn vào dự án "Y Học"', time: 'Hôm qua' },
  { id: 5, dot: '#2A9D8F', text: 'Hoàn thành kiểm định Chi-square', time: 'Hôm qua' },
]

const recentProjects = [
  {
    id: 1,
    name: 'NCKH Giáo Dục 2025',
    status: 'active' as const,
    description: 'Nghiên cứu hiệu quả phương pháp dạy học mới',
    analyses: 5,
    datasets: 3,
    members: 2,
    progress: 75,
  },
  {
    id: 2,
    name: 'Y Học Lâm Sàng Q1',
    status: 'active' as const,
    description: 'Phân tích dữ liệu thử nghiệm lâm sàng',
    analyses: 8,
    datasets: 4,
    members: 3,
    progress: 60,
  },
  {
    id: 3,
    name: 'Kinh Tế Vĩ Mô',
    status: 'completed' as const,
    description: 'Tương quan yếu tố kinh tế vĩ mô',
    analyses: 12,
    datasets: 6,
    members: 2,
    progress: 100,
  },
]

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: easeOutExpo },
  }),
}

/* ------------------------------------------------------------------ */
/*  Count-up hook                                                      */
/* ------------------------------------------------------------------ */

function useCountUp(end: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(2, -10 * progress)
        setValue(Math.round(eased * end))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(rafRef.current)
    }
  }, [end, duration, delay])

  return value
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                               */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: 'completed' | 'running' | 'error' }) {
  if (status === 'completed') {
    return (
      <Badge className="bg-accent-teal-light text-accent-teal hover:bg-accent-teal-light border-0 font-semibold text-xs">
        Hoàn Thành
      </Badge>
    )
  }
  if (status === 'running') {
    return (
      <Badge className="bg-primary-100 text-primary-700 hover:bg-primary-100 border-0 font-semibold text-xs animate-pulse">
        Đang Chạy
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-50 text-red-500 hover:bg-red-50 border-0 font-semibold text-xs">
      Lỗi
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard component                                          */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate()

  const totalProjects = useCountUp(12, 1200, 400)
  const totalAnalyses = useCountUp(8, 1200, 460)
  const totalDatasets = useCountUp(45, 1200, 520)
  const totalReports = useCountUp(28, 1200, 580)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ---- Section 1: Welcome Banner ---- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.2 }}
        >
          <Card className="border-0 bg-gradient-to-br from-[#0C2D57] to-[#1B5F99] text-white rounded-card">
            <CardContent className="p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-heading-lg text-white">Chào buổi sáng, Minh Anh!</h2>
                <p className="text-body-md text-white/75 mt-2 max-w-[480px]">
                  Bạn có 3 phân tích đang chờ xử lý và 2 báo cáo mới được tạo trong tuần này.
                </p>
              </div>
              <Button
                variant="outline"
                className="bg-white/[0.15] text-white border-white/25 hover:bg-white/25 hover:text-white rounded-btn self-start"
                onClick={() => navigate('/projects')}
              >
                Xem Dự Án
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ---- Section 2: KPI Cards ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: FolderOpen,
              iconBg: 'bg-primary-100',
              iconColor: 'text-primary-700',
              value: totalProjects,
              label: 'Dự án phân tích',
              change: '+3 tháng này',
              changeColor: 'text-accent-teal',
            },
            {
              icon: Sigma,
              iconBg: 'bg-accent-orange-light',
              iconColor: 'text-accent-orange',
              value: totalAnalyses,
              label: 'Phép phân tích',
              change: '+2 so với hôm qua',
              changeColor: 'text-accent-teal',
            },
            {
              icon: Database,
              iconBg: 'bg-accent-teal-light',
              iconColor: 'text-accent-teal',
              value: totalDatasets,
              label: 'Bộ dữ liệu đã nhập',
              change: '5 mới tuần này',
              changeColor: 'text-neutral-500',
            },
            {
              icon: FileText,
              iconBg: 'bg-[#F3F0FF]',
              iconColor: 'text-[#8B5CF6]',
              value: totalReports,
              label: 'Báo cáo đã tạo',
              change: '+7 tháng này',
              changeColor: 'text-accent-teal',
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <Card className="rounded-card border border-neutral-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${kpi.iconBg} flex items-center justify-center`}>
                      <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-data-lg text-primary-900">{kpi.value}</div>
                    <div className="text-body-sm text-neutral-500 mt-0.5">{kpi.label}</div>
                    <div className={`text-body-sm ${kpi.changeColor} mt-1 flex items-center gap-1`}>
                      {kpi.changeColor === 'text-accent-teal' && <ArrowUp className="w-3 h-3" />}
                      {kpi.change}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ---- Section 3: Main Split (Recent Analyses + Quick Actions / Activity) ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Recent Analyses Table */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.6 }}
          >
            <Card className="rounded-card border border-neutral-200 shadow-card">
              <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-neutral-200">
                <CardTitle className="text-heading-lg text-primary-900">Phân Tích Gần Đây</CardTitle>
                <Button
                  variant="link"
                  className="text-primary-700 font-semibold text-sm p-0 h-auto"
                  onClick={() => navigate('/analysis')}
                >
                  Xem Tất Cả →
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 text-neutral-700 text-[13px] font-semibold">
                        <th className="text-left px-4 py-3">Tên Phân Tích</th>
                        <th className="text-left px-4 py-3">Phương Pháp</th>
                        <th className="text-left px-4 py-3">Dự Án</th>
                        <th className="text-left px-4 py-3">Ngày</th>
                        <th className="text-left px-4 py-3">Trạng Thái</th>
                        <th className="text-left px-4 py-3">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAnalyses.map((row, idx) => (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + idx * 0.04, duration: 0.3, ease: easeOutExpo }}
                          className="border-t border-neutral-100 hover:bg-neutral-100 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-neutral-900">{row.name}</td>
                          <td className="px-4 py-3 text-neutral-700">
                            <Badge variant="outline" className="text-xs font-medium">{row.method}</Badge>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">{row.project}</td>
                          <td className="px-4 py-3 text-neutral-600">{row.date}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {row.status === 'completed' && (
                                <>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-neutral-500 hover:text-primary-700">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-neutral-500 hover:text-primary-700">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {row.status === 'running' && (
                                <>
                                  <Loader2 className="w-4 h-4 text-primary-700 animate-spin" />
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-neutral-500 hover:text-red-500">
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {row.status === 'error' && (
                                <>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-neutral-500 hover:text-primary-700">
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-neutral-500 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Quick Actions + Activity Feed */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.7 }}
          >
            {/* Quick Actions */}
            <Card className="rounded-card border border-neutral-200 shadow-card">
              <CardHeader className="px-5 py-4 border-b border-neutral-200">
                <CardTitle className="text-heading-lg text-primary-900">Thao Tác Nhanh</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <Button
                  className="w-full bg-primary-700 hover:bg-primary-600 text-white rounded-btn"
                  onClick={() => navigate('/projects')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo Dự Án Mới
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-primary-700 text-primary-700 hover:bg-primary-50 rounded-btn"
                  onClick={() => navigate('/data')}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Nhập Dữ Liệu
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-primary-700 text-primary-700 hover:bg-primary-50 rounded-btn"
                  onClick={() => navigate('/analysis')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Chạy Phân Tích
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-primary-700 text-primary-700 hover:bg-primary-50 rounded-btn"
                  onClick={() => navigate('/reports')}
                >
                  <FileBarChart className="w-4 h-4 mr-2" />
                  Tạo Báo Cáo
                </Button>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="rounded-card border border-neutral-200 shadow-card">
              <CardHeader className="px-5 py-4 border-b border-neutral-200">
                <CardTitle className="text-heading-lg text-primary-900">Hoạt Động Gần Đây</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activityFeed.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + idx * 0.06, duration: 0.3, ease: easeOutExpo }}
                    className="flex items-start gap-3 px-5 py-3.5 border-b border-neutral-100 last:border-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: item.dot }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-neutral-800 leading-snug">{item.text}</p>
                      <p className="text-body-sm text-neutral-500 mt-0.5">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ---- Section 4: Charts Row ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.8 }}
          >
            <Card className="rounded-card border border-neutral-200 shadow-card">
              <CardHeader className="px-6 py-5">
                <CardTitle className="text-heading-lg text-primary-900">
                  Phân Bố Phân Tích Theo Phương Pháp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={analysisDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {analysisDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, 'Tỷ lệ']}
                      contentStyle={{ borderRadius: 8, fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {analysisDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-body-sm text-neutral-700">{item.name}</span>
                      <span className="text-body-sm text-neutral-500">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.9 }}
          >
            <Card className="rounded-card border border-neutral-200 shadow-card">
              <CardHeader className="px-6 py-5">
                <CardTitle className="text-heading-lg text-primary-900">
                  Hoạt Động 7 Ngày Gần Đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={activityData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B5F99" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1B5F99" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 13 }}
                      formatter={(value: number) => [`${value} phân tích`, 'Số lượng']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1B5F99"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ---- Section 5: Recent Projects ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOutExpo, delay: 1.0 }}
        >
          <Card className="rounded-card border border-neutral-200 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-neutral-200">
              <CardTitle className="text-heading-lg text-primary-900">Dự Án Gần Đây</CardTitle>
              <Button
                variant="link"
                className="text-primary-700 font-semibold text-sm p-0 h-auto"
                onClick={() => navigate('/projects')}
              >
                Quản Lý Dự Án →
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentProjects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.05 + idx * 0.08, duration: 0.4, ease: easeOutExpo }}
                  >
                    <Card
                      className="bg-neutral-50 border border-neutral-200 rounded-[10px] p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                      onClick={() => navigate('/projects')}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-heading-sm text-primary-900">{project.name}</h4>
                        <Badge
                          className={
                            project.status === 'active'
                              ? 'bg-primary-100 text-primary-700 border-0 font-semibold text-[11px]'
                              : 'bg-accent-teal-light text-accent-teal border-0 font-semibold text-[11px]'
                          }
                        >
                          {project.status === 'active' ? 'Đang Hoạt Động' : 'Hoàn Thành'}
                        </Badge>
                      </div>
                      <p className="text-body-sm text-neutral-500 mt-1 line-clamp-1">{project.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-body-sm text-neutral-700">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5" />
                          {project.analyses} phân tích
                        </span>
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-3.5 h-3.5" />
                          {project.datasets} bộ dữ liệu
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary-700 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 0.8, ease: easeOutExpo, delay: 1.2 + idx * 0.1 }}
                          />
                        </div>
                      </div>
                      <p className="text-body-sm text-neutral-400 mt-2">Cập nhật: 2 giờ trước</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}
