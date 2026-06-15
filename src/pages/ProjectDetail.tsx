import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// Checkbox removed - using drag & drop instead
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { parseFile, type ParsedData } from '@/lib/fileParsers';
import {
  descriptiveStats, tTestIndependent, anovaOneWay, chiSquareTest,
  pearsonCorrelation, linearRegression, jarqueBeraTest,
  extractNumericColumn, getUniqueValues, detectNumericColumns,
} from '@/lib/statistics';
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { analyzeWithAI, getAIApiKey, saveAIApiKey, getAIConfigItems, runAutoAIWithCallbacks } from '@/lib/aiAPI';
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  FileText,
  Trash2,
  Database,
  BarChart3,
  FileBarChart,
  ArrowLeft,
  Table as TableIcon,
  X,
  Check,
  Plus,
  Play,
  ArrowUpDown,
  ArrowLeftRight,
  Grid3X3,
  ScatterChart,
  TrendingUp,
  Calculator,
  Bell,
  ChevronRight,
  ChevronLeft,
  Save,
  Eye,
  FolderOpen,
  Activity,
  Clock,
  Sparkles,
  AlertTriangle,
  Brain,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: string;
}

interface Dataset {
  id: string;
  name: string;
  fileType: string;
  rowCount: number;
  colCount: number;
  headers: string[];
  rows: Record<string, any>[];
  uploadedAt: string;
}

interface AnalysisResult {
  id: string;
  methodId: string;
  methodName: string;
  methodNameVi: string;
  datasetId: string;
  datasetName: string;
  dependentVariable: string;
  groupingVariables: string[];
  independentVariables: string[];
  confidenceLevel: number;
  results: AnalysisResultsData;
  createdAt: string;
}

interface AnalysisResultsData {
  descriptiveStats?: DescriptiveStat[];
  testStatistic?: TestStatistic;
  effectSize?: EffectSize;
  assumptions?: AssumptionCheck[];
  interpretation: string;
  additionalTables?: AdditionalTable[];
}

interface DescriptiveStat {
  group: string;
  n: number;
  mean: number;
  sd: number;
  median?: number;
  min?: number;
  max?: number;
}

interface TestStatistic {
  name: string;
  value: number;
  df?: string;
  pValue: number;
  ciLower?: number;
  ciUpper?: number;
  detail?: string;
}

interface EffectSize {
  name: string;
  value: number;
  interpretation: string;
}

interface AssumptionCheck {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  detail: string;
}

interface AdditionalTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

interface Report {
  id: string;
  title: string;
  analysisIds: string[];
  content: ReportSection[];
  createdAt: string;
}

interface ReportSection {
  title: string;
  body: string;
}

interface ActivityItem {
  id: string;
  type: 'import' | 'analysis' | 'report';
  description: string;
  timestamp: string;
}

interface AnalysisMethod {
  id: string;
  nameVi: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const METHODS: AnalysisMethod[] = [
  { id: 'ttest', nameVi: 'T-test', description: 'So sanh trung binh 2 nhom doc lap', icon: ArrowLeftRight, color: '#1B5F99', bgColor: '#F4FAFF' },
  { id: 'anova', nameVi: 'ANOVA', description: 'So sanh trung binh 3+ nhom doc lap', icon: Grid3X3, color: '#2A9D8F', bgColor: '#E6F7F5' },
  { id: 'chisquare', nameVi: 'Chi-square', description: 'Kiem tra lien he 2 bien phan loai', icon: TableIcon, color: '#F4A261', bgColor: '#FFF8ED' },
  { id: 'correlation', nameVi: 'Tuong quan', description: 'Tuong quan tuyen tinh giua 2 bien lien tuc', icon: ScatterChart, color: '#8B5CF6', bgColor: '#F5F3FF' },
  { id: 'regression', nameVi: 'Hoi quy tuyen tinh', description: 'Mo hinh hoa bien phu thuoc lien tuc', icon: TrendingUp, color: '#E76F51', bgColor: '#FEF2F2' },
  { id: 'descriptive', nameVi: 'Thong ke mo ta', description: 'Trung binh, do lech chuan, phan vi', icon: Calculator, color: '#1B5F99', bgColor: '#F4FAFF' },
  { id: 'normality', nameVi: 'Kiem dinh chuan', description: 'Kiem tra gia dinh phan phoi chuan', icon: Bell, color: '#84CC16', bgColor: '#F7FEE7' },
];

const ACCEPTED_EXTS = ['csv', 'xlsx', 'xls', 'json', 'tsv', 'txt'];
const ACCEPT_STRING = '.csv,.xlsx,.xls,.json,.tsv,.txt';

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
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border select-none ${
        isDep ? 'bg-[#1B5F99] text-white border-[#1B5F99]' :
        isGroup ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]' :
        isIndep ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]' :
        canSelect ? (isNumeric ? 'bg-white text-primary-700 border-primary-200 hover:border-primary-500 hover:bg-primary-50 cursor-grab active:cursor-grabbing' : 'bg-white text-orange-700 border-orange-200 hover:border-orange-500 hover:bg-orange-50 cursor-grab active:cursor-grabbing') :
        'bg-white text-neutral-300 border-neutral-100 cursor-not-allowed'
      }`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${isNumeric ? 'bg-primary-400' : 'bg-orange-400'} ${(isDep || isGroup || isIndep) && 'bg-white/70'}`} />
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
      className={`rounded-xl border-2 border-dashed transition-all p-4 min-h-[80px] ${isOver ? 'border-solid scale-[1.02] shadow-lg' : ''} ${className || ''}`}
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

const statusLabels: Record<string, string> = {
  active: 'Dang hoat dong',
  archived: 'Da luu tru',
  completed: 'Hoan thanh',
};

const statusBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  completed: 'secondary',
  archived: 'destructive',
};

/* ------------------------------------------------------------------ */
/*  Real Results Generator                                             */
/* ------------------------------------------------------------------ */

function runRealAnalysis(
  methodId: string,
  dataset: Dataset,
  depVar: string,
  groupVars: string[],
  indepVars: string[],
  confidenceLevel: number
): AnalysisResultsData {
  const alpha = 1 - confidenceLevel / 100;
  const rows = dataset.rows;
  const groupVar = groupVars.length > 0 ? groupVars[0] : '';
  const indepVar = indepVars.length > 0 ? indepVars[0] : '';

  switch (methodId) {
    case 'ttest': {
      if (!groupVar) throw new Error('Can bien phan nhom');
      const groups = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '');
      if (groups.length < 2) throw new Error('Can it nhat 2 nhom');
      const g1Values = extractNumericColumn(rows.filter((r) => String(r[groupVar]) === groups[0]), depVar);
      const g2Values = extractNumericColumn(rows.filter((r) => String(r[groupVar]) === groups[1]), depVar);
      if (g1Values.length < 2 || g2Values.length < 2) throw new Error('Moi nhom can it nhat 2 quan sat');
      const result = tTestIndependent(g1Values, g2Values, alpha);
      const ds1 = descriptiveStats(g1Values);
      const ds2 = descriptiveStats(g2Values);
      return {
        descriptiveStats: [
          { group: groups[0], n: ds1.n, mean: ds1.mean, sd: ds1.std, median: ds1.median, min: ds1.min, max: ds1.max },
          { group: groups[1], n: ds2.n, mean: ds2.mean, sd: ds2.std, median: ds2.median, min: ds2.min, max: ds2.max },
        ],
        testStatistic: { name: 't', value: result.t, df: `${result.df.toFixed(1)}`, pValue: result.pValue, ciLower: result.ciLower, ciUpper: result.ciUpper, detail: `Welch t-test` },
        effectSize: { name: "Cohen's d", value: result.cohenD, interpretation: result.effectSize },
        assumptions: [
          { name: 'Doc lap quan sat', status: 'passed', detail: 'Thiet ke nghien cuu dam bao' },
          { name: 'Phan phoi chuan', status: jarqueBeraTest(g1Values).normal && jarqueBeraTest(g2Values).normal ? 'passed' : 'warning', detail: `JB p = ${jarqueBeraTest(g1Values).pValue.toFixed(3)}, ${jarqueBeraTest(g2Values).pValue.toFixed(3)}` },
        ],
        interpretation: `T-test: ${result.significant ? 'Co su khac biet co y nghia' : 'Khong co su khac biet co y nghia'} giua "${groups[0]}" (M=${result.mean1.toFixed(2)}) va "${groups[1]}" (M=${result.mean2.toFixed(2)}), t(${result.df.toFixed(1)})=${result.t.toFixed(3)}, p=${result.pValue.toFixed(4)}. Cohen's d = ${result.cohenD.toFixed(2)} (${result.effectSize}).`,
        additionalTables: [{ title: 'Kiem dinh Levene', headers: ['F', 'df1', 'df2', 'Sig.'], rows: [['-', '-', '-', '-']] }],
      };
    }
    case 'anova': {
      if (!groupVar) throw new Error('Can bien phan nhom');
      const groups = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '');
      if (groups.length < 2) throw new Error('Can it nhat 2 nhom');
      const groupValues = groups.map((g) => extractNumericColumn(rows.filter((r) => String(r[groupVar]) === g), depVar));
      if (groupValues.some((g) => g.length < 2)) throw new Error('Moi nhom can it nhat 2 quan sat');
      const result = anovaOneWay(groupValues, alpha);
      const dsGroups = groupValues.map((g, i) => { const d = descriptiveStats(g); return { group: groups[i], n: d.n, mean: d.mean, sd: d.std, median: d.median, min: d.min, max: d.max }; });
      return {
        descriptiveStats: dsGroups,
        testStatistic: { name: 'F', value: result.f, df: `${result.dfBetween}, ${result.dfWithin}`, pValue: result.pValue, detail: 'Mot chieu' },
        effectSize: { name: 'Eta-squared', value: result.etaSquared, interpretation: result.etaSquared >= 0.14 ? 'Hieu ung lon' : result.etaSquared >= 0.06 ? 'Hieu ung trung binh' : result.etaSquared >= 0.01 ? 'Hieu ung nho' : 'Khong co hieu ung' },
        assumptions: [{ name: 'Doc lap quan sat', status: 'passed', detail: 'Thiet ke nghien cuu dam bao' }],
        interpretation: `ANOVA: ${result.significant ? 'Co su khac biet co y nghia' : 'Khong co su khac biet co y nghia'} giua cac nhom ve "${depVar}", F(${result.dfBetween}, ${result.dfWithin}) = ${result.f.toFixed(3)}, p = ${result.pValue.toFixed(4)}. Eta-squared = ${result.etaSquared.toFixed(3)}.`,
        additionalTables: [
          { title: 'Bang phuong sai ANOVA', headers: ['Nguon', 'SS', 'df', 'MS', 'F', 'Sig.'], rows: [['Giua nhom', result.ssBetween.toFixed(2), result.dfBetween, result.msBetween.toFixed(2), result.f.toFixed(3), result.pValue.toFixed(4)], ['Trong nhom', result.ssWithin.toFixed(2), result.dfWithin, result.msWithin.toFixed(2), '', ''], ['Tong', result.ssTotal.toFixed(2), result.dfBetween + result.dfWithin, '', '', '']] },
          ...(result.postHoc.length > 0 ? [{ title: 'Tukey HSD', headers: ['So sanh', 'Khac biet', 'p-value', 'Y nghia'], rows: result.postHoc.map((p) => [`${groups[p.group1]} vs ${groups[p.group2]}`, p.diff.toFixed(3), p.pValue.toFixed(4), p.significant ? 'Co y nghia' : 'Khong']) }] : []),
        ],
      };
    }
    case 'chisquare': {
      if (!groupVar) throw new Error('Can bien phan loai thu hai');
      const cat1Values = getUniqueValues(rows.map((r) => String(r[depVar]))).filter((v) => v !== '');
      const cat2Values = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '');
      if (cat1Values.length < 2 || cat2Values.length < 2) throw new Error('Can it nhat 2 danh muc cho moi bien');
      const observed: number[][] = cat1Values.map((c1) => cat2Values.map((c2) => rows.filter((r) => String(r[depVar]) === c1 && String(r[groupVar]) === c2).length));
      const result = chiSquareTest(observed, alpha);
      const tableHeaders = ['', ...cat2Values, 'Tong'];
      const tableRows = observed.map((row, i) => { const rowSum = row.reduce((a, b) => a + b, 0); return [cat1Values[i], ...row, rowSum]; });
      const colSums = cat2Values.map((_, j) => observed.reduce((a, row) => a + row[j], 0));
      tableRows.push(['Tong', ...colSums, rows.length]);
      return {
        testStatistic: { name: '\u03C7\u00B2', value: result.chi2, df: `${result.df}`, pValue: result.pValue, detail: 'Pearson Chi-Square' },
        effectSize: { name: "Cramer's V", value: result.cramersV, interpretation: result.cramersV >= 0.25 ? 'Hieu ung lon' : result.cramersV >= 0.15 ? 'Hieu ung trung binh' : result.cramersV >= 0.1 ? 'Hieu ung nho' : 'Khong co hieu ung' },
        assumptions: [
          { name: 'Tan so ky vong \u22655', status: result.expected.flat().filter((e) => e >= 5).length / result.expected.flat().length >= 0.8 ? 'passed' : 'warning', detail: `${Math.round(result.expected.flat().filter((e) => e >= 5).length / result.expected.flat().length * 100)}% o co tan so ky vong \u22655` },
          { name: 'Doc lap quan sat', status: 'passed', detail: 'Mau ngau nhien doc lap' },
        ],
        interpretation: `Chi-square: ${result.significant ? 'Co moi lien he co y nghia' : 'Khong co moi lien he co y nghia'} giua "${depVar}" va "${groupVar}", \u03C7\u00B2(${result.df}) = ${result.chi2.toFixed(3)}, p = ${result.pValue.toFixed(4)}. Cramer's V = ${result.cramersV.toFixed(3)}.`,
        additionalTables: [{ title: 'Bang cheo', headers: tableHeaders, rows: tableRows as any }],
      };
    }
    case 'correlation': {
      if (!indepVar) throw new Error('Can bien thu hai');
      const xValues = extractNumericColumn(rows, depVar);
      const yValues = extractNumericColumn(rows, indepVar);
      if (xValues.length < 3 || yValues.length < 3) throw new Error('Can it nhat 3 cap quan sat');
      const result = pearsonCorrelation(xValues, yValues, alpha);
      const dsX = descriptiveStats(xValues);
      const dsY = descriptiveStats(yValues);
      return {
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
        interpretation: `Tuong quan Pearson: r = ${result.r.toFixed(3)}, p = ${result.pValue.toFixed(4)}. Moi tuong quan ${result.direction.toLowerCase()} ${result.strength.toLowerCase()}, giai thich ${(result.rSquared * 100).toFixed(1)}% phuong sai. KTC ${confidenceLevel}%: [${result.ciLower.toFixed(3)}, ${result.ciUpper.toFixed(3)}].`,
      };
    }
    case 'regression': {
      if (!indepVar) throw new Error('Can bien doc lap');
      const xValues = extractNumericColumn(rows, indepVar);
      const yValues = extractNumericColumn(rows, depVar);
      if (xValues.length < 3 || yValues.length < 3) throw new Error('Can it nhat 3 cap quan sat');
      const result = linearRegression(xValues, yValues, alpha);
      const seSlope = result.stdError / Math.sqrt(xValues.length);
      return {
        testStatistic: { name: 'F', value: result.fStat, df: `${result.dfRegression}, ${result.dfResidual}`, pValue: result.pValue, detail: 'Model test' },
        effectSize: { name: 'R\u00B2', value: result.rSquared, interpretation: `${(result.rSquared * 100).toFixed(1)}% phuong sai duoc giai thich` },
        assumptions: [
          { name: 'Tuyen tinh', status: result.rSquared > 0.1 ? 'passed' : 'warning', detail: `R\u00B2 = ${result.rSquared.toFixed(3)}` },
          { name: 'Phan phoi chuan phan du', status: jarqueBeraTest(result.residuals.filter((r: number) => !isNaN(r))).normal ? 'passed' : 'warning', detail: `JB p = ${jarqueBeraTest(result.residuals.filter((r: number) => !isNaN(r))).pValue.toFixed(3)}` },
        ],
        interpretation: `Hoi quy: ${depVar} = ${result.intercept.toFixed(3)} + ${result.slope.toFixed(3)} * ${indepVar}. F(${result.dfRegression}, ${result.dfResidual}) = ${result.fStat.toFixed(3)}, p = ${result.pValue.toFixed(4)}. R\u00B2 = ${result.rSquared.toFixed(3)}.`,
        additionalTables: [
          { title: 'He so hoi quy', headers: ['Bien', 'B', 'SE', 'Beta', 't', 'Sig.'], rows: [['Hang so', result.intercept.toFixed(3), result.stdError.toFixed(3), '', (result.intercept / result.stdError).toFixed(3), '<0.001'], [indepVar, result.slope.toFixed(3), seSlope.toFixed(3), result.r.toFixed(3), (result.slope / seSlope).toFixed(3), result.pValue.toFixed(4)]] },
          { title: 'Bang phuong sai ANOVA', headers: ['Nguon', 'SS', 'df', 'MS', 'F', 'Sig.'], rows: [['Hoi quy', result.ssRegression.toFixed(2), result.dfRegression, result.msRegression.toFixed(2), result.fStat.toFixed(3), result.pValue.toFixed(4)], ['Phan du', result.ssResidual.toFixed(2), result.dfResidual, result.msResidual.toFixed(2), '', ''], ['Tong', result.ssTotal.toFixed(2), result.dfTotal, '', '', '']] },
        ],
      };
    }
    case 'descriptive': {
      const values = extractNumericColumn(rows, depVar);
      if (values.length < 1) throw new Error('Can it nhat 1 quan sat');
      const ds = descriptiveStats(values);
      return {
        descriptiveStats: [{ group: depVar, n: ds.n, mean: ds.mean, sd: ds.std, median: ds.median, min: ds.min, max: ds.max }],
        interpretation: `Thong ke mo ta "${depVar}" (N=${ds.n}): M=${ds.mean.toFixed(2)}, SD=${ds.std.toFixed(2)}, Median=${ds.median.toFixed(2)}, Min=${ds.min.toFixed(2)}, Max=${ds.max.toFixed(2)}, Skew=${ds.skewness.toFixed(3)}, Kurt=${ds.kurtosis.toFixed(3)}.`,
      };
    }
    case 'normality': {
      const values = extractNumericColumn(rows, depVar);
      if (values.length < 4) throw new Error('Can it nhat 4 quan sat');
      const jb = jarqueBeraTest(values, alpha);
      const ds = descriptiveStats(values);
      return {
        testStatistic: { name: 'JB', value: jb.jb, df: '2', pValue: jb.pValue, detail: `Jarque-Bera test` },
        assumptions: [
          { name: 'Mau lien tuc', status: 'passed', detail: 'Bien dinh luong lien tuc' },
          { name: 'Quan sat doc lap', status: 'passed', detail: `N = ${values.length}` },
        ],
        interpretation: `Jarque-Bera "${depVar}": JB = ${jb.jb.toFixed(3)}, p = ${jb.pValue.toFixed(4)}. ${jb.normal ? 'Du lieu co the tuan theo phan phoi chuan' : 'Du lieu khong tuan theo phan phoi chuan'} (\u03B1 = ${alpha}). Skew = ${ds.skewness.toFixed(3)}, Kurt = ${ds.kurtosis.toFixed(3)}.`,
      };
    }
    default:
      return { interpretation: 'Phan tich hoan thanh.' };
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projects] = useLocalStorage<Project[]>('statspro-projects', []);
  const [datasets, setDatasets] = useLocalStorage<Dataset[]>(`statspro-datasets-${projectId}`, []);
  const [analyses, setAnalyses] = useLocalStorage<AnalysisResult[]>(`statspro-analyses-${projectId}`, []);
  const [reports, setReports] = useLocalStorage<Report[]>(`statspro-reports-${projectId}`, []);

  const [activeTab, setActiveTab] = useState('overview');

  /* Force refresh key */
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---- Upload state ---- */
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string; rows: number; cols: number } | null>(null);
  const [previewData, setPreviewData] = useState<ParsedData | null>(null);
  const [allSheets, setAllSheets] = useState<{ sheets: ParsedData[]; sheetNames: string[]; defaultSheet: number } | null>(null);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- Preview dialog ---- */
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);

  /* ---- Analysis wizard state ---- */
  const [isAnalysisWizardOpen, setIsAnalysisWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [depVariable, setDepVariable] = useState('');
  const [groupVariables, setGroupVariables] = useState<string[]>([]);
  const [independentVariables, setIndependentVariables] = useState<string[]>([]);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [wizardResults, setWizardResults] = useState<AnalysisResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(getAIApiKey());
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);

  /* ---- Report state ---- */
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedAnalysisIdsForReport, setSelectedAnalysisIdsForReport] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState('');
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  const project = projects.find((p) => p.id === projectId);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);
  const selectedMethod = METHODS.find((m) => m.id === selectedMethodId);

  /* ---- Activities ---- */
  const activities: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    datasets.forEach((d) => {
      items.push({
        id: `import-${d.id}`,
        type: 'import',
        description: `Nhap du lieu "${d.name}" (${d.rowCount} dong, ${d.colCount} cot)`,
        timestamp: d.uploadedAt,
      });
    });
    analyses.forEach((a) => {
      items.push({
        id: `analysis-${a.id}`,
        type: 'analysis',
        description: `Chay phan tich ${a.methodNameVi} tren "${a.datasetName}"`,
        timestamp: a.createdAt,
      });
    });
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, 10);
  }, [datasets, analyses, refreshKey]);

  /* ---- File upload handlers ---- */
  const resetUpload = useCallback(() => {
    setUploadedFile(null);
    setPreviewData(null);
    setAllSheets(null);
    setSelectedSheet(0);
  }, []);

  const handleParsedDataFromFile = useCallback(
    async (file: File) => {
      try {
        const result = await parseFile(file);
        setUploadedFile(result.fileInfo);
        setPreviewData(result.data);
        if (result.allSheets) {
          setAllSheets(result.allSheets);
          setSelectedSheet(result.allSheets.defaultSheet);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Khong the doc file');
        resetUpload();
      }
    },
    [resetUpload]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ACCEPTED_EXTS.includes(ext)) {
        toast.error('Dinh dang file khong duoc ho tro');
        return;
      }
      handleParsedDataFromFile(file);
    },
    [handleParsedDataFromFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleParsedDataFromFile(file);
      e.target.value = '';
    },
    [handleParsedDataFromFile]
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      setSelectedSheet(index);
      if (allSheets) setPreviewData(allSheets.sheets[index]);
    },
    [allSheets]
  );

  const confirmImport = useCallback(() => {
    if (!previewData || previewData.rows.length === 0) {
      toast.error('Khong co du lieu hop le de nhap');
      return;
    }
    try {
      const newDataset: Dataset = {
        id: crypto.randomUUID(),
        name: uploadedFile?.name || 'Dataset moi',
        fileType: uploadedFile?.type || 'CSV',
        rowCount: previewData.rows.length,
        colCount: previewData.headers.length,
        headers: previewData.headers,
        rows: previewData.rows,
        uploadedAt: new Date().toISOString(),
      };
      setDatasets((prev) => [...prev, newDataset]);
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event('storage'));
      toast.success(`Da nhap ${previewData.rows.length} dong du lieu`);
      setIsImportOpen(false);
      resetUpload();
    } catch (err) {
      toast.error('Loi khi nhap du lieu');
      console.error('Import error:', err);
    }
  }, [previewData, uploadedFile, setDatasets, resetUpload]);

  const handleDeleteDataset = (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    toast.success('Da xoa bo du lieu');
  };

  /* ---- Inline edit helpers ---- */
  const updateProjectDatasetRows = useCallback((datasetId: string, newRows: Record<string, any>[], newHeaders?: string[]) => {
    setDatasets((prev) =>
      prev.map((d) =>
        d.id === datasetId
          ? { ...d, rows: newRows, headers: newHeaders || d.headers, rowCount: newRows.length, colCount: (newHeaders || d.headers).length }
          : d
      )
    );
    window.dispatchEvent(new Event('storage'));
  }, [setDatasets]);

  const handleCellEditProject = useCallback((dataset: Dataset, rowIndex: number, col: string, value: string) => {
    const newRows = [...dataset.rows];
    const numVal = Number(value);
    newRows[rowIndex] = { ...newRows[rowIndex], [col]: isNaN(numVal) || value.trim() === '' ? value : numVal };
    const updatedDataset = { ...dataset, rows: newRows };
    setPreviewDataset(updatedDataset);
    updateProjectDatasetRows(dataset.id, newRows);
  }, [updateProjectDatasetRows]);

  const handleAddRowProject = useCallback((dataset: Dataset) => {
    const newRow: Record<string, any> = {};
    dataset.headers.forEach((h) => { newRow[h] = ''; });
    const newRows = [...dataset.rows, newRow];
    const updatedDataset = { ...dataset, rows: newRows, rowCount: newRows.length };
    setPreviewDataset(updatedDataset);
    updateProjectDatasetRows(dataset.id, newRows);
    toast.success('Da them dong moi');
  }, [updateProjectDatasetRows]);

  const handleDeleteRowProject = useCallback((dataset: Dataset, rowIndex: number) => {
    const newRows = dataset.rows.filter((_, i) => i !== rowIndex);
    const updatedDataset = { ...dataset, rows: newRows, rowCount: newRows.length };
    setPreviewDataset(updatedDataset);
    updateProjectDatasetRows(dataset.id, newRows);
    toast.success('Da xoa dong');
  }, [updateProjectDatasetRows]);

  /* ---- Analysis wizard handlers ---- */
  const resetWizard = () => {
    setWizardStep(1);
    setSelectedDatasetId('');
    setSelectedMethodId('');
    setDepVariable('');
    setGroupVariables([]);
    setIndependentVariables([]);
    setConfidenceLevel(95);
    setWizardResults(null);
    setWizardError(null);
    setIsRunning(false);
    setAiInterpretation('');
    setAiError(null);
    setShowAI(false);
  };

  const openAnalysisWizard = () => {
    resetWizard();
    setIsAnalysisWizardOpen(true);
  };

  const toggleGroupVariable = (name: string) => {
    setGroupVariables((prev) => {
      if (prev.includes(name)) return prev.filter((v) => v !== name);
      return [...prev, name];
    });
  };

  const toggleIndependentVariable = (name: string) => {
    setIndependentVariables((prev) => {
      if (prev.includes(name)) return prev.filter((v) => v !== name);
      return [...prev, name];
    });
  };

  /* -- Drag & Drop handler -- */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const col = String(active.data.current?.col || active.id.toString().replace('var-', ''));
    const overId = over.id.toString();

    if (!col || !selectedDataset) return;

    if (overId === 'drop-y') {
      setDepVariable(col);
      setGroupVariables((prev) => prev.filter((v) => v !== col));
      setIndependentVariables((prev) => prev.filter((v) => v !== col));
    } else if (overId === 'drop-x') {
      setIndependentVariables((prev) => prev.includes(col) ? prev : [...prev, col]);
      setGroupVariables((prev) => prev.filter((v) => v !== col));
      if (depVariable === col) setDepVariable('');
    } else if (overId === 'drop-group') {
      setGroupVariables((prev) => prev.includes(col) ? prev : [...prev, col]);
      setIndependentVariables((prev) => prev.filter((v) => v !== col));
      if (depVariable === col) setDepVariable('');
    }
  }, [selectedDataset, depVariable]);

  /* -- Auto AI analysis after results -- */
  useEffect(() => {
    if (wizardResults) {
      const configs = getAIConfigItems();
      if (configs.length > 0) {
        let combined = '';
        runAutoAIWithCallbacks(
          configs,
          wizardResults.methodNameVi,
          { dataset: wizardResults.datasetName, variables: { dep: depVariable, group: groupVariables, independent: independentVariables } },
          wizardResults.results,
          (provider, text) => {
            combined += `### ${provider}\n\n${text}\n\n---\n\n`;
            setAiInterpretation(combined);
          },
          () => { /* silent fail for auto AI */ }
        );
      }
    }
  }, [wizardResults]);

  const runAnalysis = () => {
    if (!selectedDataset || !selectedMethod || !depVariable) return;

    /* Validate variables based on method */
    try {
      if ((selectedMethod.id === 'ttest' || selectedMethod.id === 'anova') && groupVariables.length === 0) {
        throw new Error(`Can chon it nhat 1 bien phan nhom cho ${selectedMethod.id === 'ttest' ? 'T-test' : 'ANOVA'}`);
      }
      if ((selectedMethod.id === 'correlation' || selectedMethod.id === 'regression') && independentVariables.length === 0) {
        throw new Error(`Can chon it nhat 1 bien doc lap cho ${selectedMethod.id === 'correlation' ? 'Tuong quan' : 'Hoi quy'}`);
      }
      if (selectedMethod.id === 'chisquare' && groupVariables.length === 0) {
        throw new Error('Can chon it nhat 1 bien phan loai thu hai cho Chi-square');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Loi xac thuc';
      setWizardError(msg);
      toast.error(msg);
      return;
    }

    setIsRunning(true);
    setWizardError(null);
    setAiInterpretation('');
    setTimeout(() => {
      try {
        const results = runRealAnalysis(selectedMethod.id, selectedDataset, depVariable, groupVariables, independentVariables, confidenceLevel);
        const analysis: AnalysisResult = {
          id: crypto.randomUUID(),
          methodId: selectedMethod.id,
          methodName: selectedMethod.nameVi,
          methodNameVi: selectedMethod.nameVi,
          datasetId: selectedDataset.id,
          datasetName: selectedDataset.name,
          dependentVariable: depVariable,
          groupingVariables: groupVariables,
          independentVariables: independentVariables,
          confidenceLevel,
          results,
          createdAt: new Date().toISOString(),
        };
        setWizardResults(analysis);
        setAnalyses((prev) => [...prev, analysis]);
        setIsRunning(false);
        setWizardStep(4);
        toast.success('Phan tich hoan tat');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Loi phan tich';
        setWizardError(msg);
        setIsRunning(false);
        toast.error(msg);
        // Stay on step 3 to let user fix
      }
    }, 500);
  };

  const handleAIAnalysis = async () => {
    if (!apiKey.trim()) { toast.error('Vui long nhap API key'); return; }
    if (!wizardResults) return;
    saveAIApiKey(apiKey);
    setIsAILoading(true);
    setAiError(null);
    try {
      const result = await analyzeWithAI({ provider: 'moonshot', apiKey, proxyUrl: '', customBaseUrl: '', model: 'kimi-latest' }, wizardResults.methodNameVi, { dataset: wizardResults.datasetName, variables: { dep: depVariable, group: groupVariables, independent: independentVariables } }, wizardResults.results);
      setAiInterpretation(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Loi ket noi';
      if (msg.includes('CORS') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setAiError('API Moonshot yeu cau backend proxy de tranh CORS. Vui long lien he admin de cau hinh server proxy.');
      } else {
        setAiError(msg);
      }
      toast.error('Khong the ket noi AI: ' + msg);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSaveAnalysis = () => {
    if (!wizardResults) return;
    setIsAnalysisWizardOpen(false);
    resetWizard();
    toast.success('Da luu ket qua phan tich');
  };

  const handleDeleteAnalysis = (id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    toast.success('Da xoa phan tich');
  };

  /* ---- Report handlers ---- */
  const handleCreateReport = () => {
    if (!reportTitle.trim()) {
      toast.error('Vui long nhap tieu de bao cao');
      return;
    }
    if (selectedAnalysisIdsForReport.length === 0) {
      toast.error('Vui long chon it nhat mot phan tich');
      return;
    }
    const selectedAnalyses = analyses.filter((a) => selectedAnalysisIdsForReport.includes(a.id));
    const sections: ReportSection[] = selectedAnalyses.map((a) => ({
      title: `${a.methodNameVi} - ${a.datasetName}`,
      body: a.results.interpretation,
    }));
    const report: Report = {
      id: crypto.randomUUID(),
      title: reportTitle.trim(),
      analysisIds: selectedAnalysisIdsForReport,
      content: sections,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [...prev, report]);
    setIsReportDialogOpen(false);
    setReportTitle('');
    setSelectedAnalysisIdsForReport([]);
    toast.success('Da tao bao cao');
  };

  const handleDeleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success('Da xoa bao cao');
  };

  /* ---- Derived ---- */
  const canRunAnalysis = useMemo(() => {
    if (!selectedDatasetId || !selectedMethodId || !depVariable) return false;
    if (selectedMethodId === 'descriptive' || selectedMethodId === 'normality') return true;
    if (selectedMethodId === 'correlation' || selectedMethodId === 'regression') return independentVariables.length > 0;
    if (selectedMethodId === 'chisquare') return groupVariables.length > 0;
    return groupVariables.length > 0;
  }, [selectedDatasetId, selectedMethodId, depVariable, groupVariables, independentVariables]);

  const numericCols = useMemo(() => {
    if (!selectedDataset) return [];
    return detectNumericColumns(selectedDataset.rows, selectedDataset.headers);
  }, [selectedDataset]);

  /* ---- Not found ---- */
  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="size-20 text-neutral-300 mb-6" />
          <h2 className="text-2xl font-bold text-neutral-700 mb-3">Khong tim thay du an</h2>
          <p className="text-neutral-500 mb-8 text-lg">Du an ban dang tim khong ton tai hoac da bi xoa.</p>
          <Button size="lg" className="h-12 px-6" onClick={() => navigate('/projects')}>
            <ArrowLeft className="size-5 mr-2" />
            Quay lai
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <span key={refreshKey} className="hidden" />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate('/projects')} className="shrink-0 size-10">
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-primary-900">{project.name}</h1>
                <Badge variant={statusBadgeVariants[project.status]} className="text-sm">{statusLabels[project.status]}</Badge>
              </div>
              <p className="text-base text-neutral-500 mt-1">{project.description || 'Khong co mo ta'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 h-auto p-2 gap-1">
            <TabsTrigger value="overview" className="text-sm px-4 py-2">
              <Database className="size-4 mr-2" />
              Tong quan
            </TabsTrigger>
            <TabsTrigger value="data" className="text-sm px-4 py-2">
              <TableIcon className="size-4 mr-2" />
              Du lieu
              {datasets.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{datasets.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-sm px-4 py-2">
              <BarChart3 className="size-4 mr-2" />
              Phan tich
              {analyses.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{analyses.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-sm px-4 py-2">
              <FileBarChart className="size-4 mr-2" />
              Bao cao
              {reports.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{reports.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ============ TAB 1: TONG QUAN ============ */}
          <TabsContent value="overview" className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <Card>
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Database className="size-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{datasets.length}</p>
                      <p className="text-sm text-muted-foreground">Bo du lieu</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center">
                      <BarChart3 className="size-7 text-green-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{analyses.length}</p>
                      <p className="text-sm text-muted-foreground">Phan tich</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center">
                      <FileBarChart className="size-7 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{reports.length}</p>
                      <p className="text-sm text-muted-foreground">Bao cao</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Thao tac nhanh</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 flex-wrap">
                  <Button size="lg" className="h-12 px-6" onClick={() => { resetUpload(); setActiveTab('data'); }}>
                    <Upload className="size-5 mr-2" />
                    Nhap du lieu
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-6" onClick={() => setActiveTab('analysis')}>
                    <BarChart3 className="size-5 mr-2" />
                    Phan tich
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-6" onClick={() => setActiveTab('reports')}>
                    <FileBarChart className="size-5 mr-2" />
                    Tao bao cao
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <Activity className="size-5" />
                    Hoat dong gan day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">Chua co hoat dong nao</p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((act) => (
                        <div key={act.id} className="flex items-start gap-4 text-base">
                          {act.type === 'import' ? (
                            <Upload className="size-5 text-blue-500 mt-0.5 shrink-0" />
                          ) : act.type === 'analysis' ? (
                            <BarChart3 className="size-5 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <FileBarChart className="size-5 text-purple-500 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-neutral-800 font-medium">{act.description}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Clock className="size-4" />
                              {new Date(act.timestamp).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ============ TAB 2: DU LIEU ============ */}
          <TabsContent value="data" className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Bo du lieu</h2>
                  <p className="text-base text-muted-foreground">{datasets.length} bo du lieu trong du an nay</p>
                </div>
                <Button size="lg" className="h-12 px-6" onClick={() => { resetUpload(); setIsImportOpen(true); }}>
                  <Upload className="size-5 mr-2" />
                  Nhap du lieu
                </Button>
              </div>

              {datasets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-card shadow-sm">
                  <Database className="size-16 text-neutral-300 mb-5" />
                  <p className="text-neutral-500 text-xl font-medium mb-2">Chua co du lieu</p>
                  <p className="text-neutral-400 text-base max-w-sm mb-6">Nhap du lieu tu file CSV, Excel, JSON, TSV de bat dau phan tich</p>
                  <Button size="lg" className="h-12 px-6" onClick={() => { resetUpload(); setIsImportOpen(true); }}>
                    <Upload className="size-5 mr-2" />
                    Nhap du lieu
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {datasets.map((ds) => (
                    <motion.div
                      key={ds.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                    >
                      <Card className="group hover:border-primary/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              {getFileIcon(ds.fileType)}
                              <div>
                                <h3 className="font-semibold text-base">{ds.name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="outline" className="text-xs">{ds.fileType}</Badge>
                                  <span className="text-sm text-muted-foreground">{ds.rowCount} dong</span>
                                  <span className="text-sm text-muted-foreground">{ds.colCount} cot</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  {new Date(ds.uploadedAt).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon-sm" className="size-9" onClick={() => setPreviewDataset(ds)}>
                                <Eye className="size-5 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="size-9 text-destructive hover:text-destructive" onClick={() => handleDeleteDataset(ds.id)}>
                                <Trash2 className="size-5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ============ TAB 3: PHAN TICH ============ */}
          <TabsContent value="analysis" className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Phan tich thong ke</h2>
                  <p className="text-base text-muted-foreground">{analyses.length} phan tich da thuc hien</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="lg" className="h-12 px-4" onClick={() => navigate(`/analysis/builder?project=${projectId}`)} disabled={datasets.length === 0}>
                    <ExternalLink className="size-5 mr-2" />
                    Trinh phan tich nang cao
                  </Button>
                  <Button size="lg" className="h-12 px-6" onClick={openAnalysisWizard} disabled={datasets.length === 0}>
                    <Plus className="size-5 mr-2" />
                    Phan tich moi
                  </Button>
                </div>
              </div>

              {datasets.length === 0 && (
                <div className="rounded-lg border border-dashed p-5 mb-6 bg-muted/30">
                  <p className="text-base text-muted-foreground">Vui long nhap du lieu truoc khi phan tich.</p>
                </div>
              )}

              {analyses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-card shadow-sm">
                  <BarChart3 className="size-16 text-neutral-300 mb-5" />
                  <p className="text-neutral-500 text-xl font-medium mb-2">Chua co phan tich nao</p>
                  <p className="text-neutral-400 text-base max-w-sm mb-6">Chay phan tich thong ke tren du lieu cua du an</p>
                  <Button size="lg" className="h-12 px-6" onClick={openAnalysisWizard} disabled={datasets.length === 0}>
                    <Plus className="size-5 mr-2" />
                    Phan tich moi
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <motion.div key={analysis.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <BarChart3 className="size-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-base">{analysis.methodNameVi}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Dataset: {analysis.datasetName} &middot; Bien: {analysis.dependentVariable}
                                  {analysis.groupingVariables.length > 0 ? ` / ${analysis.groupingVariables.join(', ')}` : ''}
                                  {analysis.independentVariables.length > 0 ? ` / ${analysis.independentVariables.join(', ')}` : ''}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(analysis.createdAt).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon-sm" className="size-9" onClick={() => { setWizardResults(analysis); setIsAnalysisWizardOpen(true); }}>
                                <Eye className="size-5 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="size-9 text-destructive hover:text-destructive" onClick={() => handleDeleteAnalysis(analysis.id)}>
                                <Trash2 className="size-5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ============ TAB 4: BAO CAO ============ */}
          <TabsContent value="reports" className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Bao cao</h2>
                  <p className="text-base text-muted-foreground">{reports.length} bao cao</p>
                </div>
                <Button size="lg" className="h-12 px-6" onClick={() => setIsReportDialogOpen(true)} disabled={analyses.length === 0}>
                  <Plus className="size-5 mr-2" />
                  Tao bao cao
                </Button>
              </div>

              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-card shadow-sm">
                  <FileBarChart className="size-16 text-neutral-300 mb-5" />
                  <p className="text-neutral-500 text-xl font-medium mb-2">Chua co bao cao nao</p>
                  <p className="text-neutral-400 text-base max-w-sm mb-6">Tao bao cao tu cac ket qua phan tich</p>
                  <Button size="lg" className="h-12 px-6" onClick={() => setIsReportDialogOpen(true)} disabled={analyses.length === 0}>
                    <Plus className="size-5 mr-2" />
                    Tao bao cao
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <motion.div key={report.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setViewingReport(report)}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                <FileBarChart className="size-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-base">{report.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {report.analysisIds.length} phan tich &middot; {report.content.length} phan
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(report.createdAt).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-9 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                            >
                              <Trash2 className="size-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ============ IMPORT DIALOG ============ */}
      <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if (!open) resetUpload(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">Nhap du lieu</DialogTitle>
            <DialogDescription className="text-sm">Ho tro CSV, Excel (.xlsx, .xls), JSON, TSV, TXT. Keo tha file hoac bam de chon.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-6 py-4">
              {/* Drag & Drop Zone */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-neutral-300 hover:border-neutral-400'}`}
                >
                  <motion.div animate={{ scale: isDragging ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <Upload className="size-14 text-neutral-400 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-base font-semibold mb-1">Keo tha file vao day hoac bam de chon file</p>
                  <p className="text-sm text-muted-foreground mt-2">Toi da 10MB</p>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <FormatBadge icon={<FileSpreadsheet className="size-4" />} label=".xlsx" color="text-green-600 bg-green-50" />
                    <FormatBadge icon={<ArrowUpDown className="size-4" />} label=".csv" color="text-blue-600 bg-blue-50" />
                    <FormatBadge icon={<FileJson className="size-4" />} label=".json" color="text-orange-600 bg-orange-50" />
                    <FormatBadge icon={<FileText className="size-4" />} label=".tsv" color="text-gray-600 bg-gray-50" />
                  </div>
                  <input ref={fileInputRef} type="file" accept={ACCEPT_STRING} onChange={handleFileSelect} className="hidden" />
                </div>
              </motion.div>

              {/* File Info Card */}
              <AnimatePresence>
                {uploadedFile && previewData && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getFileIcon(uploadedFile.type)}
                            <CardTitle className="text-lg">{uploadedFile.name}</CardTitle>
                          </div>
                          <Button variant="ghost" size="icon-sm" className="size-9" onClick={(e) => { e.stopPropagation(); resetUpload(); }}>
                            <X className="size-5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline" className="text-sm px-3 py-1">{uploadedFile.type}</Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1">{uploadedFile.size}</Badge>
                          <Badge variant="secondary" className="text-sm px-3 py-1">{uploadedFile.rows} dong</Badge>
                          <Badge variant="secondary" className="text-sm px-3 py-1">{uploadedFile.cols} cot</Badge>
                        </div>
                        {allSheets && allSheets.sheetNames.length > 1 && (
                          <div className="flex items-center gap-3">
                            <Label className="text-sm whitespace-nowrap font-medium">Sheet:</Label>
                            <Select value={String(selectedSheet)} onValueChange={(v) => handleSheetChange(Number(v))}>
                              <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {allSheets.sheetNames.map((name, idx) => (
                                  <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <TableIcon className="size-5 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Xem truoc {Math.min(previewData.rows.length, 20)} / {previewData.rows.length} dong</span>
                          </div>
                          <div className="rounded-md border overflow-hidden">
                            <ScrollArea className="h-[280px]">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {previewData.headers.map((h) => (
                                      <TableHead key={h} className="text-sm whitespace-nowrap py-3 px-4">{h}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {previewData.rows.slice(0, 20).map((row, idx) => (
                                    <TableRow key={idx}>
                                      {previewData.headers.map((h) => (
                                        <TableCell key={h} className="text-sm py-2 px-4">
                                          {typeof row[h] === 'number' ? Number(row[h]).toLocaleString('vi-VN') : String(row[h] ?? '')}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" size="lg" className="flex-1 h-12" onClick={resetUpload}>
                            <X className="size-5 mr-2" />Huy
                          </Button>
                          <Button size="lg" className="flex-1 h-12" onClick={confirmImport}>
                            <Check className="size-5 mr-2" />Nhap du lieu
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ============ DATASET PREVIEW DIALOG with Inline Edit ============ */}
      <Dialog open={!!previewDataset} onOpenChange={() => setPreviewDataset(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg">Chinh sua du lieu: {previewDataset?.name}</DialogTitle>
                <DialogDescription className="text-sm">{previewDataset?.rowCount} dong &middot; {previewDataset?.colCount} cot &middot; Nhan vao o de chinh sua</DialogDescription>
              </div>
              <Button size="lg" className="h-12 px-4 gap-2" onClick={() => previewDataset && handleAddRowProject(previewDataset)}>
                <Plus className="size-5" />
                Them dong
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {previewDataset && (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm whitespace-nowrap py-3 px-2 w-12">#</TableHead>
                      {previewDataset.headers.map((h) => (
                        <TableHead key={h} className="text-sm whitespace-nowrap py-3 px-4">{h}</TableHead>
                      ))}
                      <TableHead className="text-sm whitespace-nowrap py-3 px-2 w-16">Xoa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewDataset.rows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm py-2 px-2 text-neutral-400 text-center">{idx + 1}</TableCell>
                        {previewDataset.headers.map((h) => (
                          <TableCell key={h} className="text-sm py-1 px-2">
                            <EditableCellPD
                              value={row[h]}
                              onChange={(val) => handleCellEditProject(previewDataset, idx, h, val)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-sm py-2 px-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRowProject(previewDataset, idx)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ============ ANALYSIS WIZARD DIALOG ============ */}
      <Dialog
        open={isAnalysisWizardOpen}
        onOpenChange={(open) => {
          setIsAnalysisWizardOpen(open);
          if (!open) resetWizard();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {wizardStep <= 3 ? `Phan tich moi - Buoc ${wizardStep}/3` : 'Ket qua phan tich'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {wizardStep === 1 && 'Chon bo du lieu de phan tich'}
              {wizardStep === 2 && 'Chon phuong phap phan tich'}
              {wizardStep === 3 && 'Chon bien phan tich'}
              {wizardStep === 4 && 'Ket qua phan tich chi tiet'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2">
            <div className="py-5">
              {/* Step 1: Select Dataset */}
              {wizardStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <Label className="text-base font-semibold">Chon bo du lieu</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {datasets.map((ds) => (
                      <Card
                        key={ds.id}
                        className={`cursor-pointer transition-colors ${selectedDatasetId === ds.id ? 'border-primary bg-primary/5' : 'hover:border-neutral-400'}`}
                        onClick={() => setSelectedDatasetId(ds.id)}
                      >
                        <CardContent className="p-5 flex items-center gap-4">
                          <Database className="size-6 text-primary" />
                          <div className="flex-1">
                            <p className="font-semibold text-base">{ds.name}</p>
                            <p className="text-sm text-muted-foreground">{ds.rowCount} dong &middot; {ds.colCount} cot &middot; {ds.headers.join(', ').slice(0, 60)}...</p>
                          </div>
                          {selectedDatasetId === ds.id && <Check className="size-6 text-primary" />}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Select Method */}
              {wizardStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <Label className="text-base font-semibold">Chon phuong phap</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {METHODS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <Card
                          key={m.id}
                          className={`cursor-pointer transition-colors ${selectedMethodId === m.id ? 'border-primary bg-primary/5' : 'hover:border-neutral-400'}`}
                          onClick={() => setSelectedMethodId(m.id)}
                        >
                          <CardContent className="p-5 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: m.bgColor }}>
                              <Icon className="size-6" style={{ color: m.color }} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-base">{m.nameVi}</p>
                              <p className="text-sm text-muted-foreground">{m.description}</p>
                            </div>
                            {selectedMethodId === m.id && <Check className="size-6 text-primary shrink-0" />}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Select Variables with Drag & Drop */}
              {wizardStep === 3 && selectedDataset && selectedMethod && (
                <DndContext onDragEnd={handleDragEnd}>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  {/* Error */}
                  {wizardError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{wizardError}</p>
                    </div>
                  )}

                  {/* Confidence Level */}
                  <div>
                    <Label className="mb-3 block text-base font-semibold">Muc tin cay</Label>
                    <div className="flex gap-3">
                      {[90, 95, 99].map((level) => (
                        <Button key={level} variant={confidenceLevel === level ? 'default' : 'outline'} size="lg" className="h-12 px-6" onClick={() => setConfidenceLevel(level)}>
                          {level}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Drop Zones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Drop Zone Y - Dependent Variable */}
                    <div className="space-y-2">
                      <Label className="block text-base font-semibold">
                        {selectedMethod.id === 'chisquare' ? 'Bien phan loai 1' : selectedMethod.id === 'correlation' ? 'Bien X' : selectedMethod.id === 'regression' ? 'Bien phu thuoc Y' : 'Bien phan tich'}
                      </Label>
                      <DroppableArea
                        id="drop-y"
                        label="Keo bien vao day"
                        color="#1B5F99"
                        bgColor="#F4FAFF"
                        className="border-[#1B5F99]/30"
                      >
                        {depVariable ? (
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-[#1B5F99] text-white text-sm px-3 py-1">{depVariable}</Badge>
                            <span className="text-sm text-muted-foreground">{numericCols.includes(depVariable) ? 'So' : 'Chuoi'}</span>
                            <button onClick={() => setDepVariable('')} className="ml-auto text-neutral-400 hover:text-destructive"><X className="size-5" /></button>
                          </div>
                        ) : null}
                      </DroppableArea>
                    </div>

                    {/* Drop Zone X/Group */}
                    <div className="space-y-2">
                      <Label className="block text-base font-semibold">
                        {(selectedMethod.id === 'correlation' || selectedMethod.id === 'regression')
                          ? (selectedMethod.id === 'correlation' ? 'Bien Y' : 'Bien doc lap X')
                          : (selectedMethod.id === 'chisquare' ? 'Bien phan loai 2' : 'Bien phan nhom')}
                        <span className="text-sm font-normal text-muted-foreground ml-2">(co the chon nhieu)</span>
                      </Label>
                      <DroppableArea
                        id={(selectedMethod.id === 'correlation' || selectedMethod.id === 'regression') ? 'drop-x' : 'drop-group'}
                        label="Keo bien vao day"
                        color={(selectedMethod.id === 'correlation' || selectedMethod.id === 'regression') ? '#8B5CF6' : '#2A9D8F'}
                        bgColor={(selectedMethod.id === 'correlation' || selectedMethod.id === 'regression') ? '#F5F3FF' : '#E6F7F5'}
                        className={(selectedMethod.id === 'correlation' || selectedMethod.id === 'regression') ? 'border-[#8B5CF6]/30' : 'border-[#2A9D8F]/30'}
                      >
                        {(selectedMethod.id === 'correlation' || selectedMethod.id === 'regression')
                          ? (independentVariables.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {independentVariables.map((v) => (
                                  <Badge key={v} variant="secondary" className="bg-[#8B5CF6] text-white text-sm px-3 py-1.5 flex items-center gap-2">
                                    {v}
                                    <button onClick={() => toggleIndependentVariable(v)} className="text-white/70 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                                  </Badge>
                                ))}
                              </div>
                            ) : null)
                          : (groupVariables.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {groupVariables.map((v) => (
                                  <Badge key={v} variant="secondary" className="bg-[#2A9D8F] text-white text-sm px-3 py-1.5 flex items-center gap-2">
                                    {v}
                                    <button onClick={() => toggleGroupVariable(v)} className="text-white/70 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                                  </Badge>
                                ))}
                              </div>
                            ) : null)
                        }
                      </DroppableArea>
                    </div>
                  </div>

                  {/* Draggable Column Pool */}
                  <div className="pt-4 border-t border-neutral-100">
                    <Label className="mb-4 block text-base font-semibold">Danh sach cot - keo tha bien</Label>
                    <div className="flex flex-wrap gap-3">
                      {selectedDataset.headers.map((col) => {
                        const isDep = depVariable === col;
                        const isGroup = groupVariables.includes(col);
                        const isIndep = independentVariables.includes(col);
                        const isUsed = isDep || isGroup || isIndep;
                        const isNumeric = numericCols.includes(col);

                        const canBeDep = !isUsed || isDep;
                        const canBeGroup = (selectedMethod.id === 'ttest' || selectedMethod.id === 'anova' || selectedMethod.id === 'chisquare') && depVariable !== '' && col !== depVariable && !isIndep;
                        const canBeIndep = (selectedMethod.id === 'correlation' || selectedMethod.id === 'regression') && depVariable !== '' && col !== depVariable && isNumeric && !isGroup;
                        const canSelect = canBeDep || canBeGroup || canBeIndep;

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
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-primary-400" />So</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-orange-400" />Chuoi</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-[#1B5F99]" />Bien phu thuoc</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-[#2A9D8F]" />Bien phan nhom</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-[#8B5CF6]" />Bien doc lap</span>
                    </div>
                  </div>
                </motion.div>
                </DndContext>
              )}

              {/* Step 4: Results */}
              {wizardStep === 4 && wizardResults && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  {/* Results Summary */}
                  <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
                    <h4 className="text-base font-bold text-primary mb-2">{wizardResults.methodNameVi}</h4>
                    <p className="text-sm text-muted-foreground">
                      Dataset: {wizardResults.datasetName} &middot; Muc tin cay: {wizardResults.confidenceLevel}%
                    </p>
                  </div>

                  {/* Descriptive Stats */}
                  {wizardResults.results.descriptiveStats && wizardResults.results.descriptiveStats.length > 0 && (
                    <div>
                      <h4 className="text-base font-bold mb-3">Thong ke mo ta</h4>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-sm py-3 px-4">Nhom/Bien</TableHead>
                              <TableHead className="text-sm text-right py-3 px-4">N</TableHead>
                              <TableHead className="text-sm text-right py-3 px-4">Trung binh</TableHead>
                              <TableHead className="text-sm text-right py-3 px-4">Do lech chuan</TableHead>
                              {wizardResults.results.descriptiveStats[0].median !== undefined && <TableHead className="text-sm text-right py-3 px-4">Trung vi</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {wizardResults.results.descriptiveStats.map((s, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm font-medium py-3 px-4">{s.group}</TableCell>
                                <TableCell className="text-sm text-right font-mono py-3 px-4">{s.n}</TableCell>
                                <TableCell className="text-sm text-right font-mono py-3 px-4">{s.mean.toFixed(2)}</TableCell>
                                <TableCell className="text-sm text-right font-mono py-3 px-4">{s.sd.toFixed(2)}</TableCell>
                                {s.median !== undefined && <TableCell className="text-sm text-right font-mono py-3 px-4">{s.median.toFixed(2)}</TableCell>}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Test Statistic */}
                  {wizardResults.results.testStatistic && (
                    <div>
                      <h4 className="text-base font-bold mb-3">Ket qua kiem dinh</h4>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-sm py-3 px-4">Chi so</TableHead>
                              <TableHead className="text-sm text-right py-3 px-4">Gia tri</TableHead>
                              <TableHead className="text-sm text-right py-3 px-4">p-value</TableHead>
                              {wizardResults.results.testStatistic.ciLower !== undefined && <TableHead className="text-sm text-right py-3 px-4">KTC {wizardResults.confidenceLevel}%</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="text-sm font-medium py-3 px-4">
                                {wizardResults.results.testStatistic.name}
                                {wizardResults.results.testStatistic.df && ` (${wizardResults.results.testStatistic.df})`}
                              </TableCell>
                              <TableCell className="text-sm text-right font-mono py-3 px-4">{wizardResults.results.testStatistic.value.toFixed(3)}</TableCell>
                              <TableCell className="text-sm text-right font-mono py-3 px-4">
                                <span className={wizardResults.results.testStatistic.pValue < 0.05 ? 'text-primary font-bold' : 'text-green-600'}>
                                  {wizardResults.results.testStatistic.pValue.toFixed(3)}
                                </span>
                              </TableCell>
                              {wizardResults.results.testStatistic.ciLower !== undefined && (
                                <TableCell className="text-sm text-right font-mono py-3 px-4">
                                  [{wizardResults.results.testStatistic.ciLower.toFixed(2)}, {wizardResults.results.testStatistic.ciUpper?.toFixed(2)}]
                                </TableCell>
                              )}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      {wizardResults.results.testStatistic.detail && (
                        <p className="text-sm text-muted-foreground mt-2">{wizardResults.results.testStatistic.detail}</p>
                      )}
                    </div>
                  )}

                  {/* Effect Size */}
                  {wizardResults.results.effectSize && (
                    <div>
                      <h4 className="text-base font-bold mb-3">Co hieu ung</h4>
                      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                        <Badge className="bg-primary text-white text-sm px-4 py-1.5">{wizardResults.results.effectSize.name} = {wizardResults.results.effectSize.value.toFixed(2)}</Badge>
                        <span className="text-base text-muted-foreground">{wizardResults.results.effectSize.interpretation}</span>
                      </div>
                    </div>
                  )}

                  {/* Additional Tables */}
                  {wizardResults.results.additionalTables?.map((tbl, idx) => (
                    <div key={idx}>
                      <h4 className="text-base font-bold mb-3">{tbl.title}</h4>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              {tbl.headers.map((h, i) => (
                                <TableHead key={i} className="text-sm py-3 px-4">{h}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tbl.rows.map((row, ri) => (
                              <TableRow key={ri}>
                                {row.map((cell, ci) => (
                                  <TableCell key={ci} className="text-sm font-mono py-3 px-4">
                                    {typeof cell === 'number' ? cell.toFixed(3) : cell}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}

                  {/* Assumptions */}
                  {wizardResults.results.assumptions && wizardResults.results.assumptions.length > 0 && (
                    <div>
                      <h4 className="text-base font-bold mb-3">Kiem tra gia dinh</h4>
                      <div className="space-y-3">
                        {wizardResults.results.assumptions.map((check, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border">
                            <Check className={`size-6 flex-shrink-0 ${check.status === 'passed' ? 'text-green-500' : check.status === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
                            <div>
                              <div className="text-base font-semibold">{check.name}</div>
                              <div className="text-sm text-muted-foreground">{check.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interpretation */}
                  <div className="p-6 bg-primary/5 border-l-4 border-primary rounded-r-xl">
                    <h4 className="text-base font-bold text-primary mb-3">Dien giai ket qua</h4>
                    <p className="text-base text-neutral-700 leading-relaxed">{wizardResults.results.interpretation}</p>
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <button onClick={() => setShowAI(!showAI)} className="w-full flex items-center justify-between px-6 py-5 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Brain className="w-6 h-6 text-purple-500" />
                        <span className="text-base font-bold text-neutral-800">Phan tich bang AI (Kimi)</span>
                      </div>
                      {showAI ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                    </button>
                    <AnimatePresence>
                      {showAI && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="px-6 pb-6 space-y-5 border-t border-neutral-100 pt-5">
                            <div className="flex gap-3">
                              <Input type="password" placeholder="Nhap Moonshot AI API key..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="flex-1 text-base h-12" />
                              <Button onClick={handleAIAnalysis} disabled={isAILoading || !apiKey.trim()} className="bg-purple-600 hover:bg-purple-700 gap-2 h-12 px-6" size="lg">
                                {isAILoading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <Sparkles className="w-5 h-5" />}
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
                                <h5 className="text-base font-bold text-purple-700 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5" />Dien giai tu AI</h5>
                                <div className="text-base text-neutral-700 leading-relaxed whitespace-pre-wrap">{aiInterpretation}</div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Wizard Footer */}
          <DialogFooter className="flex items-center justify-between py-4">
            <div className="flex gap-3">
              {wizardStep > 1 && wizardStep <= 3 && (
                <Button variant="outline" size="lg" className="h-12" onClick={() => setWizardStep((s) => s - 1)}>
                  <ChevronLeft className="size-5 mr-2" />Quay lai
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {wizardStep < 3 && (
                <Button size="lg" className="h-12 px-6" onClick={() => setWizardStep((s) => s + 1)} disabled={wizardStep === 1 ? !selectedDatasetId : !selectedMethodId}>
                  Tiep theo<ChevronRight className="size-5 ml-2" />
                </Button>
              )}
              {wizardStep === 3 && (
                <Button size="lg" className="h-12 px-6" onClick={runAnalysis} disabled={!canRunAnalysis || isRunning}>
                  {isRunning ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2" /> : <Play className="size-5 mr-2" />}
                  {isRunning ? 'Dang phan tich...' : 'Chay phan tich'}
                </Button>
              )}
              {wizardStep === 4 && wizardResults && (
                <Button size="lg" className="h-12 px-6" onClick={handleSaveAnalysis}>
                  <Save className="size-5 mr-2" />Hoan tat
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ CREATE REPORT DIALOG ============ */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Tao bao cao</DialogTitle>
            <DialogDescription className="text-sm">Chon cac phan tich de dua vao bao cao</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label htmlFor="report-title" className="text-base font-semibold">Tieu de bao cao</Label>
              <Input
                id="report-title"
                placeholder="Bao cao phan tich..."
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base font-semibold">Chon phan tich</Label>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${selectedAnalysisIdsForReport.includes(analysis.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                    onClick={() => {
                      setSelectedAnalysisIdsForReport((prev) =>
                        prev.includes(analysis.id) ? prev.filter((id) => id !== analysis.id) : [...prev, analysis.id]
                      );
                    }}
                  >
                    <div className={`w-6 h-6 rounded border flex items-center justify-center ${selectedAnalysisIdsForReport.includes(analysis.id) ? 'bg-primary border-primary' : 'border-neutral-300'}`}>
                      {selectedAnalysisIdsForReport.includes(analysis.id) && <Check className="size-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold">{analysis.methodNameVi}</p>
                      <p className="text-sm text-muted-foreground">{analysis.datasetName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" size="lg" className="h-12" onClick={() => setIsReportDialogOpen(false)}>Huy</Button>
            <Button size="lg" className="h-12 px-6" onClick={handleCreateReport}>Tao bao cao</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ VIEW REPORT DIALOG ============ */}
      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">{viewingReport?.title}</DialogTitle>
            <DialogDescription className="text-sm">
              {viewingReport?.analysisIds.length} phan tich &middot; {new Date(viewingReport?.createdAt || '').toLocaleString('vi-VN')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-8 py-4">
              {viewingReport?.content.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-base font-bold text-primary mb-3">{section.title}</h3>
                  <p className="text-base text-neutral-700 leading-relaxed">{section.body}</p>
                  {idx < viewingReport.content.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FormatBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium ${color}`}>
      {icon}{label}
    </span>
  );
}

function getFileIcon(type: string) {
  const t = type.toLowerCase();
  if (t === 'xlsx' || t === 'xls') return <FileSpreadsheet className="size-6 text-green-600" />;
  if (t === 'json') return <FileJson className="size-6 text-orange-600" />;
  if (t === 'csv') return <ArrowUpDown className="size-6 text-blue-600" />;
  return <FileText className="size-6 text-gray-600" />;
}

/* ------------------------------------------------------------------ */
/*  EditableCell Component                                             */
/* ------------------------------------------------------------------ */

function EditableCellPD({ value, onChange }: { value: any; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));

  if (editing) {
    return (
      <input
        className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => { onChange(editValue); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onChange(editValue); setEditing(false); } }}
        autoFocus
      />
    );
  }
  return (
    <span
      onClick={() => { setEditing(true); setEditValue(String(value ?? '')); }}
      className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded block min-h-[28px] flex items-center"
    >
      {typeof value === 'number' ? Number(value).toLocaleString('vi-VN') : String(value ?? '')}
    </span>
  );
}
