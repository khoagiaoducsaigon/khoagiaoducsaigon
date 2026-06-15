import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Eye,
  Download,
  Printer,
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  BarChart3,
  Sigma,
  Table2,
  BookOpen,
  Award,
  TrendingUp,
  FileSpreadsheet,
  type LucideIcon,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Report {
  id: string
  title: string
  subtitle: string
  author: string
  date: string
  organization: string
  type: string
  status: 'completed' | 'draft' | 'processing'
  sections: ReportSection[]
  hasTable: boolean
  hasChart: boolean
}

interface ReportSection {
  id: string
  type: 'cover' | 'summary' | 'method' | 'results' | 'chart' | 'conclusion' | 'appendix'
  title: string
  icon: LucideIcon
  content: React.ReactNode
  visible: boolean
}

/* ------------------------------------------------------------------ */
/*  Chart data for embedded charts                                      */
/* ------------------------------------------------------------------ */

const barChartData = [
  { name: 'Nhóm Đối chủ', diemTB: 6.8, loiChuan: 1.2 },
  { name: 'Nhóm Can thiệp', diemTB: 8.2, loiChuan: 0.9 },
]

const pieChartData = [
  { name: 'Nam', value: 45 },
  { name: 'Nữ', value: 55 },
]

const COLORS = ['#1B5F99', '#E8723A']

/* ------------------------------------------------------------------ */
/*  Sample Reports Data                                                 */
/* ------------------------------------------------------------------ */

const sampleReports: Report[] = [
  {
    id: 'r1',
    title: 'Kết Quả Phân Tích Thống Kê \u2014 NCKH Giáo Dục 2024',
    subtitle: 'Báo cáo phân tích dữ liệu nghiên cứu giáo dục',
    author: 'Nguyễn Thị Minh Anh',
    date: '15 tháng 1 năm 2025',
    organization: 'Đại học Quốc gia Hà Nội',
    type: 'Phân tích T-test & ANOVA',
    status: 'completed',
    hasTable: true,
    hasChart: true,
    sections: [
      {
        id: 's1', type: 'cover', title: 'Trang bìa', icon: BookOpen, visible: true,
        content: null,
      },
      {
        id: 's2', type: 'summary', title: 'Tóm tắt', icon: FileText, visible: true,
        content: (
          <div className="space-y-3">
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Nghiên cứu này khảo sát ảnh hưởng của phương pháp học tập chủ động đến kết quả học tập của sinh viên
              đại học. Mẫu nghiên cứu bao gồm 200 sinh viên được chia thành hai nhóm: nhóm đối chủ (n=100) và
              nhóm can thiệp (n=100) sử dụng phương pháp học tập chủ động trong 12 tuần.
            </p>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Kết quả phân tích cho thấy nhóm can thiệp đạt điểm trung bình cao hơn đáng kể (M = 8.2, SD = 0.9)
              so với nhóm đối chủ (M = 6.8, SD = 1.2), với t(198) = 8.47, p {'<'} .001, d = 1.32.
              Hiệu ứng cỡ lớn này cho thấy phương pháp học tập chủ động có tác động tích cực mạnh mẽ
              đến kết quả học tập.
            </p>
          </div>
        ),
      },
      {
        id: 's3', type: 'method', title: 'Phương pháp nghiên cứu', icon: Sigma, visible: true,
        content: (
          <div className="space-y-3">
            <h4 className="text-heading-sm text-neutral-800 mt-4">Thiết kế nghiên cứu</h4>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Thiết kế thử nghiệm kiểm soát ngẫu nhiên (Randomized Controlled Trial) với hai nhóm:
              nhóm can thiệp và nhóm đối chủ. Sinh viên được phân nhóm ngẫu nhiên bằng phương pháp
              bốc thăm điện tử.
            </p>
            <h4 className="text-heading-sm text-neutral-800 mt-4">Công cụ thu thập dữ liệu</h4>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Bài kiểm tra học tập chuẩn hóa (Cronbach\u2019s \u03B1 = .89) được sử dụng để đánh giá
              kiến thức trước và sau can thiệp. Dữ liệu được thu thập qua hệ thống LMS và
              bài kiểm tra trực tuyến.
            </p>
            <h4 className="text-heading-sm text-neutral-800 mt-4">Phân tích dữ liệu</h4>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Phân tích T-test độc lập để so sánh điểm trung bình giữa hai nhóm.
              Phân tích ANOVA một yếu tố để kiểm tra khác biệt giữa các nhóm học phần.
              Mức ý nghĩa thống kê đặt tại \u03B1 = .05.
            </p>
          </div>
        ),
      },
      {
        id: 's4', type: 'results', title: 'Kết quả phân tích', icon: Table2, visible: true,
        content: (
          <div className="space-y-4">
            <div className="bg-[#F4FAFF] border-l-4 border-primary-700 p-4 rounded-r-lg">
              <p className="text-body-md text-primary-900 font-medium">
                Phát hiện chính: Sinh viên nhóm can thiệp đạt kết quả học tập cao hơn đáng kể
                so với nhóm đối chủ, với hiệu ứng cỡ lớn (Cohen\u2019s d = 1.32).
              </p>
            </div>

            <h4 className="text-heading-sm text-neutral-800 mt-4">1. Thống kê mô tả</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Biến số</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">N</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Trung bình</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Độ lệch chuẩn</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Min</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Max</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Nhóm Đối chủ</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">100</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">6.80</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">1.20</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">4.2</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">9.0</td>
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Nhóm Can thiệp</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">100</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">8.20</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.90</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">5.5</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">9.8</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-heading-sm text-neutral-800 mt-4">2. Kết quả T-test độc lập</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">So sánh</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">t</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">df</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">p</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Cohen\u2019s d</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">95% CI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Đối chủ vs Can thiệp</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">8.47</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">198</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-bold">{'<'} .001***</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">1.32</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">[0.98, 1.82]</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-body-sm text-neutral-500 mt-1">* p {'<'} .05, ** p {'<'} .01, *** p {'<'} .001</p>
          </div>
        ),
      },
      {
        id: 's5', type: 'chart', title: 'Biểu đồ minh họa', icon: BarChart3, visible: true,
        content: (
          <div className="space-y-4">
            <h4 className="text-heading-sm text-neutral-800 text-center">Hình 1. So sánh điểm trung bình giữa hai nhóm</h4>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={barChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={[0, 10]} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 13 }} />
                  <Bar dataKey="diemTB" name="Điểm trung bình" fill="#1B5F99" radius={[6, 6, 0, 0]} barSize={80} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-body-sm text-neutral-500 text-center">
              Ghi chú: Cột lỗi thể hiện độ lệch chuẩn. Sự khác biệt có ý nghĩa thống kê ở mức p {'<'} .001.
            </p>

            <h4 className="text-heading-sm text-neutral-800 text-center mt-6">Hình 2. Phân bố giới tính trong mẫu nghiên cứu</h4>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#FFFFFF" strokeWidth={3} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ),
      },
      {
        id: 's6', type: 'conclusion', title: 'Kết luận & Thảo luận', icon: Award, visible: true,
        content: (
          <div className="space-y-3">
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Kết quả nghiên cứu cho thấy phương pháp học tập chủ động có hiệu quả rõ rệt trong việc
              cải thiện kết quả học tập của sinh viên đại học. Hiệu ứng cỡ lớn (d = 1.32) cho thấy
              phương pháp này không chỉ có ý nghĩa thống kê mà còn có ý nghĩa thực tiễn quan trọng.
            </p>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Kết quả này phù hợp với các nghiên cứu trước đây của Freeman et al. (2014) và
              Prince (2004), khẳng định vai trò tích cực của phương pháp học tập chủ động trong
              giáo dục đại học.
            </p>
            <div className="bg-accent-teal-light border-l-4 border-accent-teal p-4 rounded-r-lg mt-4">
              <p className="text-body-md text-accent-teal font-medium">
                Khuyến nghị: Các trường đại học nên xem xét tích hợp phương pháp học tập chủ động
                vào chương trình giảng dạy để nâng cao chất lượng đào tạo.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 's7', type: 'appendix', title: 'Phụ lục', icon: FileSpreadsheet, visible: true,
        content: (
          <div className="space-y-3">
            <h4 className="text-heading-sm text-neutral-800">A. Thông tin mẫu nghiên cứu</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left px-4 py-2 border border-neutral-200 font-semibold text-neutral-700">Đặc điểm</th>
                    <th className="text-center px-4 py-2 border border-neutral-200 font-semibold text-neutral-700">Tần số</th>
                    <th className="text-center px-4 py-2 border border-neutral-200 font-semibold text-neutral-700">Tỷ lệ %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white"><td className="px-4 py-2 border border-neutral-200 text-neutral-800">Nam</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">90</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">45%</td></tr>
                  <tr className="bg-neutral-50"><td className="px-4 py-2 border border-neutral-200 text-neutral-800">Nữ</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">110</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">55%</td></tr>
                  <tr className="bg-white"><td className="px-4 py-2 border border-neutral-200 text-neutral-800">Năm nhất</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">80</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">40%</td></tr>
                  <tr className="bg-neutral-50"><td className="px-4 py-2 border border-neutral-200 text-neutral-800">Năm hai</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">70</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">35%</td></tr>
                  <tr className="bg-white"><td className="px-4 py-2 border border-neutral-200 text-neutral-800">Năm ba</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">50</td><td className="text-center px-4 py-2 border border-neutral-200 text-neutral-700">25%</td></tr>
                </tbody>
              </table>
            </div>
            <h4 className="text-heading-sm text-neutral-800 mt-4">B. Kiểm định giả định</h4>
            <ul className="list-disc list-inside text-body-md text-neutral-700 space-y-1">
              <li>Shapiro-Wilk: p = .12 (phân phối chuẩn)</li>
              <li>Levene\u2019s test: F(1, 198) = 1.87, p = .17 (phương sai đồng nhất)</li>
              <li>Kiểm tra ngoại lai: 2 điểm ngoại lai đã được xử lý bằng phương pháp winsorization</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: 'r2',
    title: 'Phân Tích Tương Quan Yếu Tố Ảnh Hưởng Đến Hiệu Quả Công Việc',
    subtitle: 'Nghiên cứu các yếu tố tác động đến năng suất lao động',
    author: 'Trần Văn Hùng',
    date: '28 tháng 2 năm 2025',
    organization: 'Trường ĐH Kinh tế Quốc dân',
    type: 'Hồi quy & Tương quan',
    status: 'completed',
    hasTable: true,
    hasChart: true,
    sections: [
      {
        id: 'r2s1', type: 'cover', title: 'Trang bìa', icon: BookOpen, visible: true,
        content: null,
      },
      {
        id: 'r2s2', type: 'summary', title: 'Tóm tắt', icon: FileText, visible: true,
        content: (
          <div className="space-y-3">
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Nghiên cứu này xem xét mối quan hệ giữa môi trường làm việc, đào tạo nghề và
              động lực nội tại với hiệu quả công việc của 350 nhân viên tại các doanh nghiệp vừa và nhỏ
              ở thành phố Hồ Chí Minh.
            </p>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Kết quả hồi quy đa biến cho thấy mô hình giải thích 62.4% phương sai của hiệu quả công việc
              (R² = .624, F(3, 346) = 191.3, p {'<'} .001). Các yếu tố đào tạo nghề (\u03B2 = .42) và
              động lực nội tại (\u03B2 = .35) là những dự báo mạnh nhất.
            </p>
          </div>
        ),
      },
      {
        id: 'r2s3', type: 'method', title: 'Phương pháp nghiên cứu', icon: Sigma, visible: true,
        content: (
          <div className="space-y-3">
            <h4 className="text-heading-sm text-neutral-800 mt-4">Thiết kế nghiên cứu</h4>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Nghiên cứu sử dụng thiết kế khảo sát chéo (cross-sectional survey) với phương pháp
              lấy mẫu phân tầng ngẫu nhiên. Dữ liệu được thu thập qua bảng hỏi trực tuyến trong
              tháng 11 và 12 năm 2024.
            </p>
            <h4 className="text-heading-sm text-neutral-800 mt-4">Thang đo</h4>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Hiệu quả công việc: Thang đo của Williams & Anderson (1994) với 7 mục (\u03B1 = .91).
              Môi trường làm việc: Thang đo của Patterson et al. (2005) với 12 mục (\u03B1 = .88).
              Đào tạo nghề: Thang đo tự thiết kế với 6 mục (\u03B1 = .85).
              Động lực nội tại: Thang đo IMI (Intrinsic Motivation Inventory) với 9 mục (\u03B1 = .92).
            </p>
          </div>
        ),
      },
      {
        id: 'r2s4', type: 'results', title: 'Kết quả phân tích', icon: Table2, visible: true,
        content: (
          <div className="space-y-4">
            <div className="bg-[#F4FAFF] border-l-4 border-primary-700 p-4 rounded-r-lg">
              <p className="text-body-md text-primary-900 font-medium">
                Mô hình hồi quy đạt ý nghĩa thống kê, giải thích 62.4% phương sai hiệu quả công việc.
                Đào tạo nghề và động lực nội tại là hai yếu tố dự báo quan trọng nhất.
              </p>
            </div>

            <h4 className="text-heading-sm text-neutral-800 mt-4">Ma trận tương quan</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Biến số</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">1</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">2</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">3</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">4</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">1. Hiệu quả công việc</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">1.00</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">2. Môi trường làm việc</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-medium">.48**</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">1.00</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">3. Đào tạo nghề</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-bold">.72***</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">.35**</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">1.00</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">4. Động lực nội tại</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-bold">.68***</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">.41**</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">.52**</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">1.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-body-sm text-neutral-500 mt-1">** p {'<'} .01, *** p {'<'} .001</p>

            <h4 className="text-heading-sm text-neutral-800 mt-4">Kết quả hồi quy đa biến</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Biến dự báo</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">B</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">SE</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">\u03B2</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">t</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">p</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Hằng số</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">1.24</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.32</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">\u2014</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">3.88</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">{'<'} .001</td>
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Môi trường làm việc</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.18</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.05</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">.16</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">3.60</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">{'<'} .001</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Đào tạo nghề</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.45</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.06</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-bold">.42</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">7.50</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">{'<'} .001</td>
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Động lực nội tại</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.38</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.05</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">.35</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">7.60</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">{'<'} .001</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-body-sm text-neutral-500 mt-2">R² = .624, Điều chỉnh R² = .621, F(3, 346) = 191.3, p {'<'} .001</p>
          </div>
        ),
      },
      {
        id: 'r2s6', type: 'conclusion', title: 'Kết luận & Thảo luận', icon: Award, visible: true,
        content: (
          <div className="space-y-3">
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Nghiên cứu đã xác định được ba yếu tố chính ảnh hưởng đến hiệu quả công việc của nhân viên
              tại các doanh nghiệp vừa và nhỏ. Trong đó, đào tạo nghề và động lực nội tại có tác động
              mạnh mẽ nhất, giải thích phần lớn phương sai của hiệu quả công việc.
            </p>
            <div className="bg-accent-teal-light border-l-4 border-accent-teal p-4 rounded-r-lg mt-4">
              <p className="text-body-md text-accent-teal font-medium">
                Khuyến nghị: Doanh nghiệp nên đầu tư vào chương trình đào tạo nghề bài bản và
                xây dựng cơ chế khuyến khích động lực nội tại để nâng cao hiệu quả công việc.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'r3',
    title: 'Đánh Giá Sự Hài Lòng Củ Khách Hàng \u2014 Thương Mại Điện Tử',
    subtitle: 'Phân tích khác biệt giữa các nhóm khách hàng',
    author: 'Lê Thị Hương',
    date: '10 tháng 3 năm 2025',
    organization: 'Công ty TNHH Shopee Việt Nam',
    type: 'ANOVA & Post-hoc',
    status: 'completed',
    hasTable: true,
    hasChart: true,
    sections: [
      {
        id: 'r3s1', type: 'cover', title: 'Trang bìa', icon: BookOpen, visible: true,
        content: null,
      },
      {
        id: 'r3s2', type: 'summary', title: 'Tóm tắt', icon: FileText, visible: true,
        content: (
          <div className="space-y-3">
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Nghiên cứu so sánh mức độ hài lòng của khách hàng theo độ tuổi (18-25, 26-35, 36-50, {'>'}50)
              trên nền tảng thương mại điện tử. Mẫu gồm 480 khách hàng được chọn ngẫu nhiên.
            </p>
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Kết quả ANOVA một yếu tố cho thấy sự khác biệt có ý nghĩa thống kê giữa các nhóm tuổi
              (F(3, 476) = 15.72, p {'<'} .001, \u03B7² = .09). Phân tích post-hoc Tukey HSD cho thấy
              nhóm 18-25 tuổi có mức độ hài lòng cao nhất, trong khi nhóm {'>'}50 tuổi có mức độ hài lòng thấp nhất.
            </p>
          </div>
        ),
      },
      {
        id: 'r3s4', type: 'results', title: 'Kết quả phân tích', icon: Table2, visible: true,
        content: (
          <div className="space-y-4">
            <h4 className="text-heading-sm text-neutral-800 mt-4">Bảng ANOVA</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Nguồn biến thiên</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">SS</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">df</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">MS</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">F</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">p</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Giữa các nhóm</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">142.38</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">3</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">47.46</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">15.72</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-bold">{'<'} .001***</td>
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Trong nhóm</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">1437.62</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">476</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">3.02</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">Tổng</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">1580.00</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-800 font-medium">479</td>
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                    <td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700" />
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-heading-sm text-neutral-800 mt-4">Post-hoc Tukey HSD</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">So sánh nhóm</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Khác biệt</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">SE</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">p</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">18-25 vs 26-35</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.42</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.18</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">.089</td></tr>
                  <tr className="bg-neutral-50"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">18-25 vs 36-50</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">1.18</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.19</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-bold">{'<'} .001</td></tr>
                  <tr className="bg-white"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">18-25 vs {'>'}50</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">1.85</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.22</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-bold">{'<'} .001</td></tr>
                  <tr className="bg-neutral-50"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">26-35 vs 36-50</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.76</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.18</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-medium">.001</td></tr>
                  <tr className="bg-white"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">26-35 vs {'>'}50</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">1.43</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.21</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-bold">{'<'} .001</td></tr>
                  <tr className="bg-neutral-50"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">36-50 vs {'>'}50</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.67</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">0.22</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-primary-700 font-medium">.016</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: 'r3s6', type: 'conclusion', title: 'Kết luận', icon: Award, visible: true,
        content: (
          <div className="space-y-3">
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Kết quả cho thấy sự khác biệt đáng kể về mức độ hài lòng giữa các nhóm tuổi.
              Khách hàng trẻ (18-25) hài lòng hơn do quen thuộc với công nghệ, trong khi khách hàng
              lớn tuổi ({'>'}50) gặp khó khăn với giao diện và quy trình mua sắm trực tuyến.
            </p>
            <div className="bg-accent-teal-light border-l-4 border-accent-teal p-4 rounded-r-lg mt-4">
              <p className="text-body-md text-accent-teal font-medium">
                Khuyến nghị: Tối ưu hóa giao diện ngườ dùng cho ngườ cao tuổi và cung cấp
                hướng dẫn sử dụng chi tiết hơn.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'r4',
    title: 'Phân Tích Hiệu Quả Chiến Dịch Marketing Số',
    subtitle: 'Đánh giá ROI theo kênh marketing',
    author: 'Phạm Quốc Bảo',
    date: '5 tháng 4 năm 2025',
    organization: 'Công ty Cổ phần FPT',
    type: 'Phân tích mô tả & So sánh',
    status: 'draft',
    hasTable: true,
    hasChart: false,
    sections: [
      {
        id: 'r4s1', type: 'cover', title: 'Trang bìa', icon: BookOpen, visible: true,
        content: null,
      },
      {
        id: 'r4s2', type: 'summary', title: 'Tóm tắt', icon: FileText, visible: true,
        content: (
          <div className="space-y-3">
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Báo cáo phân tích hiệu quả chiến dịch marketing số quý 1/2025 trên các kênh:
              Facebook Ads, Google Ads, TikTok Ads và Email Marketing. Tổng ngân sách chiến dịch
              là 2.5 tỷ đồng.
            </p>
          </div>
        ),
      },
      {
        id: 'r4s4', type: 'results', title: 'Kết quả phân tích', icon: Table2, visible: true,
        content: (
          <div className="space-y-4">
            <h4 className="text-heading-sm text-neutral-800 mt-4">Hiệu quả các kênh marketing</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Kênh</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Ngân sách (triệu)</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Lượt tiếp cận</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">Chuyển đổi</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">CPA</th>
                    <th className="text-center px-4 py-2.5 border border-neutral-200 font-semibold text-neutral-700">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Facebook Ads</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">800</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">1.2M</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">3.2%</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">125K</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-accent-teal font-bold">285%</td></tr>
                  <tr className="bg-neutral-50"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Google Ads</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">900</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">980K</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">4.1%</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">110K</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-accent-teal font-bold">320%</td></tr>
                  <tr className="bg-white"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">TikTok Ads</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">500</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">2.1M</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">2.5%</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">95K</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-accent-teal font-bold">410%</td></tr>
                  <tr className="bg-neutral-50"><td className="px-4 py-2.5 border border-neutral-200 text-neutral-800">Email Marketing</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">300</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">450K</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">5.8%</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-neutral-700">65K</td><td className="text-center px-4 py-2.5 border border-neutral-200 text-accent-teal font-bold">520%</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-body-sm text-neutral-500 mt-2">CPA: Chi phí mỗi chuyển đổi | ROI: Tỷ suất sinh lợi</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'r5',
    title: 'Khảo Sát Xu Hướng Tiêu Dùng Xanh Năm 2025',
    subtitle: 'Phân tích hành vi ngườ tiêu dùng bền vững',
    author: 'Hoàng Thị Lan',
    date: '20 tháng 3 năm 2025',
    organization: 'Viện Nghiên cứu Phát triển Bền vững',
    type: 'Khảo sát & Thống kê mô tả',
    status: 'processing',
    hasTable: true,
    hasChart: true,
    sections: [
      {
        id: 'r5s1', type: 'cover', title: 'Trang bìa', icon: BookOpen, visible: true,
        content: null,
      },
      {
        id: 'r5s2', type: 'summary', title: 'Tóm tắt', icon: FileText, visible: true,
        content: (
          <div className="space-y-3">
            <p className="text-body-md text-neutral-900 leading-relaxed">
              Khảo sát đánh giá nhận thức và hành vi tiêu dùng xanh của 1.000 ngườ tiêu dùng
              tại 3 thành phố lớn (Hà Nội, TP.HCM, Đà Nẵng). Kết quả ban đầu cho thấy 68% ngườ
              được hỏi sẵn sàng trả giá cao hơn cho sản phẩm thân thiện môi trường.
            </p>
          </div>
        ),
      },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Status helpers                                                      */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Report['status'] }) {
  const config = {
    completed: { label: 'Hoàn thành', variant: 'default' as const, icon: Check },
    draft: { label: 'Bản nháp', variant: 'default' as const, icon: FileText },
    processing: { label: 'Đang xử lý', variant: 'secondary' as const, icon: TrendingUp },
  }
  const c = config[status]
  const Icon = c.icon
  return (
    <Badge variant={c.variant} className="gap-1 text-xs">
      <Icon className="w-3 h-3" />
      {c.label}
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function Reports() {
  const [reports] = useState<Report[]>(sampleReports)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})
  const [reportMeta, setReportMeta] = useState({ title: '', author: '' })

  const toggleSection = (sectionId: string) => {
    setVisibleSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const openReport = (report: Report) => {
    setSelectedReport(report)
    // Initialize visibility
    const vis: Record<string, boolean> = {}
    report.sections.forEach((s) => { vis[s.id] = s.visible })
    setVisibleSections(vis)
    setReportMeta({ title: report.title, author: report.author })
  }

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        {!selectedReport ? (
          /* ───────────────────── REPORT LIST VIEW ───────────────────── */
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-heading-xl text-primary-900">Báo cáo kết quả</h1>
                <p className="text-body-md text-neutral-500 mt-1">Quản lý và xuất báo cáo phân tích thống kê</p>
              </div>
              <Button className="gap-2 bg-primary-700 hover:bg-primary-800 text-white">
                <Plus className="w-4 h-4" />
                Tạo báo cáo mới
              </Button>
            </div>

            {/* Reports Table */}
            <Card className="border border-neutral-200 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                      <TableHead className="text-neutral-700 font-semibold text-xs">TÊN BÁO CÁO</TableHead>
                      <TableHead className="text-neutral-700 font-semibold text-xs">LOẠI PHÂN TÍCH</TableHead>
                      <TableHead className="text-neutral-700 font-semibold text-xs">NGÀY TẠO</TableHead>
                      <TableHead className="text-neutral-700 font-semibold text-xs">TRẠNG THÁI</TableHead>
                      <TableHead className="text-neutral-700 font-semibold text-xs text-right">THAO TÁC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, i) => (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer group"
                        onClick={() => openReport(report)}
                      >
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4.5 h-4.5 text-primary-700" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900 group-hover:text-primary-700 transition-colors">{report.title}</p>
                              <p className="text-xs text-neutral-500">{report.organization}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <span className="text-sm text-neutral-700">{report.type}</span>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <span className="text-sm text-neutral-600">{report.date}</span>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <StatusBadge status={report.status} />
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          <Button variant="ghost" size="sm" className="gap-1.5 text-primary-700 hover:text-primary-800 hover:bg-primary-50" onClick={(e) => { e.stopPropagation(); openReport(report) }}>
                            <Eye className="w-4 h-4" />
                            Xem
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* ───────────────────── REPORT DETAIL VIEW ───────────────────── */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            {/* Detail toolbar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-1.5 text-neutral-600" onClick={() => setSelectedReport(null)}>
                  <ChevronLeft className="w-4 h-4" />
                  Quay lại
                </Button>
                <h1 className="text-heading-lg text-primary-900">{selectedReport.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-neutral-600">
                  <Printer className="w-4 h-4" />
                  In
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-neutral-600">
                  <FileText className="w-4 h-4" />
                  Word
                </Button>
                <Button size="sm" className="gap-1.5 bg-primary-700 hover:bg-primary-800 text-white">
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="flex gap-5">
              {/* A4 Paper Preview */}
              <div className="flex-1 flex justify-center overflow-auto pb-8">
                <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]" style={{ maxWidth: 800, width: '100%', minHeight: 1123, padding: '60px 50px' }}>
                  <AnimatePresence>
                    {/* Cover Page */}
                    {visibleSections[selectedReport.sections[0]?.id] !== false && (
                      <motion.section
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        className="text-center pb-12 border-b-2 border-primary-900 mb-10"
                      >
                        <div className="mt-8 mb-10">
                          <div className="w-16 h-16 bg-primary-900 rounded-xl mx-auto flex items-center justify-center mb-6">
                            <BarChart3 className="w-8 h-8 text-white" />
                          </div>
                          <h2 className="text-heading-xl text-primary-900 mb-2 leading-tight">
                            {reportMeta.title || selectedReport.title}
                          </h2>
                          <p className="text-body-lg text-neutral-500 mt-2">{selectedReport.subtitle}</p>
                        </div>
                        <div className="mt-10 space-y-2 text-body-sm text-neutral-600">
                          <p><span className="font-medium text-neutral-700">Ngườ thực hiện:</span> {reportMeta.author || selectedReport.author}</p>
                          <p><span className="font-medium text-neutral-700">Ngày:</span> {selectedReport.date}</p>
                          <p><span className="font-medium text-neutral-700">Tổ chức:</span> {selectedReport.organization}</p>
                          <p><span className="font-medium text-neutral-700">Phần mềm:</span> Thống Kê Khoa Học v2.0</p>
                        </div>
                      </motion.section>
                    )}

                    {/* Content Sections */}
                    {selectedReport.sections.slice(1).map((section, idx) => {
                      if (visibleSections[section.id] === false) return null
                      const Icon = section.icon
                      return (
                        <motion.section
                          key={section.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                          className="mb-8"
                        >
                          {section.type === 'results' && (
                            <>
                              <h3 className="text-heading-lg text-primary-900 border-b-2 border-primary-700 pb-2 mb-5 flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                {section.title}
                              </h3>
                              {section.content}
                            </>
                          )}
                          {section.type === 'summary' && (
                            <>
                              <h3 className="text-heading-lg text-primary-900 border-b-2 border-primary-700 pb-2 mb-5 flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                {section.title}
                              </h3>
                              {section.content}
                            </>
                          )}
                          {section.type === 'method' && (
                            <>
                              <h3 className="text-heading-lg text-primary-900 border-b-2 border-primary-700 pb-2 mb-5 flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                {section.title}
                              </h3>
                              {section.content}
                            </>
                          )}
                          {section.type === 'chart' && (
                            <>
                              <h3 className="text-heading-lg text-primary-900 border-b-2 border-primary-700 pb-2 mb-5 flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                {section.title}
                              </h3>
                              {section.content}
                            </>
                          )}
                          {section.type === 'conclusion' && (
                            <>
                              <h3 className="text-heading-lg text-primary-900 border-b-2 border-primary-700 pb-2 mb-5 flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                {section.title}
                              </h3>
                              {section.content}
                            </>
                          )}
                          {section.type === 'appendix' && (
                            <>
                              <h3 className="text-heading-lg text-primary-900 border-b-2 border-primary-700 pb-2 mb-5 flex items-center gap-2">
                                <Icon className="w-5 h-5" />
                                {section.title}
                              </h3>
                              {section.content}
                            </>
                          )}
                        </motion.section>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Settings Panel */}
              <AnimatePresence>
                {settingsOpen && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="flex-shrink-0 overflow-hidden"
                  >
                    <Card className="border border-neutral-200 shadow-card h-fit" style={{ width: 280 }}>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-primary-700" />
                          <h2 className="text-heading-sm text-neutral-800">Cài đặt</h2>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSettingsOpen(false)}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="p-4 space-y-5">
                        {/* Edit title & author */}
                        <div>
                          <h3 className="text-body-sm font-semibold text-neutral-700 mb-2.5">Thông tin báo cáo</h3>
                          <div className="space-y-2.5">
                            <div>
                              <label className="text-body-sm text-neutral-600 mb-1 block">Tiêu đề</label>
                              <Input
                                value={reportMeta.title}
                                onChange={(e) => setReportMeta((p) => ({ ...p, title: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-body-sm text-neutral-600 mb-1 block">Tác giả</label>
                              <Input
                                value={reportMeta.author}
                                onChange={(e) => setReportMeta((p) => ({ ...p, author: e.target.value }))}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-neutral-200" />

                        {/* Section toggles */}
                        <div>
                          <h3 className="text-body-sm font-semibold text-neutral-700 mb-2.5">Hiển thị phần</h3>
                          <div className="space-y-2">
                            {selectedReport.sections.map((section) => {
                              const Icon = section.icon
                              const isVisible = visibleSections[section.id] !== false
                              return (
                                <div
                                  key={section.id}
                                  className={cn(
                                    'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                                    isVisible ? 'bg-primary-50' : 'bg-neutral-50'
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon className={cn('w-4 h-4', isVisible ? 'text-primary-700' : 'text-neutral-400')} />
                                    <span className={cn('text-body-sm', isVisible ? 'text-neutral-800' : 'text-neutral-400 line-through')}>
                                      {section.title}
                                    </span>
                                  </div>
                                  <Switch
                                    checked={isVisible}
                                    onCheckedChange={() => toggleSection(section.id)}
                                    className="data-[state=checked]:bg-primary-700"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div className="border-t border-neutral-200" />

                        {/* Export settings */}
                        <div>
                          <h3 className="text-body-sm font-semibold text-neutral-700 mb-2.5">Xuất báo cáo</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-body-sm text-neutral-600">Trang bìa</span>
                              <Switch defaultChecked className="data-[state=checked]:bg-primary-700" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-body-sm text-neutral-600">Mục lục</span>
                              <Switch className="data-[state=checked]:bg-primary-700" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-body-sm text-neutral-600">Số trang</span>
                              <Switch defaultChecked className="data-[state=checked]:bg-primary-700" />
                            </div>
                            <Button className="w-full mt-3 bg-primary-700 hover:bg-primary-800 text-white gap-2">
                              <Download className="w-4 h-4" />
                              Xuất báo cáo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.aside>
                )}
              </AnimatePresence>

              {!settingsOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-9 w-9 border border-neutral-200 shadow-sm" onClick={() => setSettingsOpen(true)} title="Mở cài đặt">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
