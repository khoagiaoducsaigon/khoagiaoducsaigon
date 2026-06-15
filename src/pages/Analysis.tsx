import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftRight, Grid3X3, ScatterChart, TrendingUp,
  Table, Bell, Calculator, Play, ChevronDown, ChevronUp,
  Info, CheckCircle2, Plus, X, BarChart3, Search, FolderOpen,
  Database, ChevronLeft, ArrowLeft, Sparkles, AlertTriangle, Brain,
  ExternalLink, Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import {
  Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from 'sonner'
import {
  descriptiveStats, tTestIndependent, anovaOneWay, chiSquareTest,
  pearsonCorrelation, linearRegression, jarqueBeraTest,
  extractNumericColumn, getUniqueValues, detectNumericColumns,
} from '@/lib/statistics'
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { analyzeWithAI, getAIApiKey, saveAIApiKey, getAIConfigItems, runAutoAIWithCallbacks } from '@/lib/aiAPI'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'archived' | 'completed'
  createdAt: string
}

interface Dataset {
  id: string
  name: string
  fileType: string
  rowCount: number
  colCount: number
  headers: string[]
  rows: Record<string, any>[]
  uploadedAt: string
}

interface AnalysisMethod {
  id: string
  name: string
  nameVi: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  category: string
  requiresNumeric: string[]
  requiresGrouping?: boolean
}

interface AnalysisConfig {
  confidenceLevel: number
  alternativeHypothesis: 'two-tailed' | 'less' | 'greater'
  equalVariance: boolean
  effectSize: boolean
  descriptiveStats: boolean
  normalityTest: boolean
  postHocTests: string[]
  dependentVariable: string | null
  groupingVariables: string[]
  independentVariables: string[]
}

interface RealResults {
  methodId: string
  descriptiveStats?: { group: string; n: number; mean: number; sd: number; median: number; min: number; max: number }[]
  testStatistic?: { name: string; value: number; df?: string; pValue: number; ciLower?: number; ciUpper?: number; detail?: string }
  effectSize?: { name: string; value: number; interpretation: string }
  assumptions?: { name: string; status: 'passed' | 'failed' | 'warning'; detail: string }[]
  interpretation: string
  additionalTables?: { title: string; headers: string[]; rows: (string | number)[][] }[]
  anovaTable?: { title: string; headers: string[]; rows: (string | number)[][] }
  postHocTable?: { title: string; headers: string[]; rows: (string | number)[][] }
  raw: any
}

interface StoredAnalysis {
  id: string
  methodId: string
  methodNameVi: string
  projectId: string
  projectName: string
  datasetId: string
  datasetName: string
  dependentVariable: string
  groupingVariables: string[]
  independentVariables: string[]
  confidenceLevel: number
  results: RealResults
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const METHODS: AnalysisMethod[] = [
  {
    id: 'ttest', name: 'T-test', nameVi: 'Kiem dinh T',
    description: 'So sanh trung binh 2 nhom doc lap',
    icon: ArrowLeftRight, color: '#1B5F99', bgColor: '#F4FAFF', category: 'So sanh',
    requiresNumeric: ['value'], requiresGrouping: true,
  },
  {
    id: 'anova', name: 'ANOVA', nameVi: 'Phan tich phuong sai',
    description: 'So sanh trung binh 3+ nhom doc lap',
    icon: Grid3X3, color: '#2A9D8F', bgColor: '#E6F7F5', category: 'So sanh',
    requiresNumeric: ['value'], requiresGrouping: true,
  },
  {
    id: 'chisquare', name: 'Chi-square', nameVi: 'Kiem dinh Chi-square',
    description: 'Kiem tra lien he 2 bien phan loai',
    icon: Table, color: '#F4A261', bgColor: '#FFF8ED', category: 'Kiem dinh',
    requiresNumeric: [], requiresGrouping: true,
  },
  {
    id: 'correlation', name: 'Correlation', nameVi: 'Tuong quan',
    description: 'Tuong quan tuyen tinh giua 2 bien lien tuc',
    icon: ScatterChart, color: '#8B5CF6', bgColor: '#F5F3FF', category: 'Tuong quan & Hoi quy',
    requiresNumeric: ['x', 'y'],
  },
  {
    id: 'regression', name: 'Linear Regression', nameVi: 'Hoi quy tuyen tinh',
    description: 'Mo hinh hoa bien phu thuoc lien tuc',
    icon: TrendingUp, color: '#E76F51', bgColor: '#FEF2F2', category: 'Tuong quan & Hoi quy',
    requiresNumeric: ['x', 'y'],
  },
  {
    id: 'descriptive', name: 'Descriptive Statistics', nameVi: 'Thong ke mo ta',
    description: 'Trung binh, do lech chuan, phan vi',
    icon: Calculator, color: '#1B5F99', bgColor: '#F4FAFF', category: 'Mo ta',
    requiresNumeric: ['value'],
  },
  {
    id: 'normality', name: 'Normality Test', nameVi: 'Kiem dinh chuan',
    description: 'Kiem tra gia dinh phan phoi chuan',
    icon: Bell, color: '#84CC16', bgColor: '#F7FEE7', category: 'Kiem dinh',
    requiresNumeric: ['value'],
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

/* ------------------------------------------------------------------ */
/*  Drag & Drop Components                                             */
/* ------------------------------------------------------------------ */

function DraggableVariable({ col, isNumeric, isUsed, isDep, isGroup, isIndep, canSelect }: {
  col: string;
  isNumeric: boolean;
  isUsed: boolean;
  isDep: boolean;
  isGroup: boolean;
  isIndep: boolean;
  canSelect: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `var-${col}`,
    data: { col, isNumeric },
    disabled: !canSelect && !isUsed,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border select-none',
        isDep ? 'bg-[#1B5F99] text-white border-[#1B5F99]' :
        isGroup ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]' :
        isIndep ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]' :
        canSelect ? (isNumeric ? 'bg-white text-primary-700 border-primary-200 hover:border-primary-500 hover:bg-primary-50 cursor-grab active:cursor-grabbing' : 'bg-white text-orange-700 border-orange-200 hover:border-orange-500 hover:bg-orange-50 cursor-grab active:cursor-grabbing') :
        'bg-white text-neutral-300 border-neutral-100 cursor-not-allowed'
      )}
    >
      <span className={cn(
        'w-2 h-2 rounded-full shrink-0',
        isNumeric ? 'bg-primary-400' : 'bg-orange-400',
        (isDep || isGroup || isIndep) && 'bg-white/70'
      )} />
      <span>{col}</span>
      {(isDep || isGroup || isIndep) && (
        <span className="text-[10px] opacity-70 ml-1">
          {isDep ? 'Y' : isGroup ? 'N' : 'X'}
        </span>
      )}
    </div>
  );
}

function DroppableArea({ id, label, color, bgColor, children, className }: {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border-2 border-dashed transition-all p-4 min-h-[80px]',
        isOver ? 'border-solid scale-[1.02] shadow-lg' : '',
        className
      )}
      style={{
        borderColor: isOver ? color : undefined,
        backgroundColor: isOver ? bgColor : undefined,
      }}
    >
      {children || (
        <div className="flex items-center justify-center gap-2 h-full">
          <Plus className="w-5 h-5" style={{ color }} />
          <span className="text-sm font-medium" style={{ color }}>{label}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Real Analysis Engine                                               */
/* ------------------------------------------------------------------ */

function runRealAnalysis(
  methodId: string,
  dataset: Dataset,
  depVar: string,
  groupVars: string[],
  indepVars: string[],
  confidenceLevel: number
): RealResults {
  const alpha = 1 - confidenceLevel / 100
  const rows = dataset.rows
  const groupVar = groupVars.length > 0 ? groupVars[0] : null
  const indepVar = indepVars.length > 0 ? indepVars[0] : null

  switch (methodId) {
    case 'ttest': {
      if (!groupVar) throw new Error('Can bien phan nhom cho T-test')
      const groups = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '')
      if (groups.length < 2) throw new Error('Can it nhat 2 nhom')
      const g1Values = extractNumericColumn(rows.filter((r) => String(r[groupVar]) === groups[0]), depVar)
      const g2Values = extractNumericColumn(rows.filter((r) => String(r[groupVar]) === groups[1]), depVar)
      if (g1Values.length < 2 || g2Values.length < 2) throw new Error('Moi nhom can it nhat 2 quan sat')

      const result = tTestIndependent(g1Values, g2Values, alpha)
      const ds1 = descriptiveStats(g1Values)
      const ds2 = descriptiveStats(g2Values)

      return {
        methodId,
        descriptiveStats: [
          { group: groups[0], n: ds1.n, mean: ds1.mean, sd: ds1.std, median: ds1.median, min: ds1.min, max: ds1.max },
          { group: groups[1], n: ds2.n, mean: ds2.mean, sd: ds2.std, median: ds2.median, min: ds2.min, max: ds2.max },
        ],
        testStatistic: {
          name: 't', value: result.t, df: `${result.df.toFixed(1)}`,
          pValue: result.pValue, ciLower: result.ciLower, ciUpper: result.ciUpper,
          detail: `Welch t-test (${result.n1} vs ${result.n2})`,
        },
        effectSize: { name: "Cohen's d", value: result.cohenD, interpretation: result.effectSize },
        assumptions: [
          { name: 'Doc lap quan sat', status: 'passed', detail: 'Thiet ke nghien cuu dam bao' },
          { name: 'Phan phoi chuan (Jarque-Bera)', status: jarqueBeraTest(g1Values).normal && jarqueBeraTest(g2Values).normal ? 'passed' : 'warning', detail: `Nhom 1: p=${jarqueBeraTest(g1Values).pValue.toFixed(3)}, Nhom 2: p=${jarqueBeraTest(g2Values).pValue.toFixed(3)}` },
        ],
        interpretation: `Ket qua T-test so sanh trung binh hai nhom doc lap cho thay ${result.significant ? 'su khac biet co y nghia thong ke' : 'khong co su khac biet co y nghia thong ke'} giua "${groups[0]}" (M=${result.mean1.toFixed(2)}, SD=${result.std1.toFixed(2)}) va "${groups[1]}" (M=${result.mean2.toFixed(2)}, SD=${result.std2.toFixed(2)}), t(${result.df.toFixed(1)})=${result.t.toFixed(3)}, p=${result.pValue.toFixed(4)}. Khoang tin cay ${confidenceLevel}%: [${result.ciLower.toFixed(2)}, ${result.ciUpper.toFixed(2)}]. Hieu ung Cohen's d = ${result.cohenD.toFixed(2)} (${result.effectSize}).`,
        raw: result,
      }
    }

    case 'anova': {
      if (!groupVar) throw new Error('Can bien phan nhom cho ANOVA')
      const groups = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '')
      if (groups.length < 2) throw new Error('Can it nhat 2 nhom')
      const groupValues = groups.map((g) => extractNumericColumn(rows.filter((r) => String(r[groupVar]) === g), depVar))
      if (groupValues.some((g) => g.length < 2)) throw new Error('Moi nhom can it nhat 2 quan sat')

      const result = anovaOneWay(groupValues, alpha)
      const dsGroups = groupValues.map((g, i) => {
        const d = descriptiveStats(g)
        return { group: groups[i], n: d.n, mean: d.mean, sd: d.std, median: d.median, min: d.min, max: d.max }
      })

      const anovaTable = {
        title: 'Bang phuong sai ANOVA',
        headers: ['Nguon', 'SS', 'df', 'MS', 'F', 'Sig.'],
        rows: [
          ['Giua nhom', result.ssBetween.toFixed(2), result.dfBetween, result.msBetween.toFixed(2), result.f.toFixed(3), result.pValue.toFixed(4)],
          ['Trong nhom', result.ssWithin.toFixed(2), result.dfWithin, result.msWithin.toFixed(2), '', ''],
          ['Tong', result.ssTotal.toFixed(2), result.dfBetween + result.dfWithin, '', '', ''],
        ],
      }

      const postHocTable = result.postHoc.length > 0 ? {
        title: 'Tukey HSD Post-hoc',
        headers: ['So sanh', 'Khac biet', 'p-value', 'Y nghia'],
        rows: result.postHoc.map((p) => [`${groups[p.group1]} vs ${groups[p.group2]}`, p.diff.toFixed(3), p.pValue.toFixed(4), p.significant ? 'Co y nghia' : 'Khong y nghia']),
      } : undefined

      return {
        methodId,
        descriptiveStats: dsGroups,
        testStatistic: { name: 'F', value: result.f, df: `${result.dfBetween}, ${result.dfWithin}`, pValue: result.pValue, detail: 'Mot chieu' },
        effectSize: { name: 'Eta-squared', value: result.etaSquared, interpretation: result.etaSquared >= 0.14 ? 'Hieu ung lon' : result.etaSquared >= 0.06 ? 'Hieu ung trung binh' : result.etaSquared >= 0.01 ? 'Hieu ung nho' : 'Khong co hieu ung' },
        assumptions: [
          { name: 'Doc lap quan sat', status: 'passed', detail: 'Thiet ke nghien cuu dam bao' },
        ],
        interpretation: `Phan tich phuong sai mot chieu cho thay ${result.significant ? 'co su khac biet co y nghia thong ke' : 'khong co su khac biet co y nghia thong ke'} giua cac nhom ve bien "${depVar}", F(${result.dfBetween}, ${result.dfWithin}) = ${result.f.toFixed(3)}, p = ${result.pValue.toFixed(4)}. Co hieu ung eta-squared = ${result.etaSquared.toFixed(3)} (${result.etaSquared >= 0.14 ? 'lon' : result.etaSquared >= 0.06 ? 'trung binh' : result.etaSquared >= 0.01 ? 'nho' : 'khong dang ke'}).`,
        anovaTable,
        postHocTable: postHocTable as any,
        raw: result,
      }
    }

    case 'chisquare': {
      if (!groupVar) throw new Error('Can bien thu hai cho Chi-square')
      const cat1Values = getUniqueValues(rows.map((r) => String(r[depVar]))).filter((v) => v !== '')
      const cat2Values = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '')
      if (cat1Values.length < 2 || cat2Values.length < 2) throw new Error('Can it nhat 2 danh muc cho moi bien')

      const observed: number[][] = cat1Values.map((c1) =>
        cat2Values.map((c2) => rows.filter((r) => String(r[depVar]) === c1 && String(r[groupVar]) === c2).length)
      )

      const result = chiSquareTest(observed, alpha)

      const tableHeaders = ['', ...cat2Values, 'Tong']
      const tableRows = observed.map((row, i) => {
        const rowSum = row.reduce((a, b) => a + b, 0)
        return [cat1Values[i], ...row, rowSum]
      })
      const colSums = cat2Values.map((_, j) => observed.reduce((a, row) => a + row[j], 0))
      tableRows.push(['Tong', ...colSums, rows.length])

      return {
        methodId,
        testStatistic: { name: '\u03C7\u00B2', value: result.chi2, df: `${result.df}`, pValue: result.pValue, detail: 'Pearson Chi-Square' },
        effectSize: { name: "Cramer's V", value: result.cramersV, interpretation: result.cramersV >= 0.25 ? 'Hieu ung lon' : result.cramersV >= 0.15 ? 'Hieu ung trung binh' : result.cramersV >= 0.1 ? 'Hieu ung nho' : 'Khong co hieu ung' },
        assumptions: [
          { name: 'Tan so ky vong \u22655', status: result.expected.flat().filter((e) => e >= 5).length / result.expected.flat().length >= 0.8 ? 'passed' : 'warning', detail: `${Math.round(result.expected.flat().filter((e) => e >= 5).length / result.expected.flat().length * 100)}% o co tan so ky vong \u22655` },
          { name: 'Doc lap quan sat', status: 'passed', detail: 'Mau ngau nhien doc lap' },
        ],
        interpretation: `Kiem dinh Chi-square cho thay ${result.significant ? 'co moi lien he co y nghia thong ke' : 'khong co moi lien he co y nghia thong ke'} giua "${depVar}" va "${groupVar}", \u03C7\u00B2(${result.df}) = ${result.chi2.toFixed(3)}, p = ${result.pValue.toFixed(4)}. Cramer's V = ${result.cramersV.toFixed(3)} (${result.cramersV >= 0.25 ? 'lon' : result.cramersV >= 0.15 ? 'trung binh' : result.cramersV >= 0.1 ? 'nho' : 'khong dang ke'}).`,
        additionalTables: [{ title: 'Bang cheo (Quan sat)', headers: tableHeaders, rows: tableRows as any }],
        raw: result,
      }
    }

    case 'correlation': {
      if (!indepVar) throw new Error('Can bien thu hai cho tuong quan')
      const xValues = extractNumericColumn(rows, depVar)
      const yValues = extractNumericColumn(rows, indepVar)
      if (xValues.length < 3 || yValues.length < 3) throw new Error('Can it nhat 3 cap quan sat')

      const result = pearsonCorrelation(xValues, yValues, alpha)
      const dsX = descriptiveStats(xValues)
      const dsY = descriptiveStats(yValues)

      return {
        methodId,
        descriptiveStats: [
          { group: depVar, n: dsX.n, mean: dsX.mean, sd: dsX.std, median: dsX.median, min: dsX.min, max: dsX.max },
          { group: indepVar, n: dsY.n, mean: dsY.mean, sd: dsY.std, median: dsY.median, min: dsY.min, max: dsY.max },
        ],
        testStatistic: { name: 'r', value: result.r, df: `${result.n - 2}`, pValue: result.pValue, ciLower: result.ciLower, ciUpper: result.ciUpper, detail: 'Pearson correlation' },
        effectSize: { name: 'r\u00B2', value: result.rSquared, interpretation: `${(result.rSquared * 100).toFixed(1)}% phuong sai duoc giai thich` },
        assumptions: [
          { name: 'Tuyen tinh', status: result.rSquared > 0.1 ? 'passed' : 'warning', detail: `r\u00B2 = ${result.rSquared.toFixed(3)}` },
          { name: 'Phan phoi chuan', status: jarqueBeraTest(xValues).normal && jarqueBeraTest(yValues).normal ? 'passed' : 'warning', detail: `JB p = ${jarqueBeraTest(xValues).pValue.toFixed(3)}, ${jarqueBeraTest(yValues).pValue.toFixed(3)}` },
        ],
        interpretation: `He so tuong quan Pearson giua "${depVar}" va "${indepVar}" la r = ${result.r.toFixed(3)}, p = ${result.pValue.toFixed(4)}. Moi tuong quan ${result.direction.toLowerCase()} ${result.strength.toLowerCase()}, giai thich ${(result.rSquared * 100).toFixed(1)}% phuong sai. Khoang tin cay ${confidenceLevel}%: [${result.ciLower.toFixed(3)}, ${result.ciUpper.toFixed(3)}].`,
        raw: result,
      }
    }

    case 'regression': {
      if (!indepVar) throw new Error('Can bien doc lap cho hoi quy')
      const xValues = extractNumericColumn(rows, indepVar)
      const yValues = extractNumericColumn(rows, depVar)
      if (xValues.length < 3 || yValues.length < 3) throw new Error('Can it nhat 3 cap quan sat')

      const result = linearRegression(xValues, yValues, alpha)

      const regTable = {
        title: 'He so hoi quy',
        headers: ['Bien', 'B', 'SE', 'Beta', 't', 'Sig.'],
        rows: [
          ['Hang so', result.intercept.toFixed(3), result.stdError.toFixed(3), '', (result.intercept / result.stdError).toFixed(3), '<0.001'],
          [indepVar, result.slope.toFixed(3), (result.stdError / Math.sqrt(xValues.length)).toFixed(3), result.r.toFixed(3), (result.slope / (result.stdError / Math.sqrt(xValues.length))).toFixed(3), result.pValue.toFixed(4)],
        ],
      }

      const anovaTable = {
        title: 'Bang phuong sai ANOVA',
        headers: ['Nguon', 'SS', 'df', 'MS', 'F', 'Sig.'],
        rows: [
          ['Hoi quy', result.ssRegression.toFixed(2), result.dfRegression, result.msRegression.toFixed(2), result.fStat.toFixed(3), result.pValue.toFixed(4)],
          ['Phan du', result.ssResidual.toFixed(2), result.dfResidual, result.msResidual.toFixed(2), '', ''],
          ['Tong', result.ssTotal.toFixed(2), result.dfTotal, '', '', ''],
        ],
      }

      return {
        methodId,
        testStatistic: { name: 'F', value: result.fStat, df: `${result.dfRegression}, ${result.dfResidual}`, pValue: result.pValue, detail: 'Model test' },
        effectSize: { name: 'R\u00B2', value: result.rSquared, interpretation: `${(result.rSquared * 100).toFixed(1)}% phuong sai duoc giai thich` },
        assumptions: [
          { name: 'Tuyen tinh', status: result.rSquared > 0.1 ? 'passed' : 'warning', detail: `R\u00B2 = ${result.rSquared.toFixed(3)}` },
          { name: 'Phan phoi chuan phan du', status: jarqueBeraTest(result.residuals.filter((r) => !isNaN(r))).normal ? 'passed' : 'warning', detail: `JB p = ${jarqueBeraTest(result.residuals.filter((r) => !isNaN(r))).pValue.toFixed(3)}` },
        ],
        interpretation: `Mo hinh hoi quy tuyen tinh: ${depVar} = ${result.intercept.toFixed(3)} + ${result.slope.toFixed(3)} * ${indepVar}. Mo hinh ${result.significant ? 'co y nghia thong ke' : 'khong co y nghia thong ke'}, F(${result.dfRegression}, ${result.dfResidual}) = ${result.fStat.toFixed(3)}, p = ${result.pValue.toFixed(4)}. R\u00B2 = ${result.rSquared.toFixed(3)}, cho thay mo hinh giai thich ${(result.rSquared * 100).toFixed(1)}% phuong sai cua "${depVar}".`,
        additionalTables: [regTable],
        anovaTable,
        raw: result,
      }
    }

    case 'descriptive': {
      const values = extractNumericColumn(rows, depVar)
      if (values.length < 1) throw new Error('Can it nhat 1 quan sat')
      const ds = descriptiveStats(values)

      return {
        methodId,
        descriptiveStats: [
          { group: depVar, n: ds.n, mean: ds.mean, sd: ds.std, median: ds.median, min: ds.min, max: ds.max },
        ],
        interpretation: `Thong ke mo ta cho bien "${depVar}" (N = ${ds.n}): Trung binh = ${ds.mean.toFixed(2)}, Do lech chuan = ${ds.std.toFixed(2)}, Trung vi = ${ds.median.toFixed(2)}, Q1 = ${ds.q1.toFixed(2)}, Q3 = ${ds.q3.toFixed(2)}, Min = ${ds.min.toFixed(2)}, Max = ${ds.max.toFixed(2)}, Do lech = ${ds.skewness.toFixed(3)}, Do nhon = ${ds.kurtosis.toFixed(3)}.`,
        raw: ds,
      }
    }

    case 'normality': {
      const values = extractNumericColumn(rows, depVar)
      if (values.length < 4) throw new Error('Can it nhat 4 quan sat')
      const jb = jarqueBeraTest(values, alpha)
      const ds = descriptiveStats(values)

      return {
        methodId,
        testStatistic: { name: 'JB', value: jb.jb, df: '2', pValue: jb.pValue, detail: `Jarque-Bera test (p ${jb.normal ? '>' : '<'} ${alpha})` },
        assumptions: [
          { name: 'Mau lien tuc', status: 'passed', detail: 'Bien dinh luong lien tuc' },
          { name: 'Quan sat doc lap', status: 'passed', detail: `N = ${values.length}` },
        ],
        interpretation: `Kiem dinh Jarque-Bera cho bien "${depVar}": JB = ${jb.jb.toFixed(3)}, p = ${jb.pValue.toFixed(4)}. ${jb.normal ? 'Khong bac bo gia thuyet H0, du lieu co the tuan theo phan phoi chuan' : 'Bac bo gia thuyet H0, du lieu khong tuan theo phan phoi chuan'} o muc y nghia ${alpha}. Do lech = ${ds.skewness.toFixed(3)}, Do nhon = ${ds.kurtosis.toFixed(3)}.`,
        raw: jb,
      }
    }

    default:
      throw new Error('Phuong phap khong duoc ho tro')
  }
}

/* ------------------------------------------------------------------ */
/*  Chart helpers for results                                          */
/* ------------------------------------------------------------------ */

function buildResultChartData(results: RealResults, methodId: string) {
  if (!results) return []
  switch (methodId) {
    case 'ttest': {
      const ds = results.descriptiveStats
      if (!ds) return []
      return ds.map((s) => ({ name: s.group, TrungBinh: s.mean, DoLechChuan: s.sd }))
    }
    case 'anova': {
      const ds = results.descriptiveStats
      if (!ds) return []
      return ds.map((s) => ({ name: s.group, TrungBinh: s.mean }))
    }
    case 'correlation': {
      return [] // scatter chart uses raw data instead
    }
    case 'chisquare': {
      const tbl = results.additionalTables?.[0]
      if (!tbl) return []
      return tbl.rows.slice(0, -1).map((row) => ({
        name: String(row[0]),
        ...Object.fromEntries(tbl.headers.slice(1, -1).map((h, j) => [h, Number(row[j + 1]) || 0]))
      }))
    }
    default:
      return []
  }
}

function generateDetailedInterpretation(results: RealResults, _methodId: string, methodNameVi: string, config: AnalysisConfig): string {
  const lines: string[] = []
  const alpha = 1 - config.confidenceLevel / 100
  const ts = results.testStatistic
  const es = results.effectSize
  const ds = results.descriptiveStats

  lines.push(`1. TOM TAT PHAT HIEN CHINH`)
  lines.push(`   Phan tich ${methodNameVi} duoc thuc hien tren bien "${config.dependentVariable}"`)
  if (config.groupingVariables.length > 0) lines.push(`   voi bien phan nhom: ${config.groupingVariables.join(', ')}.`)
  if (config.independentVariables.length > 0) lines.push(`   voi bien doc lap: ${config.independentVariables.join(', ')}.`)
  if (ts) {
    lines.push(`   Ket qua cho thay ${ts.name} = ${ts.value.toFixed(3)}, p = ${ts.pValue.toFixed(4)}.`)
    lines.push(`   ${ts.pValue < alpha ? 'Co y nghia thong ke o muc y nghia ' + config.confidenceLevel + '%.' : 'KHONG co y nghia thong ke o muc y nghia ' + config.confidenceLevel + '%.'}`)
  }
  lines.push(``)

  lines.push(`2. Y NGHIA THONG KE`)
  if (ts) {
    lines.push(`   Gia tri ${ts.name} = ${ts.value.toFixed(3)} phan anh muc do lech cua du lieu so voi gia thuyet H0.`)
    lines.push(`   p-value = ${ts.pValue.toFixed(4)} ${ts.pValue < alpha ? '<' : '>'} ${alpha}, do do ${ts.pValue < alpha ? 'bac bo' : 'khong bac bo'} gia thuyet H0.`)
    if (ts.ciLower !== undefined && ts.ciUpper !== undefined) {
      lines.push(`   Khoang tin cay ${config.confidenceLevel}%: [${ts.ciLower.toFixed(3)}, ${ts.ciUpper.toFixed(3)}].`)
    }
  }
  lines.push(``)

  lines.push(`3. Y NGHIA THUC TIEN`)
  if (ds && ds.length > 0) {
    lines.push(`   Bien "${config.dependentVariable}" co trung binh mau la ${ds.map(s => s.group + '=' + s.mean.toFixed(2)).join(', ')}.`)
  }
  if (ts && ts.pValue < alpha) {
    lines.push(`   Ket qua nay co y nghia thuc tien, cho thay moi quan he/bien doi giua cac bien la co that.`)
  } else {
    lines.push(`   Ket qua nay khong co y nghia thuc tien ro rang, can than trong khi ket luan.`)
  }
  lines.push(``)

  lines.push(`4. CO HIEU UNG (EFFECT SIZE)`)
  if (es) {
    lines.push(`   ${es.name} = ${es.value.toFixed(3)} — ${es.interpretation}.`)
    if (es.name.toLowerCase().includes('d') && typeof es.value === 'number') {
      if (es.value >= 0.8) lines.push(`   Day la hieu ung lon, chenh lech giua cac nhom dang ke.`)
      else if (es.value >= 0.5) lines.push(`   Hieu ung trung binh, co the quan sat duoc trong thuc te.`)
      else if (es.value >= 0.2) lines.push(`   Hieu ung nho, su khac biet ton tai nhung kho nhan thay.`)
      else lines.push(`   Hieu ung khong dang ke.`)
    }
  } else {
    lines.push(`   Khong tinh toan duoc co hieu ung cho phan tich nay.`)
  }
  lines.push(``)

  lines.push(`5. DO TIN CAY`)
  lines.push(`   Muc tin cay ${config.confidenceLevel}% duoc su dung, tuong ung alpha = ${alpha}.`)
  if (ts && ts.ciLower !== undefined) {
    lines.push(`   Khoang tin cay cho thay gia tri that nam trong khoang [${ts.ciLower.toFixed(3)}, ${ts.ciUpper?.toFixed(3)}] voi ${config.confidenceLevel}% do tin cay.`)
  }
  lines.push(``)

  lines.push(`6. HAN CHE CUA PHAN TICH`)
  lines.push(`   — Gia dinh doc lap quan sat can duoc dam bao boi thiet ke nghien cuu.`)
  if (results.assumptions) {
    results.assumptions.forEach((a) => {
      lines.push(`   — ${a.name}: ${a.status === 'passed' ? 'Dat' : a.status === 'warning' ? 'Canh bao' : 'Vi pham'} (${a.detail}).`)
    })
  }
  lines.push(`   — Ket qua chi ap dung cho mau nghien cuu, tong quat hoa can than trong.`)
  lines.push(``)

  lines.push(`7. KHUYEN NGHI CHO NGHIEN CUU TIEP THEO`)
  if (ts && ts.pValue < alpha) {
    lines.push(`   - Tim hieu co che/nguyen nhan gay ra ket qua nay.`)
    lines.push(`   - Xem xet cac bien ngoai lai (confounders) co the anh huong.`)
    lines.push(`   - Lap lai nghien cuu voi mau lon hon va da dang hon de xac nhan.`)
  } else {
    lines.push(`   - Tang co mau neu muon phat hien hieu ung nho.`)
    lines.push(`   - Kiem tra lai du lieu: outliers, phan phoi, do tin cay.`)
    lines.push(`   - Xem xet cac bien dieu chinh (covariates) co the lam ro moi quan he.`)
  }
  lines.push(`   - Bao cao day du ket qua, bao gom ca ket qua khong co y nghia.`)
  return lines.join('\n')
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AnalysisPage() {
  const navigate = useNavigate()
  const [projects] = useLocalStorage<Project[]>('statspro-projects', [])
  const [storedAnalyses, setStoredAnalyses] = useLocalStorage<StoredAnalysis[]>('statspro-global-analyses', [])

  /* -- Wizard step -- */
  const [wizardStep, setWizardStep] = useState<number>(0)

  /* -- Selections -- */
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  /* -- Config -- */
  const [searchQuery, setSearchQuery] = useState('')
  const [, setHasResults] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showOptions, setShowOptions] = useState(true)
  const [config, setConfig] = useState<AnalysisConfig>({
    confidenceLevel: 95,
    alternativeHypothesis: 'two-tailed',
    equalVariance: true,
    effectSize: true,
    descriptiveStats: true,
    normalityTest: false,
    postHocTests: ['Tukey HSD'],
    dependentVariable: null,
    groupingVariables: [],
    independentVariables: [],
  })

  /* -- Current results -- */
  const [currentResults, setCurrentResults] = useState<RealResults | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /* -- AI state -- */
  const [apiKey, setApiKey] = useState(getAIApiKey())
  const [aiInterpretation, setAiInterpretation] = useState('')
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(false)

  const method = METHODS.find((m) => m.id === selectedMethod)

  /* -- Get datasets for selected project -- */
  const projectDatasets = useMemo(() => {
    if (!selectedProjectId) return []
    try {
      const raw = localStorage.getItem(`statspro-datasets-${selectedProjectId}`)
      if (raw) return JSON.parse(raw) as Dataset[]
    } catch { /* ignore */ }
    return []
  }, [selectedProjectId])

  /* -- Global datasets -- */
  const globalDatasets = useMemo(() => {
    try {
      const raw = localStorage.getItem('statspro-global-data')
      if (raw) return JSON.parse(raw) as Dataset[]
    } catch { /* ignore */ }
    return []
  }, [])

  const allDatasets = useMemo(() => {
    const combined = [...projectDatasets]
    globalDatasets.forEach((gd) => {
      if (!combined.find((c) => c.id === gd.id)) combined.push(gd)
    })
    return combined
  }, [projectDatasets, globalDatasets])

  const selectedDataset = allDatasets.find((d) => d.id === selectedDatasetId)

  const numericCols = useMemo(() => {
    if (!selectedDataset) return []
    return detectNumericColumns(selectedDataset.rows, selectedDataset.headers)
  }, [selectedDataset])

  const categoricalCols = useMemo(() => {
    if (!selectedDataset) return []
    return selectedDataset.headers.filter((h) => !numericCols.includes(h))
  }, [selectedDataset, numericCols])

  const allCols = selectedDataset?.headers || []

  const setDependentVariable = useCallback((name: string | null) => {
    setConfig((prev) => ({ ...prev, dependentVariable: name }))
  }, [])

  const toggleGroupingVariable = useCallback((name: string) => {
    setConfig((prev) => {
      const exists = prev.groupingVariables.includes(name)
      if (exists) {
        return { ...prev, groupingVariables: prev.groupingVariables.filter((v) => v !== name) }
      }
      return { ...prev, groupingVariables: [...prev.groupingVariables, name] }
    })
  }, [])

  const toggleIndependentVariable = useCallback((name: string) => {
    setConfig((prev) => {
      const exists = prev.independentVariables.includes(name)
      if (exists) {
        return { ...prev, independentVariables: prev.independentVariables.filter((v) => v !== name) }
      }
      return { ...prev, independentVariables: [...prev.independentVariables, name] }
    })
  }, [])

  /* -- Drag & Drop handler -- */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const col = String(active.data.current?.col || active.id.toString().replace('var-', ''))
    const overId = over.id.toString()

    if (!col || !selectedDataset) return

    if (overId === 'drop-y') {
      // Set as dependent variable
      setConfig((prev) => ({
        ...prev,
        dependentVariable: col,
        // Remove from other roles if present
        groupingVariables: prev.groupingVariables.filter((v) => v !== col),
        independentVariables: prev.independentVariables.filter((v) => v !== col),
      }))
    } else if (overId === 'drop-x') {
      // Add as independent variable
      setConfig((prev) => ({
        ...prev,
        independentVariables: prev.independentVariables.includes(col) ? prev.independentVariables : [...prev.independentVariables, col],
        // Remove from other roles if present
        groupingVariables: prev.groupingVariables.filter((v) => v !== col),
        dependentVariable: prev.dependentVariable === col ? null : prev.dependentVariable,
      }))
    } else if (overId === 'drop-group') {
      // Add as grouping variable
      setConfig((prev) => ({
        ...prev,
        groupingVariables: prev.groupingVariables.includes(col) ? prev.groupingVariables : [...prev.groupingVariables, col],
        // Remove from other roles if present
        independentVariables: prev.independentVariables.filter((v) => v !== col),
        dependentVariable: prev.dependentVariable === col ? null : prev.dependentVariable,
      }))
    }
  }, [selectedDataset])

  /* -- Auto AI analysis after results -- */
  useEffect(() => {
    if (currentResults) {
      const configs = getAIConfigItems()
      if (configs.length > 0) {
        let combined = ''
        runAutoAIWithCallbacks(
          configs,
          METHODS.find((m) => m.id === currentResults.methodId)?.nameVi || currentResults.methodId,
          { dataset: selectedDataset?.name, variables: { dep: config.dependentVariable, group: config.groupingVariables, independent: config.independentVariables } },
          currentResults.raw,
          (provider, text) => {
            combined += `### ${provider}\n\n${text}\n\n---\n\n`
            setAiInterpretation(combined)
          },
          () => { /* silent fail for auto AI */ }
        )
      }
    }
  }, [currentResults])

  const runAnalysis = useCallback(() => {
    if (!selectedDataset || !selectedMethod || !config.dependentVariable) return
    setIsRunning(true)
    setErrorMessage(null)
    setAiInterpretation('')
    setAiError(null)
    setCurrentResults(null)
    setTimeout(() => {
      try {
        const groupVars = config.groupingVariables
        const indepVars = config.independentVariables

        /* Validate variables based on method */
        if ((selectedMethod === 'ttest' || selectedMethod === 'anova') && groupVars.length === 0) {
          throw new Error(`Can chon it nhat 1 bien phan nhom cho ${selectedMethod === 'ttest' ? 'T-test' : 'ANOVA'}`)
        }
        if ((selectedMethod === 'correlation' || selectedMethod === 'regression') && indepVars.length === 0) {
          throw new Error(`Can chon it nhat 1 bien doc lap cho ${selectedMethod === 'correlation' ? 'Tuong quan' : 'Hoi quy'}`)
        }
        if (selectedMethod === 'chisquare' && groupVars.length === 0) {
          throw new Error('Can chon it nhat 1 bien phan loai thu hai cho Chi-square')
        }

        const results = runRealAnalysis(
          selectedMethod,
          selectedDataset,
          config.dependentVariable ?? '',
          groupVars,
          indepVars,
          config.confidenceLevel
        )
        setCurrentResults(results)
        setHasResults(true)
        setIsRunning(false)
        setWizardStep(5)

        // Save to localStorage
        const project = projects.find((p) => p.id === selectedProjectId)
        const ds = allDatasets.find((d) => d.id === selectedDatasetId)
        const methodInfo = METHODS.find((m) => m.id === selectedMethod)
        if (ds && methodInfo) {
          const analysis: StoredAnalysis = {
            id: crypto.randomUUID(),
            methodId: selectedMethod,
            methodNameVi: methodInfo.nameVi,
            projectId: selectedProjectId || '',
            projectName: project?.name || 'Chung',
            datasetId: selectedDatasetId,
            datasetName: ds.name,
            dependentVariable: config.dependentVariable ?? '',
            groupingVariables: config.groupingVariables,
            independentVariables: config.independentVariables,
            confidenceLevel: config.confidenceLevel,
            results,
            createdAt: new Date().toISOString(),
          }
          if (selectedProjectId) {
            try {
              const key = `statspro-analyses-${selectedProjectId}`
              const raw = localStorage.getItem(key)
              const existing: StoredAnalysis[] = raw ? JSON.parse(raw) : []
              existing.push(analysis)
              localStorage.setItem(key, JSON.stringify(existing))
            } catch { /* ignore */ }
          }
          setStoredAnalyses((prev) => [...prev, analysis])
          toast.success('Da luu ket qua phan tich')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Loi phan tich'
        setErrorMessage(msg)
        setIsRunning(false)
        toast.error(msg)
        // Stay on step 4 to let user fix the issue
      }
    }, 500)
  }, [selectedDataset, selectedMethod, config, selectedProjectId, selectedDatasetId, projects, allDatasets, setStoredAnalyses])

  const handleAIAnalysis = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error('Vui long nhap API key')
      return
    }
    if (!currentResults) return
    saveAIApiKey(apiKey)
    setIsAILoading(true)
    setAiError(null)
    try {
      const result = await analyzeWithAI(
        { provider: 'moonshot', apiKey, proxyUrl: '', customBaseUrl: '', model: 'kimi-latest' },
        METHODS.find((m) => m.id === currentResults.methodId)?.nameVi || currentResults.methodId,
        { dataset: selectedDataset?.name, variables: { dep: config.dependentVariable, group: config.groupingVariables, independent: config.independentVariables } },
        currentResults.raw
      )
      setAiInterpretation(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Loi ket noi'
      if (msg.includes('CORS') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setAiError('API Moonshot yeu cau backend proxy de tranh CORS. Vui long lien he admin de cau hinh server proxy.')
      } else {
        setAiError(msg)
      }
      toast.error('Khong the ket noi AI: ' + msg)
    } finally {
      setIsAILoading(false)
    }
  }, [apiKey, currentResults, selectedDataset, config])

  const filteredMethods = METHODS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [...new Set(filteredMethods.map((m) => m.category))]

  const canRun = (() => {
    if (!config.dependentVariable) return false
    if (selectedMethod === 'descriptive' || selectedMethod === 'normality') return true
    if (selectedMethod === 'correlation' || selectedMethod === 'regression') return config.independentVariables.length > 0
    return config.groupingVariables.length > 0
  })()

  const goBack = () => {
    setWizardStep(0)
    setSelectedProjectId('')
    setSelectedDatasetId('')
    setSelectedMethod(null)
    setHasResults(false)
    setCurrentResults(null)
    setErrorMessage(null)
    setAiInterpretation('')
    setAiError(null)
    setShowAI(false)
    setConfig((prev) => ({
      ...prev,
      dependentVariable: null,
      groupingVariables: [],
      independentVariables: [],
    }))
  }

  /* -- Variable selection guidance based on method -- */
  const getVariableLabel = () => {
    switch (selectedMethod) {
      case 'ttest': return { dep: 'Bien dinh luong (lien tuc)', group: 'Bien phan nhom (2 nhom)' }
      case 'anova': return { dep: 'Bien phu thuoc (lien tuc)', group: 'Bien phan nhom (3+ nhom)' }
      case 'chisquare': return { dep: 'Bien phan loai 1', group: 'Bien phan loai 2' }
      case 'correlation': return { dep: 'Bien X (lien tuc)', indep: 'Bien Y (lien tuc)' }
      case 'regression': return { dep: 'Bien phu thuoc Y', indep: 'Bien doc lap X' }
      case 'descriptive': return { dep: 'Bien can phan tich', group: '' }
      case 'normality': return { dep: 'Bien can kiem dinh', group: '' }
      default: return { dep: 'Bien phu thuoc', group: 'Bien phan nhom' }
    }
  }

  const varLabels = getVariableLabel()

  return (
    <AppLayout>
      {wizardStep === 0 ? (
        /* ================ STEP 0: METHOD SELECTION ================ */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0C2D57] mb-2">Phan tich thong ke</h1>
              <p className="text-base text-neutral-500">Chon phuong phap phan tich phu hop voi du lieu va muc tieu nghien cuu.</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => navigate('/analysis/builder')}>
              <ExternalLink className="w-4 h-4" />
              Trinh phan tich nang cao
            </Button>
          </div>

          <div className="relative mb-8 max-w-lg">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tim phan tich..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full pl-12 pr-4 rounded-lg border border-neutral-300 text-base focus:border-[#1B5F99] focus:ring-[3px] focus:ring-[rgba(27,95,153,0.12)] outline-none transition-all"
            />
          </div>

          {categories.map((category) => (
            <div key={category} className="mb-10">
              <h2 className="text-lg font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1B5F99]" />
                {category}
              </h2>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {filteredMethods
                  .filter((m) => m.category === category)
                  .map((m) => {
                    const Icon = m.icon
                    return (
                      <motion.div
                        key={m.id}
                        variants={fadeInUp}
                        whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedMethod(m.id)
                          setWizardStep(1)
                        }}
                        className="bg-white border border-neutral-200 rounded-xl p-6 cursor-pointer transition-colors hover:border-[#1B5F99]/30 flex flex-col gap-4"
                      >
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: m.bgColor }}>
                          <Icon className="w-6 h-6" style={{ color: m.color }} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-neutral-900">{m.nameVi}</h3>
                          <p className="text-sm text-neutral-500 mt-1">{m.name}</p>
                          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{m.description}</p>
                        </div>
                      </motion.div>
                    )
                  })}
              </motion.div>
            </div>
          ))}

          {storedAnalyses.length > 0 && (
            <div className="mt-14">
              <h2 className="text-lg font-semibold text-neutral-700 mb-4">Phan tich gan day</h2>
              <div className="space-y-3">
                {storedAnalyses.slice(-5).reverse().map((a) => (
                  <div key={a.id} className="bg-white border rounded-lg p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <BarChart3 className="size-5 text-primary" />
                      <div>
                        <p className="text-base font-medium">{a.methodNameVi} - {a.datasetName}</p>
                        <p className="text-sm text-muted-foreground">{a.projectName} &middot; {new Date(a.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <Badge variant={a.results.testStatistic && a.results.testStatistic.pValue < 0.05 ? 'default' : 'secondary'} className="text-xs">
                      {a.results.testStatistic ? `p = ${a.results.testStatistic.pValue.toFixed(3)}` : 'Hoan tat'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        /* ================ WIZARD LAYOUT ================ */
        <div className="flex gap-0 -m-6 lg:-m-8 h-[calc(100dvh-64px)]">
          {/* ---- LEFT PANEL: Step Navigator ---- */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-[320px] bg-white border-r border-neutral-200 flex flex-col flex-shrink-0"
          >
            <div className="px-5 py-5 border-b border-neutral-200">
              <Button variant="ghost" size="sm" className="text-neutral-500 gap-2 mb-4 text-sm" onClick={goBack}>
                <ArrowLeft className="w-5 h-5" />
                Quay lai
              </Button>
              <h2 className="text-lg font-semibold text-neutral-900">Cac buoc phan tich</h2>
            </div>

            <ScrollArea className="flex-1">
              {[
                { step: 1, label: 'Chon du an', desc: selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : 'Chon du an chua du lieu' },
                { step: 2, label: 'Chon bo du lieu', desc: selectedDatasetId ? allDatasets.find(d => d.id === selectedDatasetId)?.name : 'Chon dataset de phan tich' },
                { step: 3, label: 'Xac nhan phuong phap', desc: method ? method.nameVi : 'Chon phuong phap phan tich' },
                { step: 4, label: 'Chon bien', desc: config.dependentVariable ? `${config.dependentVariable}${config.groupingVariables.length > 0 ? ' / ' + config.groupingVariables.join(', ') : ''}${config.independentVariables.length > 0 ? ' / ' + config.independentVariables.join(', ') : ''}` : 'Chon bien phan tich' },
                { step: 5, label: 'Ket qua', desc: 'Xem va luu ket qua phan tich' },
              ].map((item) => (
                <div key={item.step} className="px-5 py-4 border-b border-neutral-100">
                  <button
                    onClick={() => {
                      if (item.step <= 2 || (item.step === 3 && selectedDatasetId) || (item.step === 4 && selectedMethod)) {
                        setWizardStep(item.step);
                        if (item.step < 5) { setHasResults(false); }
                      }
                    }}
                    disabled={item.step > (currentResults ? 5 : 4) || (item.step > 1 && !selectedProjectId) || (item.step > 2 && !selectedDatasetId) || (item.step > 3 && !selectedMethod)}
                    className={cn('w-full flex items-start gap-4 text-left transition-all', wizardStep === item.step ? 'opacity-100' : wizardStep > item.step ? 'opacity-70' : 'opacity-40')}
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5', wizardStep > item.step ? 'bg-[#2A9D8F] text-white' : wizardStep === item.step ? 'bg-[#1B5F99] text-white' : 'bg-neutral-200 text-neutral-500')}>
                      {wizardStep > item.step ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                    </div>
                    <div>
                      <div className={cn('text-base font-medium', wizardStep === item.step ? 'text-[#1B5F99]' : 'text-neutral-800')}>{item.label}</div>
                      <div className="text-sm text-neutral-400 mt-1">{item.desc}</div>
                    </div>
                  </button>
                </div>
              ))}
            </ScrollArea>
          </motion.div>

          {/* ---- CENTER PANEL: Main Content ---- */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }} className="flex-1 bg-neutral-50 flex flex-col min-w-0">
            <div className="px-8 py-6 bg-white border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">
                {wizardStep === 1 && 'Chon du an'}
                {wizardStep === 2 && 'Chon bo du lieu'}
                {wizardStep === 3 && (method ? `${method.nameVi}: ${method.description}` : 'Chon phuong phap')}
                {wizardStep === 4 && 'Cau hinh bien so'}
                {wizardStep === 5 && 'Ket qua phan tich'}
              </h2>
              <p className="text-base text-neutral-500 mt-2">
                {wizardStep === 1 && 'Chon du an chua du lieu ban muon phan tich'}
                {wizardStep === 2 && `Chon bo du lieu tu du an "${projects.find(p => p.id === selectedProjectId)?.name}"`}
                {wizardStep === 3 && 'Xac nhan phuong phap phan tich'}
                {wizardStep === 4 && 'Chon bien phan tich va cau hinh tuy chon'}
                {wizardStep === 5 && 'Ket qua phan tich thong ke'}
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8">
                {/* ===== STEP 1: Select Project ===== */}
                {wizardStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div className="grid grid-cols-1 gap-4">
                      {projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-white">
                          <FolderOpen className="size-16 text-neutral-300 mb-5" />
                          <p className="text-neutral-500 text-xl font-medium mb-2">Chua co du an nao</p>
                          <p className="text-neutral-400 text-base max-w-sm">Chon "Khong co du an" de su dung du lieu chung</p>
                        </div>
                      ) : (
                        projects.map((project) => {
                          const datasetCount = (() => { try { const raw = localStorage.getItem(`statspro-datasets-${project.id}`); return raw ? (JSON.parse(raw) as Dataset[]).length : 0 } catch { return 0 } })()
                          return (
                            <div
                              key={project.id}
                              className={cn('bg-white border rounded-xl p-5 cursor-pointer transition-all flex items-center gap-5', selectedProjectId === project.id ? 'border-[#1B5F99] bg-[#F4FAFF]' : 'border-neutral-200 hover:border-neutral-400')}
                              onClick={() => { setSelectedProjectId(project.id); setSelectedDatasetId(''); setWizardStep(2) }}
                            >
                              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <FolderOpen className="size-7 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-neutral-900">{project.name}</h3>
                                <p className="text-sm text-neutral-500 mt-1">{project.description || 'Khong co mo ta'}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">{datasetCount} bo du lieu</Badge>
                                </div>
                              </div>
                              {selectedProjectId === project.id && <CheckCircle2 className="w-6 h-6 text-[#1B5F99] shrink-0" />}
                            </div>
                          )
                        })
                      )}
                      <div
                        className={cn('bg-white border rounded-xl p-5 cursor-pointer transition-all flex items-center gap-5', selectedProjectId === '__none__' ? 'border-[#1B5F99] bg-[#F4FAFF]' : 'border-neutral-200 hover:border-neutral-400')}
                        onClick={() => { setSelectedProjectId('__none__'); setSelectedDatasetId(''); setWizardStep(2) }}
                      >
                        <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                          <Database className="size-7 text-neutral-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-neutral-900">Khong co du an</h3>
                          <p className="text-sm text-neutral-500">Su dung du lieu chung (global datasets)</p>
                        </div>
                        {selectedProjectId === '__none__' && <CheckCircle2 className="w-6 h-6 text-[#1B5F99] shrink-0" />}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ===== STEP 2: Select Dataset ===== */}
                {wizardStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    {allDatasets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-white">
                        <Database className="size-16 text-neutral-300 mb-5" />
                        <p className="text-neutral-500 text-xl font-medium mb-2">Chua co bo du lieu</p>
                        <p className="text-neutral-400 text-base max-w-sm mb-6">Vui long nhap du lieu truoc khi phan tich</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {allDatasets.map((ds) => (
                          <div
                            key={ds.id}
                            className={cn('bg-white border rounded-xl p-5 cursor-pointer transition-all flex items-center gap-5', selectedDatasetId === ds.id ? 'border-[#1B5F99] bg-[#F4FAFF]' : 'border-neutral-200 hover:border-neutral-400')}
                            onClick={() => { setSelectedDatasetId(ds.id); setWizardStep(3) }}
                          >
                            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                              <Database className="size-7 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-neutral-900">{ds.name}</h3>
                              <p className="text-sm text-neutral-500">{ds.rowCount} dong &middot; {ds.colCount} cot</p>
                              <p className="text-sm text-neutral-400 mt-1">{ds.headers.join(', ').slice(0, 80)}{ds.headers.join(', ').length > 80 ? '...' : ''}</p>
                            </div>
                            {selectedDatasetId === ds.id && <CheckCircle2 className="w-6 h-6 text-[#1B5F99] shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ===== STEP 3: Confirm Method ===== */}
                {wizardStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    {method && (
                      <div className="bg-white border rounded-xl p-8">
                        <div className="flex items-center gap-5 mb-6">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: method.bgColor }}>
                            <method.icon className="w-8 h-8" style={{ color: method.color }} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-neutral-900">{method.nameVi}</h3>
                            <p className="text-base text-neutral-500">{method.description}</p>
                          </div>
                        </div>
                        <div className="space-y-3 text-base text-neutral-600">
                          <p><strong>Dataset:</strong> {selectedDataset?.name} ({selectedDataset?.rowCount} dong, {selectedDataset?.colCount} cot)</p>
                          <p><strong>Cot so:</strong> {numericCols.join(', ') || 'Khong co'}</p>
                          <p><strong>Cot phan loai:</strong> {categoricalCols.join(', ') || 'Khong co'}</p>
                        </div>
                        <Button className="mt-6 gap-2 h-12 px-6" size="lg" onClick={() => setWizardStep(4)}>
                          Tiep tuc chon bien
                          <ChevronLeft className="w-5 h-5 rotate-180" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ===== STEP 4: Full-Screen Variable Selection ===== */}
                {wizardStep === 4 && selectedDataset && (
                  <DndContext onDragEnd={handleDragEnd}>
                    <div className="fixed inset-0 z-50 bg-white flex flex-col">
                      {/* Header */}
                      <div className="h-16 border-b flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                          <h1 className="text-2xl font-bold">Chon bien phan tich</h1>
                          <Badge variant="secondary" className="text-sm">{method?.nameVi}</Badge>
                        </div>
                        <Button variant="outline" size="lg" className="h-12 px-6 gap-2" onClick={() => setWizardStep(3)}>
                          <ChevronLeft className="w-5 h-5" />
                          Quay lai
                        </Button>
                      </div>

                      {/* Content - full height */}
                      <div className="flex-1 flex overflow-hidden">
                        {/* Left: Drop zones Y/X */}
                        <div className="w-1/3 border-r p-6 space-y-6 overflow-y-auto">
                          {/* Error message */}
                          {errorMessage && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                              <p className="text-sm text-red-700">{errorMessage}</p>
                            </div>
                          )}

                          {/* Confidence Level */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Muc tin cay</h3>
                            <div className="flex gap-3">
                              {[90, 95, 99].map((level) => (
                                <button
                                  key={level}
                                  onClick={() => setConfig((prev) => ({ ...prev, confidenceLevel: level }))}
                                  className={cn('px-6 py-3 rounded-lg text-lg font-semibold border transition-all', config.confidenceLevel === level ? 'bg-[#1B5F99] text-white border-[#1B5F99]' : 'bg-white text-neutral-600 border-neutral-300 hover:border-[#1B5F99]')}
                                >
                                  {level}%
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Drop Zone Y - Dependent Variable */}
                          <div className="space-y-2">
                            <label className="text-lg font-semibold text-neutral-700 block">{varLabels.dep} <span className="text-sm font-normal text-[#1B5F99]">(Y)</span></label>
                            <DroppableArea
                              id="drop-y"
                              label="Keo bien vao day"
                              color="#1B5F99"
                              bgColor="#F4FAFF"
                              className="border-[#1B5F99]/30 min-h-[100px]"
                            >
                              {config.dependentVariable ? (
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="bg-[#1B5F99] text-white text-base px-4 py-2">{config.dependentVariable}</Badge>
                                  <span className="text-base text-neutral-500">{numericCols.includes(config.dependentVariable) ? 'Dinh luong' : 'Dinh tinh'}</span>
                                  <button onClick={() => setDependentVariable(null)} className="ml-auto text-neutral-400 hover:text-[#E76F51]"><X className="w-6 h-6" /></button>
                                </div>
                              ) : null}
                            </DroppableArea>
                          </div>

                          {/* Drop Zone X/Group */}
                          <div className="space-y-2">
                            <label className="text-lg font-semibold text-neutral-700 block">
                              {(selectedMethod === 'correlation' || selectedMethod === 'regression')
                                ? ((varLabels as any).indep || 'Bien doc lap X')
                                : (varLabels.group || 'Bien phan nhom')}
                              <span className="text-sm font-normal text-muted-foreground ml-2">(co the chon nhieu)</span>
                            </label>
                            <DroppableArea
                              id={(selectedMethod === 'correlation' || selectedMethod === 'regression') ? 'drop-x' : 'drop-group'}
                              label="Keo bien vao day"
                              color={(selectedMethod === 'correlation' || selectedMethod === 'regression') ? '#8B5CF6' : '#2A9D8F'}
                              bgColor={(selectedMethod === 'correlation' || selectedMethod === 'regression') ? '#F5F3FF' : '#E6F7F5'}
                              className={(selectedMethod === 'correlation' || selectedMethod === 'regression') ? 'border-[#8B5CF6]/30 min-h-[100px]' : 'border-[#2A9D8F]/30 min-h-[100px]'}
                            >
                              {(selectedMethod === 'correlation' || selectedMethod === 'regression')
                                ? (config.independentVariables.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {config.independentVariables.map((v) => (
                                        <Badge key={v} variant="secondary" className="bg-[#8B5CF6] text-white text-base px-4 py-2 flex items-center gap-2">
                                          {v}
                                          <button onClick={() => toggleIndependentVariable(v)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : null)
                                : (config.groupingVariables.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {config.groupingVariables.map((v) => (
                                        <Badge key={v} variant="secondary" className="bg-[#2A9D8F] text-white text-base px-4 py-2 flex items-center gap-2">
                                          {v}
                                          <button onClick={() => toggleGroupingVariable(v)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : null)
                              }
                            </DroppableArea>
                          </div>

                          {/* Legend */}
                          <div className="pt-4 border-t border-neutral-200 space-y-3 text-base text-muted-foreground">
                            <div className="flex items-center gap-3"><span className="inline-block w-3 h-3 rounded-full bg-primary-400" />So (Numeric)</div>
                            <div className="flex items-center gap-3"><span className="inline-block w-3 h-3 rounded-full bg-orange-400" />Chuoi (Categorical)</div>
                            <div className="flex items-center gap-3"><span className="inline-block w-5 h-5 rounded bg-[#1B5F99]" />Bien phu thuoc</div>
                            <div className="flex items-center gap-3"><span className="inline-block w-5 h-5 rounded bg-[#2A9D8F]" />Bien phan nhom</div>
                            <div className="flex items-center gap-3"><span className="inline-block w-5 h-5 rounded bg-[#8B5CF6]" />Bien doc lap</div>
                          </div>

                          {/* Advanced Options */}
                          <div className="rounded-xl border border-neutral-200 overflow-hidden">
                            <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors">
                              <span className="text-lg font-semibold text-neutral-800">Tuy chon nang cao</span>
                              {showOptions ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                            </button>
                            <AnimatePresence>
                              {showOptions && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                  <div className="px-6 pb-6 space-y-5 border-t border-neutral-100 pt-5">
                                    <div>
                                      <label className="text-base font-semibold text-neutral-600 mb-3 block">Gia thuyet doi</label>
                                      <RadioGroup value={config.alternativeHypothesis} onValueChange={(v) => setConfig((prev) => ({ ...prev, alternativeHypothesis: v as 'two-tailed' | 'less' | 'greater' }))} className="flex flex-col gap-3">
                                        {[{ value: 'two-tailed' as const, label: 'Hai phia (\u2260)' }, { value: 'less' as const, label: 'Nho hon (<)' }, { value: 'greater' as const, label: 'Lon hon (>)' }].map((opt) => (
                                          <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                                            <RadioGroupItem value={opt.value} />
                                            <span className="text-base text-neutral-700">{opt.label}</span>
                                          </label>
                                        ))}
                                      </RadioGroup>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Right: Variable list */}
                        <div className="w-2/3 p-6 overflow-y-auto">
                          <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <Info className="w-5 h-5 text-neutral-400" />
                            Danh sach cot - keo tha bien vao khung ben trai
                          </h2>
                          <div className="grid grid-cols-4 gap-3">
                            {allCols.map((col) => {
                              const isDep = config.dependentVariable === col
                              const isGroup = config.groupingVariables.includes(col)
                              const isIndep = config.independentVariables.includes(col)
                              const isUsed = isDep || isGroup || isIndep
                              const isNumeric = numericCols.includes(col)

                              const canBeDep = !isUsed || isDep
                              const canBeGroup = (selectedMethod === 'ttest' || selectedMethod === 'anova' || selectedMethod === 'chisquare') && config.dependentVariable !== null && col !== config.dependentVariable && !isIndep
                              const canBeIndep = (selectedMethod === 'correlation' || selectedMethod === 'regression') && config.dependentVariable !== null && col !== config.dependentVariable && isNumeric && !isGroup
                              const canSelect = canBeDep || canBeGroup || canBeIndep

                              return (
                                <DraggableVariable
                                  key={col}
                                  col={col}
                                  isNumeric={isNumeric}
                                  isUsed={isUsed}
                                  isDep={isDep}
                                  isGroup={isGroup}
                                  isIndep={isIndep}
                                  canSelect={canSelect}
                                />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="h-20 border-t flex items-center justify-between px-6 bg-white">
                        <div className="flex items-center gap-4">
                          <span className="text-base text-neutral-500">
                            {config.dependentVariable ? (
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[#2A9D8F]" />
                                Y: <strong>{config.dependentVariable}</strong>
                                {config.groupingVariables.length > 0 && <span> | Nhom: <strong>{config.groupingVariables.join(', ')}</strong></span>}
                                {config.independentVariables.length > 0 && <span> | X: <strong>{config.independentVariables.join(', ')}</strong></span>}
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-[#F4A261]" />
                                Vui long chon bien phu thuoc Y
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex gap-4">
                          <Button variant="outline" size="lg" className="h-12 px-6 gap-2" onClick={() => setWizardStep(3)}>
                            <ChevronLeft className="w-5 h-5" />
                            Quay lai
                          </Button>
                          <Button
                            size="lg"
                            className="h-12 px-8 bg-[#1B5F99] hover:bg-[#247BA0] text-white gap-2 text-base"
                            disabled={!canRun || isRunning}
                            onClick={runAnalysis}
                          >
                            {isRunning ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <Play className="w-5 h-5" />}
                            {isRunning ? 'Dang phan tich...' : 'Chay phan tich'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DndContext>
                )}

                {/* ===== STEP 5: Full-Screen Results ===== */}
                {wizardStep === 5 && currentResults && (
                  <div className="fixed inset-0 z-50 bg-neutral-50 flex flex-col">
                    {/* Header */}
                    <div className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
                      <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Ket qua phan tich</h1>
                        <p className="text-sm text-neutral-500">{method?.nameVi} — {selectedDataset?.name}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setWizardStep(4)} className="gap-2">
                          <ChevronLeft className="w-5 h-5" /> Quay lai
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <Download className="w-5 h-5" /> Xuat bao cao
                        </Button>
                        <Button onClick={goBack} className="gap-2 bg-[#1B5F99] hover:bg-[#247BA0] text-white">
                          <Plus className="w-5 h-5" /> Phan tich moi
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                      <div className="max-w-7xl mx-auto space-y-6">

                        {/* Summary Banner */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border">
                          <div className="flex items-center gap-4 mb-3">
                            <Badge className="text-sm px-3 py-1" style={{ backgroundColor: method?.color, color: 'white' }}>{method?.nameVi}</Badge>
                            <span className="text-base text-neutral-500">Dataset: {selectedDataset?.name} &middot; Muc tin cay: {config.confidenceLevel}% &middot; {currentResults.descriptiveStats?.reduce((a, s) => a + s.n, 0) || selectedDataset?.rowCount} quan sat</span>
                          </div>
                          {(config.groupingVariables.length > 0 || config.independentVariables.length > 0) && (
                            <p className="text-base text-neutral-600">
                              <strong>Bien phu thuoc:</strong> {config.dependentVariable}
                              {config.groupingVariables.length > 0 && ` | <strong>Bien phan nhom:</strong> ${config.groupingVariables.join(', ')}`}
                              {config.independentVariables.length > 0 && ` | <strong>Bien doc lap:</strong> ${config.independentVariables.join(', ')}`}
                            </p>
                          )}
                        </div>

                        {/* Chart */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border">
                          <h2 className="text-xl font-semibold mb-4">Bieu do truc quan</h2>
                          {selectedMethod === 'correlation' || selectedMethod === 'regression' ? (
                            <div className="text-base text-neutral-500 text-center py-8">Bieu do Scatter cho tuong quan/hoi quy duoc hien thi o muc Data Visualization.</div>
                          ) : (
                            <ResponsiveContainer width="100%" height={400}>
                              <BarChart data={buildResultChartData(currentResults, selectedMethod || '')} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#374151' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                                <YAxis tick={{ fontSize: 13, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <ReTooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px' }} />
                                <Legend wrapperStyle={{ fontSize: 14, paddingTop: 10 }} />
                                <Bar dataKey="TrungBinh" name="Trung binh" fill="#1B5F99" radius={[4, 4, 0, 0]} />
                                {selectedMethod === 'ttest' && <Bar dataKey="DoLechChuan" name="Do lech chuan" fill="#E8723A" radius={[4, 4, 0, 0]} />}
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        {/* Row 1: Descriptive Stats + Test Statistic */}
                        <div className="grid grid-cols-2 gap-6">
                          {/* Descriptive Stats Full */}
                          {currentResults.descriptiveStats && currentResults.descriptiveStats.length > 0 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border">
                              <h2 className="text-xl font-semibold mb-4">Thong ke mo ta</h2>
                              <div className="rounded-lg border overflow-hidden">
                                <UITable>
                                  <TableHeader>
                                    <TableRow className="bg-neutral-100">
                                      <TableHead className="text-sm py-3 px-4 font-semibold">Bien/Nhom</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">N</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">Mean</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">SD</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">Median</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">Min</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">Max</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {currentResults.descriptiveStats.map((s, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="text-sm font-medium py-3 px-4">{s.group}</TableCell>
                                        <TableCell className="text-sm text-right font-mono py-3 px-4">{s.n}</TableCell>
                                        <TableCell className="text-sm text-right font-mono py-3 px-4">{s.mean.toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-right font-mono py-3 px-4">{s.sd.toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-right font-mono py-3 px-4">{s.median.toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-right font-mono py-3 px-4">{s.min.toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-right font-mono py-3 px-4">{s.max.toFixed(2)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </UITable>
                              </div>
                            </div>
                          )}

                          {/* Test Statistic Table */}
                          <div className="bg-white rounded-xl p-6 shadow-sm border">
                            <h2 className="text-xl font-semibold mb-4">Kiem dinh thong ke</h2>
                            {currentResults.testStatistic ? (
                              <div className="rounded-lg border overflow-hidden">
                                <UITable>
                                  <TableHeader>
                                    <TableRow className="bg-neutral-100">
                                      <TableHead className="text-sm py-3 px-4 font-semibold">Thong ke</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">Gia tri</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">df</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">p-value</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">Ket luan</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell className="text-sm font-medium py-3 px-4">{currentResults.testStatistic.name}</TableCell>
                                      <TableCell className="text-sm text-right font-mono py-3 px-4">{currentResults.testStatistic.value.toFixed(3)}</TableCell>
                                      <TableCell className="text-sm text-right font-mono py-3 px-4">{currentResults.testStatistic.df}</TableCell>
                                      <TableCell className="text-sm text-right font-mono py-3 px-4">
                                        <span className={currentResults.testStatistic.pValue < 0.05 ? 'text-[#1B5F99] font-bold' : 'text-[#2A9D8F]'}>{currentResults.testStatistic.pValue.toFixed(4)}</span>
                                      </TableCell>
                                      <TableCell className="text-sm text-right py-3 px-4">
                                        <Badge className={currentResults.testStatistic.pValue < 0.05 ? 'bg-[#1B5F99] text-white' : 'bg-[#2A9D8F] text-white'}>
                                          {currentResults.testStatistic.pValue < 0.05 ? 'Y nghia' : 'Khong y nghia'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </UITable>
                                {currentResults.testStatistic.ciLower !== undefined && (
                                  <div className="px-4 py-3 bg-neutral-50 text-sm text-neutral-600 border-t">
                                    Khoang tin cay {config.confidenceLevel}%: [{currentResults.testStatistic.ciLower.toFixed(3)}, {currentResults.testStatistic.ciUpper?.toFixed(3)}]
                                  </div>
                                )}
                                {currentResults.testStatistic.detail && <div className="px-4 py-3 bg-neutral-50 text-sm text-neutral-500 border-t">{currentResults.testStatistic.detail}</div>}
                              </div>
                            ) : (
                              <p className="text-base text-neutral-500">Khong co thong ke kiem dinh cho phan tich nay.</p>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Effect Size + Assumptions */}
                        <div className="grid grid-cols-2 gap-6">
                          {/* Effect Size */}
                          <div className="bg-white rounded-xl p-6 shadow-sm border">
                            <h2 className="text-xl font-semibold mb-4">Co hieu ung</h2>
                            {currentResults.effectSize ? (
                              <div className="rounded-lg border overflow-hidden">
                                <UITable>
                                  <TableHeader>
                                    <TableRow className="bg-neutral-100">
                                      <TableHead className="text-sm py-3 px-4 font-semibold">Chi so</TableHead>
                                      <TableHead className="text-sm text-right py-3 px-4 font-semibold">Gia tri</TableHead>
                                      <TableHead className="text-sm py-3 px-4 font-semibold">Dien giai</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell className="text-sm font-medium py-3 px-4">{currentResults.effectSize.name}</TableCell>
                                      <TableCell className="text-sm text-right font-mono py-3 px-4 font-bold">{currentResults.effectSize.value.toFixed(3)}</TableCell>
                                      <TableCell className="text-sm py-3 px-4">{currentResults.effectSize.interpretation}</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </UITable>
                              </div>
                            ) : (
                              <p className="text-base text-neutral-500">Khong co co hieu ung cho phan tich nay.</p>
                            )}
                          </div>

                          {/* Assumptions */}
                          <div className="bg-white rounded-xl p-6 shadow-sm border">
                            <h2 className="text-xl font-semibold mb-4">Kiem dinh gia dinh</h2>
                            {currentResults.assumptions && currentResults.assumptions.length > 0 ? (
                              <div className="space-y-3">
                                {currentResults.assumptions.map((check, i) => (
                                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                                    <CheckCircle2 className={`w-6 h-6 flex-shrink-0 ${check.status === 'passed' ? 'text-[#2A9D8F]' : check.status === 'warning' ? 'text-[#F4A261]' : 'text-[#E76F51]'}`} />
                                    <div className="flex-1">
                                      <div className="text-base font-semibold text-neutral-800">{check.name}</div>
                                      <div className="text-sm text-neutral-500">{check.detail}</div>
                                    </div>
                                    <Badge className={check.status === 'passed' ? 'bg-[#2A9D8F] text-white' : check.status === 'warning' ? 'bg-[#F4A261] text-white' : 'bg-[#E76F51] text-white'}>
                                      {check.status === 'passed' ? 'Dat' : check.status === 'warning' ? 'Canh bao' : 'Vi pham'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-base text-neutral-500">Khong co kiem dinh gia dinh cho phan tich nay.</p>
                            )}
                          </div>
                        </div>

                        {/* ANOVA Table */}
                        {currentResults.anovaTable && (
                          <div className="bg-white rounded-xl p-6 shadow-sm border">
                            <h2 className="text-xl font-semibold mb-4">{currentResults.anovaTable.title}</h2>
                            <div className="rounded-lg border overflow-hidden">
                              <UITable>
                                <TableHeader>
                                  <TableRow className="bg-neutral-100">
                                    {currentResults.anovaTable.headers.map((h, i) => <TableHead key={i} className="text-sm py-3 px-4 font-semibold">{h}</TableHead>)}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {currentResults.anovaTable.rows.map((row, ri) => (
                                    <TableRow key={ri}>
                                      {row.map((cell, ci) => <TableCell key={ci} className="text-sm font-mono py-3 px-4">{typeof cell === 'number' ? cell.toFixed(3) : cell}</TableCell>)}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </UITable>
                            </div>
                          </div>
                        )}

                        {/* Post-hoc Table */}
                        {currentResults.postHocTable && (
                          <div className="bg-white rounded-xl p-6 shadow-sm border">
                            <h2 className="text-xl font-semibold mb-4">{currentResults.postHocTable.title}</h2>
                            <div className="rounded-lg border overflow-hidden">
                              <UITable>
                                <TableHeader>
                                  <TableRow className="bg-neutral-100">
                                    {currentResults.postHocTable.headers.map((h, i) => <TableHead key={i} className="text-sm py-3 px-4 font-semibold">{h}</TableHead>)}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {currentResults.postHocTable.rows.map((row, ri) => (
                                    <TableRow key={ri}>
                                      {row.map((cell, ci) => <TableCell key={ci} className="text-sm font-mono py-3 px-4">{cell}</TableCell>)}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </UITable>
                            </div>
                          </div>
                        )}

                        {/* Additional Tables */}
                        {currentResults.additionalTables && currentResults.additionalTables.map((table, ti) => (
                          <div key={ti} className="bg-white rounded-xl p-6 shadow-sm border">
                            <h2 className="text-xl font-semibold mb-4">{table.title}</h2>
                            <div className="rounded-lg border overflow-hidden">
                              <UITable>
                                <TableHeader>
                                  <TableRow className="bg-neutral-100">
                                    {table.headers.map((h, i) => <TableHead key={i} className="text-sm py-3 px-4 font-semibold">{h}</TableHead>)}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {table.rows.map((row, ri) => (
                                    <TableRow key={ri}>
                                      {row.map((cell, ci) => <TableCell key={ci} className="text-sm font-mono py-3 px-4">{typeof cell === 'number' ? cell.toFixed(3) : cell}</TableCell>)}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </UITable>
                            </div>
                          </div>
                        ))}

                        {/* Detailed Interpretation */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border">
                          <h2 className="text-xl font-semibold mb-4">Dien giai chi tiet</h2>
                          <div className="text-base leading-relaxed space-y-3 whitespace-pre-line text-neutral-700">
                            {generateDetailedInterpretation(currentResults, selectedMethod || '', method?.nameVi || '', config)}
                          </div>
                        </div>

                        {/* AI Analysis Section */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border">
                          <button onClick={() => setShowAI(!showAI)} className="w-full flex items-center justify-between hover:bg-neutral-50 transition-colors rounded-lg">
                            <div className="flex items-center gap-3">
                              <Brain className="w-6 h-6 text-purple-500" />
                              <span className="text-xl font-semibold text-neutral-800">Phan tich bang AI (Kimi)</span>
                            </div>
                            {showAI ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                          </button>
                          <AnimatePresence>
                            {showAI && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                <div className="mt-5 space-y-5 border-t border-neutral-100 pt-5">
                                  <div className="flex gap-3">
                                    <Input
                                      type="password"
                                      placeholder="Nhap Moonshot AI API key..."
                                      value={apiKey}
                                      onChange={(e) => setApiKey(e.target.value)}
                                      className="flex-1 text-base h-12"
                                    />
                                    <Button
                                      onClick={handleAIAnalysis}
                                      disabled={isAILoading || !apiKey.trim()}
                                      className="bg-purple-600 hover:bg-purple-700 gap-2 h-12 px-6"
                                      size="lg"
                                    >
                                      {isAILoading ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                      ) : (
                                        <Sparkles className="w-5 h-5" />
                                      )}
                                      {isAILoading ? 'Dang phan tich...' : 'Phan tich'}
                                    </Button>
                                  </div>

                                  {aiError && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-sm text-amber-700">{aiError}</p>
                                      </div>
                                    </div>
                                  )}

                                  {aiInterpretation && (
                                    <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
                                      <h5 className="text-base font-bold text-purple-700 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        Dien giai tu AI
                                      </h5>
                                      <div className="text-base text-neutral-700 leading-relaxed whitespace-pre-wrap">{aiInterpretation}</div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Action Bar */}
            <div className="px-8 py-5 bg-white border-t border-neutral-200 flex gap-4">
              {wizardStep === 4 && (
                <>
                  <Button className="flex-1 bg-[#1B5F99] hover:bg-[#247BA0] text-white gap-2 h-12 text-base" size="lg" disabled={!canRun || isRunning} onClick={runAnalysis}>
                    {isRunning ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <Play className="w-5 h-5" />}
                    {isRunning ? 'Dang phan tich...' : 'Chay phan tich'}
                  </Button>
                  <Button variant="outline" className="gap-2 h-12 text-base" size="lg" onClick={() => setWizardStep(3)}>
                    <ChevronLeft className="w-5 h-5" />
                    Quay lai
                  </Button>
                </>
              )}
              {wizardStep < 4 && wizardStep > 0 && (
                <Button variant="outline" className="gap-2 h-12 text-base" size="lg" onClick={() => setWizardStep((s) => Math.max(0, s - 1))}>
                  <ChevronLeft className="w-5 h-5" />
                  Quay lai
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  )
}
