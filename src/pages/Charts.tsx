import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  PieChart,
  ScatterChart,
  BoxSelect,
  BarChart,
  RefreshCw,
  Download,
  Copy,
  Type,
  Palette,
  Grid3X3,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BarChart as ReBarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  ScatterChart as ReScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'boxplot' | 'histogram'

interface ChartConfig {
  title: string
  xLabel: string
  yLabel: string
  showLegend: boolean
  showGrid: boolean
  colorIndex: number
}

/* ------------------------------------------------------------------ */
/*  Mock Data — Vietnamese                                             */
/* ------------------------------------------------------------------ */

const COLORS = [
  ['#1B5F99', '#E8723A', '#2A9D8F', '#F4A261', '#8B5CF6', '#E76F51'],
  ['#0C2D57', '#134074', '#1B5F99', '#247BA0', '#3A9BD0', '#6BBBE0'],
  ['#E8723A', '#F4A261', '#F59E0B', '#FCD34D', '#FDE68A', '#FEF3C7'],
  ['#2A9D8F', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A78BFA'],
  ['#E76F51', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A'],
  ['#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#F43F5E'],
]

const PALETTE_NAMES = [
  'Mặc định',
  'Xanh dương',
  'Cam ấm',
  'Lạnh',
  'Đỏ đậm',
  'Cầu vồng',
]

// Bar chart: Doanh thu theo tháng
const barData = [
  { name: 'Tháng 1', doanhThu: 1250, chiPhi: 980 },
  { name: 'Tháng 2', doanhThu: 1380, chiPhi: 1050 },
  { name: 'Tháng 3', doanhThu: 1520, chiPhi: 1100 },
  { name: 'Tháng 4', doanhThu: 1180, chiPhi: 1020 },
  { name: 'Tháng 5', doanhThu: 1680, chiPhi: 1150 },
  { name: 'Tháng 6', doanhThu: 1950, chiPhi: 1280 },
  { name: 'Tháng 7', doanhThu: 1720, chiPhi: 1180 },
  { name: 'Tháng 8', doanhThu: 2100, chiPhi: 1350 },
]

// Line chart: Nhiệt độ theo thờ gian
const lineData = [
  { name: '6:00', hn: 24, hcm: 28, dn: 26 },
  { name: '9:00', hn: 29, hcm: 32, dn: 30 },
  { name: '12:00', hn: 34, hcm: 35, dn: 33 },
  { name: '15:00', hn: 32, hcm: 34, dn: 31 },
  { name: '18:00', hn: 28, hcm: 30, dn: 29 },
  { name: '21:00', hn: 26, hcm: 29, dn: 27 },
]

// Pie chart: Thị phần
const pieData = [
  { name: 'Samsung', value: 32 },
  { name: 'Apple', value: 24 },
  { name: 'Xiaomi', value: 18 },
  { name: 'Oppo', value: 14 },
  { name: 'Khác', value: 12 },
]

// Scatter chart: Chiều cao vs Cân nặng
const scatterData = [
  { x: 165, y: 58, z: 200 },
  { x: 170, y: 65, z: 200 },
  { x: 158, y: 52, z: 200 },
  { x: 175, y: 72, z: 200 },
  { x: 162, y: 55, z: 200 },
  { x: 180, y: 80, z: 200 },
  { x: 168, y: 62, z: 200 },
  { x: 155, y: 48, z: 200 },
  { x: 172, y: 68, z: 200 },
  { x: 178, y: 75, z: 200 },
  { x: 160, y: 50, z: 200 },
  { x: 169, y: 64, z: 200 },
  { x: 174, y: 70, z: 200 },
  { x: 166, y: 59, z: 200 },
  { x: 171, y: 67, z: 200 },
]

// Box plot data (rendered as custom SVG)
const boxplotData = [
  { group: 'Nhóm A', min: 45, q1: 55, median: 68, q3: 78, max: 88, outliers: [30, 95] },
  { group: 'Nhóm B', min: 50, q1: 60, median: 72, q3: 82, max: 92, outliers: [38] },
  { group: 'Nhóm C', min: 42, q1: 52, median: 62, q3: 74, max: 85, outliers: [98] },
  { group: 'Nhóm D', min: 48, q1: 58, median: 70, q3: 80, max: 90, outliers: [] },
]

// Histogram data: phân phối điểm thi
const histogramData = [
  { bin: '0-10', count: 2 },
  { bin: '10-20', count: 5 },
  { bin: '20-30', count: 12 },
  { bin: '30-40', count: 28 },
  { bin: '40-50', count: 45 },
  { bin: '50-60', count: 68 },
  { bin: '60-70', count: 85 },
  { bin: '70-80', count: 72 },
  { bin: '80-90', count: 48 },
  { bin: '90-100', count: 25 },
]

// Area chart: Lượt truy cập website theo tuần
const areaData = [
  { name: 'Tuần 1', desktop: 4200, mobile: 2800, tablet: 1200 },
  { name: 'Tuần 2', desktop: 4500, mobile: 3100, tablet: 1350 },
  { name: 'Tuần 3', desktop: 3800, mobile: 3500, tablet: 1100 },
  { name: 'Tuần 4', desktop: 5100, mobile: 4200, tablet: 1600 },
  { name: 'Tuần 5', desktop: 4800, mobile: 3900, tablet: 1450 },
  { name: 'Tuần 6', desktop: 5600, mobile: 4600, tablet: 1800 },
  { name: 'Tuần 7', desktop: 6200, mobile: 5100, tablet: 1950 },
  { name: 'Tuần 8', desktop: 5800, mobile: 4800, tablet: 1700 },
]

/* ------------------------------------------------------------------ */
/*  Chart definitions                                                   */
/* ------------------------------------------------------------------ */

const chartTypes: { id: ChartType; label: string; icon: typeof BarChart3; color: string }[] = [
  { id: 'bar', label: 'Biểu đồ cột', icon: BarChart3, color: '#1B5F99' },
  { id: 'line', label: 'Biểu đồ đường', icon: TrendingUp, color: '#2A9D8F' },
  { id: 'area', label: 'Biểu đồ vùng', icon: TrendingUp, color: '#06B6D4' },
  { id: 'pie', label: 'Biểu đồ tròn', icon: PieChart, color: '#E8723A' },
  { id: 'scatter', label: 'Biểu đồ phân tán', icon: ScatterChart, color: '#8B5CF6' },
  { id: 'boxplot', label: 'Biểu đồ hộp', icon: BoxSelect, color: '#F4A261' },
  { id: 'histogram', label: 'Biểu đồ tần suất', icon: BarChart, color: '#06B6D4' },
]

/* ------------------------------------------------------------------ */
/*  Custom Box Plot SVG Component                                       */
/* ------------------------------------------------------------------ */

function CustomBoxPlot({ data, colors }: { data: typeof boxplotData; colors: string[] }) {
  const svgWidth = 600
  const svgHeight = 360
  const padding = { top: 40, right: 30, bottom: 60, left: 50 }
  const plotWidth = svgWidth - padding.left - padding.right
  const plotHeight = svgHeight - padding.top - padding.bottom

  const allValues = data.flatMap((d) => [...[d.min, d.q1, d.median, d.q3, d.max], ...d.outliers])
  const minVal = Math.min(...allValues) - 5
  const maxVal = Math.max(...allValues) + 5

  const yScale = (v: number) =>
    padding.top + plotHeight - ((v - minVal) / (maxVal - minVal)) * plotHeight
  const xScale = (i: number) =>
    padding.left + (i * plotWidth) / data.length + plotWidth / data.length / 2
  const boxWidth = plotWidth / data.length / 3

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" style={{ minHeight: 360 }}>
      {/* Grid lines */}
      {Array.from({ length: 6 }).map((_, i) => {
        const y = padding.top + (i * plotHeight) / 5
        const val = Math.round(maxVal - (i * (maxVal - minVal)) / 5)
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#E5E7EB" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize={11} fill="#6B7280">
              {val}
            </text>
          </g>
        )
      })}

      {/* X axis */}
      <line x1={padding.left} y1={svgHeight - padding.bottom} x2={svgWidth - padding.right} y2={svgHeight - padding.bottom} stroke="#9CA3AF" strokeWidth={1} />
      {/* Y axis */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={svgHeight - padding.bottom} stroke="#9CA3AF" strokeWidth={1} />

      {data.map((d, i) => {
        const x = xScale(i)
        const yMin = yScale(d.min)
        const yQ1 = yScale(d.q1)
        const yMedian = yScale(d.median)
        const yQ3 = yScale(d.q3)
        const yMax = yScale(d.max)
        const color = colors[i % colors.length]

        return (
          <g key={d.group}>
            {/* Whiskers */}
            <line x1={x} y1={yMin} x2={x} y2={yMax} stroke={color} strokeWidth={1.5} />
            {/* Min cap */}
            <line x1={x - boxWidth / 2} y1={yMin} x2={x + boxWidth / 2} y2={yMin} stroke={color} strokeWidth={1.5} />
            {/* Max cap */}
            <line x1={x - boxWidth / 2} y1={yMax} x2={x + boxWidth / 2} y2={yMax} stroke={color} strokeWidth={1.5} />
            {/* Box (Q1 to Q3) */}
            <rect x={x - boxWidth} y={yQ3} width={boxWidth * 2} height={yQ1 - yQ3} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.5} rx={2} />
            {/* Median line */}
            <line x1={x - boxWidth} y1={yMedian} x2={x + boxWidth} y2={yMedian} stroke={color} strokeWidth={2} />
            {/* Outliers */}
            {d.outliers.map((o, oi) => (
              <circle key={oi} cx={x} cy={yScale(o)} r={5} fill="#E76F51" stroke="#FFFFFF" strokeWidth={1.5} />
            ))}
            {/* Label */}
            <text x={x} y={svgHeight - padding.bottom + 20} textAnchor="middle" fontSize={12} fill="#374151" fontWeight={500}>
              {d.group}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Tooltip style                                                       */
/* ------------------------------------------------------------------ */

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  color: '#111827',
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function Charts() {
  const [activeChart, setActiveChart] = useState<ChartType>('bar')
  const [config, setConfig] = useState<ChartConfig>({
    title: '',
    xLabel: '',
    yLabel: '',
    showLegend: true,
    showGrid: true,
    colorIndex: 0,
  })
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const currentColors = COLORS[config.colorIndex]

  const handleConfigChange = useCallback((updates: Partial<ChartConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1)
  }

  const getChartTitle = () => {
    if (config.title) return config.title
    const titles: Record<ChartType, string> = {
      bar: 'Doanh thu & Chi phí theo tháng',
      line: 'Nhiệt độ trung bình theo giờ',
      area: 'Lượt truy cập website theo tuần',
      pie: 'Thị phần điện thoại thông minh',
      scatter: 'Mối quan hệ Chiều cao - Cân nặng',
      boxplot: 'Phân phối điểm số theo nhóm',
      histogram: 'Phân phối tần suất điểm thi',
    }
    return titles[activeChart]
  }

  /* ---------------------------------------------------------------- */
  /*  Chart renderers                                                   */
  /* ---------------------------------------------------------------- */

  const renderChart = () => {
    const animationProps = { isAnimationActive: true, animationDuration: 800, animationEasing: 'ease-out' as const }

    switch (activeChart) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <ReBarChart data={barData} key={refreshKey} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />}
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} label={config.xLabel ? { value: config.xLabel, position: 'insideBottom', offset: -2, style: { fontSize: 13, fill: '#374151' } } : undefined} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} label={config.yLabel ? { value: config.yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#374151' } } : undefined} />
              <Tooltip contentStyle={tooltipStyle} />
              {config.showLegend && <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />}
              <Bar dataKey="doanhThu" name="Doanh thu (triệu đồng)" fill={currentColors[0]} radius={[4, 4, 0, 0]} {...animationProps} />
              <Bar dataKey="chiPhi" name="Chi phí (triệu đồng)" fill={currentColors[1]} radius={[4, 4, 0, 0]} {...animationProps} />
            </ReBarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={lineData} key={refreshKey} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />}
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} label={config.xLabel ? { value: config.xLabel, position: 'insideBottom', offset: -2, style: { fontSize: 13, fill: '#374151' } } : undefined} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} label={config.yLabel ? { value: config.yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#374151' } } : undefined} />
              <Tooltip contentStyle={tooltipStyle} />
              {config.showLegend && <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />}
              <Line type="monotone" dataKey="hn" name="Hà Nội" stroke={currentColors[0]} strokeWidth={2.5} dot={{ r: 5, fill: currentColors[0], strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} {...animationProps} />
              <Line type="monotone" dataKey="hcm" name="TP. HCM" stroke={currentColors[1]} strokeWidth={2.5} dot={{ r: 5, fill: currentColors[1], strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} {...animationProps} />
              <Line type="monotone" dataKey="dn" name="Đà Nẵng" stroke={currentColors[2]} strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 5, fill: currentColors[2], strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} {...animationProps} />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <AreaChart data={areaData} key={refreshKey} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />}
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} label={config.xLabel ? { value: config.xLabel, position: 'insideBottom', offset: -2, style: { fontSize: 13, fill: '#374151' } } : undefined} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} label={config.yLabel ? { value: config.yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#374151' } } : undefined} />
              <Tooltip contentStyle={tooltipStyle} />
              {config.showLegend && <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />}
              <Area type="monotone" dataKey="desktop" name="Desktop" stroke={currentColors[0]} fill={currentColors[0]} fillOpacity={0.15} strokeWidth={2} {...animationProps} />
              <Area type="monotone" dataKey="mobile" name="Mobile" stroke={currentColors[1]} fill={currentColors[1]} fillOpacity={0.15} strokeWidth={2} {...animationProps} />
              <Area type="monotone" dataKey="tablet" name="Tablet" stroke={currentColors[2]} fill={currentColors[2]} fillOpacity={0.15} strokeWidth={2} {...animationProps} />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <RePieChart key={refreshKey}>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value}%`, name]} />
              {config.showLegend && <Legend layout="vertical" verticalAlign="middle" align="left" wrapperStyle={{ fontSize: 13 }} />}
              <Pie data={pieData} cx="55%" cy="50%" innerRadius={70} outerRadius={140} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#9CA3AF' }} {...animationProps}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={currentColors[index % currentColors.length]} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <ReScatterChart key={refreshKey} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
              <XAxis type="number" dataKey="x" name="Chiều cao (cm)" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} label={config.xLabel ? { value: config.xLabel, position: 'insideBottom', offset: -2, style: { fontSize: 13, fill: '#374151' } } : { value: 'Chiều cao (cm)', position: 'insideBottom', offset: -2, style: { fontSize: 13, fill: '#374151' } }} />
              <YAxis type="number" dataKey="y" name="Cân nặng (kg)" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} label={config.yLabel ? { value: config.yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#374151' } } : { value: 'Cân nặng (kg)', angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#374151' } }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [name === 'x' ? `${value} cm` : `${value} kg`, name === 'x' ? 'Chiều cao' : 'Cân nặng']} />
              <Scatter data={scatterData} fill={currentColors[0]} {...animationProps} />
              <ReferenceLine stroke={currentColors[1]} strokeDasharray="8 4" />
            </ReScatterChart>
          </ResponsiveContainer>
        )

      case 'boxplot':
        return <CustomBoxPlot data={boxplotData} colors={currentColors} />

      case 'histogram':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <ReBarChart data={histogramData} key={refreshKey} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />}
              <XAxis dataKey="bin" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} label={config.xLabel ? { value: config.xLabel, position: 'insideBottom', offset: -2, style: { fontSize: 13, fill: '#374151' } } : { value: 'Khoảng điểm', position: 'insideBottom', offset: -2, style: { fontSize: 13, fill: '#374151' } }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} label={config.yLabel ? { value: config.yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#374151' } } : { value: 'Số lượng', angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#374151' } }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} sinh viên`, 'Số lượng']} />
              <Bar dataKey="count" name="Số sinh viên" fill={currentColors[0]} radius={[2, 2, 0, 0]} {...animationProps} />
            </ReBarChart>
          </ResponsiveContainer>
        )
    }
  }

  /* ---------------------------------------------------------------- */
  /*  JSX                                                                */
  /* ---------------------------------------------------------------- */

  return (
    <AppLayout>
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} className="mb-6">
        <h1 className="text-heading-xl text-primary-900">Trực quan hóa dữ liệu</h1>
        <p className="text-body-md text-neutral-500 mt-1">Tạo và tùy chỉnh biểu đồ trực quan cho dữ liệu nghiên cứu</p>
      </motion.div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* ─────────────── LEFT PANEL: Chart Type Selector ─────────────── */}
        <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} className="w-[280px] flex-shrink-0 flex flex-col gap-4 overflow-auto">
          <Card className="p-4 border border-neutral-200 shadow-card">
            <h2 className="text-heading-sm text-neutral-800 mb-4 pb-3 border-b border-neutral-200">Loại biểu đồ</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {chartTypes.map((ct, i) => {
                const Icon = ct.icon
                const isActive = activeChart === ct.id
                return (
                  <motion.button
                    key={ct.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveChart(ct.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-[10px] border transition-all duration-200 cursor-pointer',
                      isActive ? 'border-2' : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md',
                      isActive ? 'bg-opacity-5' : 'bg-white'
                    )}
                    style={
                      isActive
                        ? { borderColor: ct.color, backgroundColor: `${ct.color}0D` }
                        : undefined
                    }
                  >
                    <Icon className="w-7 h-7" style={{ color: isActive ? ct.color : '#6B7280' }} />
                    <span className={cn('text-body-sm font-semibold', isActive ? 'text-neutral-900' : 'text-neutral-600')}>
                      {ct.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </Card>

          {/* Data info card */}
          <Card className="p-4 border border-neutral-200 shadow-card">
            <h2 className="text-heading-sm text-neutral-800 mb-3 pb-3 border-b border-neutral-200">Thông tin dữ liệu</h2>
            <div className="space-y-3 text-body-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Bộ dữ liệu:</span>
                <Badge variant="default" className="text-xs">Mẫu nghiên cứu 2024</Badge>
              </div>
              <div className="flex justify-between">
                <span>Số mẫu:</span>
                <span className="font-medium text-neutral-800">400</span>
              </div>
              <div className="flex justify-between">
                <span>Biến số:</span>
                <span className="font-medium text-neutral-800">8</span>
              </div>
              <div className="flex justify-between">
                <span>Nguồn:</span>
                <span className="font-medium text-neutral-800">Khảo sát</span>
              </div>
            </div>
          </Card>
        </motion.aside>

        {/* ─────────────── CENTER PANEL: Chart Preview ─────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.1 }} className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <Card className="border border-neutral-200 shadow-card mb-3">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Type className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <Input
                  placeholder="Nhập tiêu đề biểu đồ..."
                  value={config.title}
                  onChange={(e) => handleConfigChange({ title: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-1.5 text-neutral-600">
                  <RefreshCw className="w-4 h-4" />
                  Làm mới
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-neutral-600">
                  <Download className="w-4 h-4" />
                  PNG
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-neutral-600">
                  <Copy className="w-4 h-4" />
                  SVG
                </Button>
              </div>
            </div>
          </Card>

          {/* Chart Canvas */}
          <Card className="flex-1 border border-neutral-200 shadow-card p-5 flex flex-col" style={{ backgroundImage: 'repeating-conic-gradient(#F9FAFB 0% 25%, #FFFFFF 0% 50%) 50% / 16px 16px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChart + refreshKey}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="flex-1 flex flex-col"
              >
                <h3 className="text-heading-md text-primary-900 text-center mb-4">{getChartTitle()}</h3>
                <div ref={chartContainerRef} className="flex-1 min-h-0">
                  {renderChart()}
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* ─────────────── RIGHT PANEL: Customization ─────────────── */}
        <AnimatePresence mode="wait">
          {!rightCollapsed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex-shrink-0 overflow-hidden"
            >
              <Card className="h-full border border-neutral-200 shadow-card flex flex-col" style={{ width: 320 }}>
                {/* Collapse toggle */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                  <h2 className="text-heading-sm text-neutral-800">Tùy chỉnh</h2>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRightCollapsed(true)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-6">
                  {/* Section: Nhãn */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4 text-primary-700" />
                      <h3 className="text-heading-sm text-neutral-800">Nhãn</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-body-sm text-neutral-600 mb-1 block">Tiêu đề biểu đồ</label>
                        <Input placeholder="Nhập tiêu đề..." value={config.title} onChange={(e) => handleConfigChange({ title: e.target.value })} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-body-sm text-neutral-600 mb-1 block">Nhãn trục X</label>
                        <Input placeholder="Nhập nhãn X..." value={config.xLabel} onChange={(e) => handleConfigChange({ xLabel: e.target.value })} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-body-sm text-neutral-600 mb-1 block">Nhãn trục Y</label>
                        <Input placeholder="Nhập nhãn Y..." value={config.yLabel} onChange={(e) => handleConfigChange({ yLabel: e.target.value })} className="h-8 text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200" />

                  {/* Section: Màu sắc */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-4 h-4 text-primary-700" />
                      <h3 className="text-heading-sm text-neutral-800">Màu sắc</h3>
                    </div>
                    <div className="space-y-2.5">
                      {COLORS.map((palette, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleConfigChange({ colorIndex: idx })}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200',
                            config.colorIndex === idx ? 'border-primary-700 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300 bg-white'
                          )}
                        >
                          <div className="flex gap-1.5">
                            {palette.map((c, ci) => (
                              <div key={ci} className="w-5 h-5 rounded-full border border-neutral-200" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <span className="text-body-sm text-neutral-700">{PALETTE_NAMES[idx]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-neutral-200" />

                  {/* Section: Hiển thị */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-4 h-4 text-primary-700" />
                      <h3 className="text-heading-sm text-neutral-800">Hiển thị</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-body-sm text-neutral-600">Hiển thị chú giải</span>
                        <Switch checked={config.showLegend} onCheckedChange={(v) => handleConfigChange({ showLegend: v })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-body-sm text-neutral-600">Lưới nền</span>
                        <Switch checked={config.showGrid} onCheckedChange={(v) => handleConfigChange({ showGrid: v })} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200" />

                  {/* Section: Lưới */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Grid3X3 className="w-4 h-4 text-primary-700" />
                      <h3 className="text-heading-sm text-neutral-800">Lưới & Khung</h3>
                    </div>
                    <div className="space-y-2 text-body-sm text-neutral-600">
                      <p>Kích thước xuất: 1200 × 800 px</p>
                      <p>DPI: 150</p>
                      <p>Định dạng: PNG / SVG</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Collapsed toggle button */}
        {rightCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 border border-neutral-200 shadow-sm" onClick={() => setRightCollapsed(false)} title="Mở tùy chỉnh">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
