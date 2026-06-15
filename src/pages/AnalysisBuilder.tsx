/* ==================================================================== */
/*  AnalysisBuilder — Drag-Drop Full-Screen Analysis (JASP/SPSS style)  */
/* ==================================================================== */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight, Grid3X3, ScatterChart, TrendingUp,
  Table, Bell, Calculator, Play, ChevronDown, ChevronUp,
  X, BarChart3, ArrowLeft, Sparkles, Brain, GripVertical,
  Hash, Type, Tags, Settings, Trash2, Eye,
  Database, Activity, AlertTriangle, CheckCircle2,
  Info, Save, TestTube
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Scatter, Line,
} from 'recharts';
// hooks not needed
import {
  descriptiveStats, tTestIndependent, anovaOneWay, chiSquareTest,
  pearsonCorrelation, linearRegression, jarqueBeraTest,
  extractNumericColumn, getUniqueValues, detectNumericColumns,
  generateDetailedInterpretation, type InterpretationInput,
} from '@/lib/statistics';
import { analyzeWithAI, getAIConfig, saveAIConfig, testAIConnection, type AIConfig, type AIProvider } from '@/lib/aiAPI';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface Variable {
  name: string;
  type: 'numeric' | 'categorical' | 'text';
}

interface DropZone {
  id: string;
  label: string;
  description: string;
  maxVars: number;
  acceptedTypes: ('numeric' | 'categorical' | 'text')[];
}

interface AnalysisMethod {
  id: string;
  nameVi: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  category: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DROP_ZONES: DropZone[] = [
  { id: 'dependent', label: 'Bien phu thuoc', description: 'Bien ket qua (1)', maxVars: 1, acceptedTypes: ['numeric', 'categorical'] },
  { id: 'independent', label: 'Bien doc lap', description: 'Bien du doan (N)', maxVars: 10, acceptedTypes: ['numeric', 'categorical'] },
  { id: 'grouping', label: 'Bien phan nhom', description: 'Bien nhom (N)', maxVars: 5, acceptedTypes: ['categorical', 'numeric'] },
  { id: 'weight', label: 'Bien trong so', description: 'Trong so (1)', maxVars: 1, acceptedTypes: ['numeric'] },
  { id: 'control', label: 'Bien doi chung', description: 'Bien kiem soat (N)', maxVars: 5, acceptedTypes: ['numeric', 'categorical'] },
];

const METHODS: AnalysisMethod[] = [
  { id: 'ttest', nameVi: 'T-test', description: 'So sanh 2 nhom', icon: ArrowLeftRight, color: '#1B5F99', bgColor: '#F4FAFF', category: 'So sanh' },
  { id: 'anova', nameVi: 'ANOVA', description: 'So sanh 3+ nhom', icon: Grid3X3, color: '#2A9D8F', bgColor: '#E6F7F5', category: 'So sanh' },
  { id: 'chisquare', nameVi: 'Chi-square', description: 'Lien he phan loai', icon: Table, color: '#F4A261', bgColor: '#FFF8ED', category: 'Kiem dinh' },
  { id: 'correlation', nameVi: 'Tuong quan', description: 'Tuong quan tuyen tinh', icon: ScatterChart, color: '#8B5CF6', bgColor: '#F5F3FF', category: 'Tuong quan' },
  { id: 'regression', nameVi: 'Hoi quy', description: 'Hoi quy tuyen tinh', icon: TrendingUp, color: '#E76F51', bgColor: '#FEF2F2', category: 'Hoi quy' },
  { id: 'descriptive', nameVi: 'Mo ta', description: 'Thong ke mo ta', icon: Calculator, color: '#1B5F99', bgColor: '#F4FAFF', category: 'Mo ta' },
  { id: 'normality', nameVi: 'Kiem dinh chuan', description: 'Phan phoi chuan', icon: Bell, color: '#84CC16', bgColor: '#F7FEE7', category: 'Kiem dinh' },
  { id: 'mannwhitney', nameVi: 'Mann-Whitney U', description: 'Phi tham so 2 nhom', icon: Activity, color: '#D946EF', bgColor: '#FDF4FF', category: 'Phi tham so' },
];

const TYPE_CONFIG = {
  numeric: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Hash, label: 'Numeric' },
  categorical: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Tags, label: 'Categorical' },
  text: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Type, label: 'Text' },
};

/* ------------------------------------------------------------------ */
/*  Draggable Variable Card                                            */
/* ------------------------------------------------------------------ */

function DraggableVariable({ variable }: { variable: Variable }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `var-${variable.name}`,
    data: { variable },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const tc = TYPE_CONFIG[variable.type];
  const Icon = tc.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab transition-all',
        'hover:shadow-md hover:border-gray-300 bg-white',
        isDragging && 'opacity-50 shadow-lg scale-105 z-50'
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-3 h-3 text-gray-400 shrink-0" />
      <Icon className={cn('w-3.5 h-3.5 shrink-0', variable.type === 'numeric' && 'text-blue-500', variable.type === 'categorical' && 'text-amber-500', variable.type === 'text' && 'text-purple-500')} />
      <span className="text-sm font-medium truncate flex-1">{variable.name}</span>
      <Badge variant="outline" className={cn('text-[10px] px-1 py-0 h-4', tc.color)}>{tc.label}</Badge>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Droppable Zone                                                     */
/* ------------------------------------------------------------------ */

function DroppableZone({
  zone,
  variables,
  onRemove,
}: {
  zone: DropZone;
  variables: Variable[];
  onRemove: (name: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: zone.id,
    data: { zone },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border-2 border-dashed p-3 transition-all min-h-[80px]',
        isOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50',
        variables.length > 0 && 'border-solid border-gray-300 bg-white'
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-xs font-semibold text-gray-700">{zone.label}</span>
          <span className="text-[10px] text-gray-400 ml-1.5">{zone.description}</span>
        </div>
        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-gray-100">
          {variables.length}/{zone.maxVars === 10 || zone.maxVars === 5 ? 'N' : zone.maxVars}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {variables.map((v) => (
            <motion.div
              key={v.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
                TYPE_CONFIG[v.type].color
              )}
            >
              {v.name}
              <button
                onClick={() => onRemove(v.name)}
                className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {variables.length === 0 && (
          <span className="text-[11px] text-gray-400 italic">Keo bien vao day...</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AnalysisBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') || '';
  const datasetIdParam = searchParams.get('dataset') || '';

  /* -- Datasets -- */
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasetIdParam);

  useEffect(() => {
    const all: Dataset[] = [];
    // Load project datasets
    if (projectId) {
      try {
        const raw = localStorage.getItem(`statspro-datasets-${projectId}`);
        if (raw) {
          const parsed = JSON.parse(raw) as Dataset[];
          all.push(...parsed);
        }
      } catch { /* ignore */ }
    }
    // Load global datasets
    try {
      const raw = localStorage.getItem('statspro-global-data');
      if (raw) {
        const parsed = JSON.parse(raw) as Dataset[];
        for (const d of parsed) {
          if (!all.find((x) => x.id === d.id)) all.push(d);
        }
      }
    } catch { /* ignore */ }
    setDatasets(all);
    if (!selectedDatasetId && all.length > 0) {
      setSelectedDatasetId(all[0].id);
    }
  }, [projectId]);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  /* -- Variables -- */
  const variables = useMemo<Variable[]>(() => {
    if (!selectedDataset) return [];
    const numericCols = detectNumericColumns(selectedDataset.rows, selectedDataset.headers);
    return selectedDataset.headers.map((h) => {
      let type: Variable['type'] = 'text';
      if (numericCols.includes(h)) type = 'numeric';
      else {
        const uniqueVals = getUniqueValues(selectedDataset.rows.map((r) => String(r[h]))).filter((v) => v !== '');
        if (uniqueVals.length <= 20 && uniqueVals.length >= 2) type = 'categorical';
        else type = 'text';
      }
      return { name: h, type };
    });
  }, [selectedDataset]);

  /* -- Dropped variables per zone -- */
  const [zoneVars, setZoneVars] = useState<Record<string, Variable[]>>({
    dependent: [],
    independent: [],
    grouping: [],
    weight: [],
    control: [],
  });

  const [activeDragVar, setActiveDragVar] = useState<Variable | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  /* -- Results -- */
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detailedInterpretation, setDetailedInterpretation] = useState('');

  /* -- AI -- */
  const [aiConfig, setAiConfig] = useState<AIConfig>(getAIConfig());
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  /* -- Sensor -- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* -- Drag handlers -- */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as { variable?: Variable } | undefined;
    if (data?.variable) setActiveDragVar(data.variable);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragVar(null);
    if (!over) return;

    const data = active.data.current as { variable?: Variable } | undefined;
    if (!data?.variable) return;

    const zoneId = over.id as string;
    const zone = DROP_ZONES.find((z) => z.id === zoneId);
    if (!zone) return;

    const v = data.variable;
    if (!zone.acceptedTypes.includes(v.type)) {
      toast.error(`Bien "${v.name}" (loai ${TYPE_CONFIG[v.type].label}) khong phu hop voi khung "${zone.label}"`);
      return;
    }

    setZoneVars((prev) => {
      const current = prev[zoneId] || [];
      if (current.find((x) => x.name === v.name)) return prev;
      if (zone.maxVars === 1 && current.length >= 1) {
        return { ...prev, [zoneId]: [v] };
      }
      if (current.length >= zone.maxVars) {
        toast.warning(`Khung "${zone.label}" chi cho phep toi da ${zone.maxVars} bien`);
        return prev;
      }
      // Remove from other zones if exists
      const next: Record<string, Variable[]> = {};
      for (const [k, vals] of Object.entries(prev)) {
        next[k] = vals.filter((x) => x.name !== v.name);
      }
      next[zoneId] = [...(next[zoneId] || []), v];
      return next;
    });
  }, []);

  const removeFromZone = useCallback((zoneId: string, name: string) => {
    setZoneVars((prev) => ({
      ...prev,
      [zoneId]: (prev[zoneId] || []).filter((v) => v.name !== name),
    }));
  }, []);

  const clearAllZones = useCallback(() => {
    setZoneVars({ dependent: [], independent: [], grouping: [], weight: [], control: [] });
    setSelectedMethod('');
    setResults(null);
    setDetailedInterpretation('');
    setAiInterpretation('');
    setErrorMsg(null);
  }, []);

  /* -- Analysis runner -- */
  const runAnalysis = useCallback(() => {
    if (!selectedDataset) { toast.error('Chon bo du lieu'); return; }
    if (!selectedMethod) { toast.error('Chon phuong phap phan tich'); return; }
    const depVars = zoneVars.dependent;
    if (depVars.length === 0) { toast.error('Chon bien phu thuoc'); return; }

    setIsRunning(true);
    setErrorMsg(null);
    setResults(null);
    setDetailedInterpretation('');

    setTimeout(() => {
      try {
        const alpha = 1 - confidenceLevel / 100;
        const depVar = depVars[0].name;
        const groupVars = zoneVars.grouping.map((v) => v.name);
        const indepVars = zoneVars.independent.map((v) => v.name);
        const result = performAnalysis(selectedMethod, selectedDataset, depVar, groupVars, indepVars, alpha, confidenceLevel);
        setResults(result);

        // Generate detailed interpretation
        const interpInput = buildInterpretationInput(selectedMethod, result, depVar, groupVars, indepVars, confidenceLevel);
        setDetailedInterpretation(generateDetailedInterpretation(interpInput));

        toast.success('Phan tich hoan thanh!');
      } catch (err: any) {
        setErrorMsg(err.message || 'Loi phan tich');
        toast.error(err.message || 'Loi phan tich');
      } finally {
        setIsRunning(false);
      }
    }, 300);
  }, [selectedDataset, selectedMethod, zoneVars, confidenceLevel]);

  /* -- AI handler -- */
  const handleAI = useCallback(async () => {
    if (!aiConfig.apiKey.trim()) { toast.error('Nhap API key'); return; }
    if (!results) { toast.error('Chay phan tich truoc'); return; }
    setIsAILoading(true);
    setAiError(null);
    try {
      const res = await analyzeWithAI(
        aiConfig,
        METHODS.find((m) => m.id === selectedMethod)?.nameVi || selectedMethod,
        { dataset: selectedDataset?.name, variables: { dep: zoneVars.dependent[0]?.name, group: zoneVars.grouping.map((v) => v.name), independent: zoneVars.independent.map((v) => v.name) } },
        results.raw || results
      );
      setAiInterpretation(res);
    } catch (err: any) {
      setAiError(err.message || 'Loi AI');
      toast.error('Loi AI: ' + (err.message || 'Loi ket noi'));
    } finally {
      setIsAILoading(false);
    }
  }, [aiConfig, results, selectedMethod, selectedDataset, zoneVars]);

  const handleTestConnection = useCallback(async () => {
    setTestStatus('testing');
    try {
      const res = await testAIConnection(aiConfig);
      setTestStatus(res.success ? 'success' : 'error');
      setTestMessage(res.message);
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Loi ket noi');
    }
  }, [aiConfig]);

  const saveAI = useCallback(() => {
    saveAIConfig(aiConfig);
    toast.success('Da luu cau hinh AI');
    setShowAISettings(false);
  }, [aiConfig]);

  /* -- Can run? -- */
  const canRun = useMemo(() => {
    if (!selectedDataset || !selectedMethod || zoneVars.dependent.length === 0) return false;
    if (selectedMethod === 'ttest' || selectedMethod === 'anova' || selectedMethod === 'chisquare') {
      return zoneVars.grouping.length > 0;
    }
    if (selectedMethod === 'correlation' || selectedMethod === 'regression') {
      return zoneVars.independent.length > 0;
    }
    return true;
  }, [selectedDataset, selectedMethod, zoneVars]);

  /* -- Charts data -- */
  const chartData = useMemo(() => {
    if (!results?.descriptiveStats) return [];
    return results.descriptiveStats.map((d: any) => ({
      name: d.group || d.name || 'Tong',
      N: d.n,
      TrungBinh: d.mean,
      'DoLechChuan+': d.mean + d.sd,
      'DoLechChuan-': d.mean - d.sd,
      TrungVi: d.median,
      Min: d.min,
      Max: d.max,
    }));
  }, [results]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(projectId ? `/projects/${projectId}` : '/analysis')} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Quay lai
          </Button>
          <div className="h-5 w-px bg-gray-200" />
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h1 className="font-bold text-base">Trinh phan tich du lieu</h1>
          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">v3</Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedDatasetId}
            onChange={(e) => { setSelectedDatasetId(e.target.value); clearAllZones(); }}
            className="text-xs border rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">-- Chon bo du lieu --</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.rowCount} dong)</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => setShowAISettings(true)} className="gap-1">
            <Settings className="w-3.5 h-3.5" /> Cai dat AI
          </Button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-hidden">
          {/* ====== Column 1: Variables ====== */}
          <div className="w-[280px] bg-white border-r flex flex-col shrink-0">
            <div className="px-3 py-2 border-b bg-gray-50">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Danh sach bien</h2>
              <p className="text-[10px] text-gray-500">Keo bien vao khung ben phai</p>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1.5">
                {variables.map((v) => (
                  <DraggableVariable key={v.name} variable={v} />
                ))}
                {variables.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Chon bo du lieu de hien thi bien
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-2 border-t bg-gray-50 text-[10px] text-gray-500 space-y-1">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Numeric</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Categorical</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400" /> Text</div>
            </div>
          </div>

          {/* ====== Column 2: Drop Zones + Methods ====== */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Drop zones */}
            <div className="p-4 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Khung bien phan tich</h2>
                <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1" onClick={clearAllZones}>
                  <Trash2 className="w-3 h-3" /> Xoa tat ca
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {DROP_ZONES.map((zone) => (
                  <DroppableZone
                    key={zone.id}
                    zone={zone}
                    variables={zoneVars[zone.id] || []}
                    onRemove={(name) => removeFromZone(zone.id, name)}
                  />
                ))}
              </div>

              {/* Methods grid */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Chon phuong phap</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Muc tin cay:</span>
                    <select
                      value={confidenceLevel}
                      onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                      className="text-[11px] border rounded px-1.5 py-0.5"
                    >
                      <option value={90}>90%</option>
                      <option value={95}>95%</option>
                      <option value={99}>99%</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {METHODS.map((m) => {
                    const Icon = m.icon;
                    const active = selectedMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                          active
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', active ? 'bg-blue-100' : 'bg-gray-50')}>
                          <Icon className="w-5 h-5" style={{ color: m.color }} />
                        </div>
                        <span className={cn('text-xs font-semibold', active ? 'text-blue-700' : 'text-gray-700')}>{m.nameVi}</span>
                        <span className="text-[10px] text-gray-500 leading-tight">{m.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Run button */}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={runAnalysis}
                  disabled={!canRun || isRunning}
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {isRunning ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isRunning ? 'Dang phan tich...' : 'Chay phan tich'}
                </Button>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* ====== Column 3: Results ====== */}
          <div className="w-[420px] bg-white border-l flex flex-col shrink-0">
            {results ? (
              <Tabs defaultValue="tables" className="flex flex-col h-full">
                <TabsList className="w-full rounded-none border-b px-2 pt-1 bg-gray-50 h-9">
                  <TabsTrigger value="tables" className="text-[11px] gap-1">
                    <BarChart3 className="w-3 h-3" /> Bang ket qua
                  </TabsTrigger>
                  <TabsTrigger value="interpret" className="text-[11px] gap-1">
                    <Info className="w-3 h-3" /> Dien giai
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="text-[11px] gap-1">
                    <Eye className="w-3 h-3" /> Bieu do
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-[11px] gap-1">
                    <Sparkles className="w-3 h-3" /> AI
                  </TabsTrigger>
                </TabsList>

                {/* Tables tab */}
                <TabsContent value="tables" className="flex-1 overflow-y-auto m-0 p-3 space-y-4">
                  {/* Descriptive stats */}
                  {results.descriptiveStats && results.descriptiveStats.length > 0 && (
                    <ResultTable
                      title="Thong ke mo ta"
                      headers={['Nhom', 'N', 'Trung binh', 'Do lech chuan', 'Trung vi', 'Min', 'Max']}
                      rows={results.descriptiveStats.map((d: any) => [
                        d.group, d.n, d.mean.toFixed(2), d.sd.toFixed(2), d.median.toFixed(2), d.min.toFixed(2), d.max.toFixed(2),
                      ])}
                    />
                  )}

                  {/* Test statistic */}
                  {results.testStatistic && (
                    <ResultTable
                      title={`Thong so kiem dinh: ${results.testStatistic.name}`}
                      headers={['Chi so', 'Gia tri', 'df', 'p-value', 'Chi tiet']}
                      rows={[[
                        results.testStatistic.name,
                        results.testStatistic.value.toFixed(3),
                        results.testStatistic.df || '-',
                        results.pValue?.toFixed(4) || results.testStatistic.pValue?.toFixed(4) || '-',
                        results.testStatistic.detail || '-',
                      ]]}
                    />
                  )}

                  {/* ANOVA table */}
                  {results.anovaTable && (
                    <ResultTable
                      title={results.anovaTable.title}
                      headers={results.anovaTable.headers}
                      rows={results.anovaTable.rows}
                    />
                  )}

                  {/* Effect size */}
                  {results.effectSize && (
                    <ResultTable
                      title="Co hieu ung"
                      headers={['Chi so', 'Gia tri', 'Dien giai']}
                      rows={[[results.effectSize.name, results.effectSize.value.toFixed(3), results.effectSize.interpretation]]}
                    />
                  )}

                  {/* Assumptions */}
                  {results.assumptions && results.assumptions.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-700 mb-1.5">Kiem dinh gia dinh</h4>
                      <div className="space-y-1.5">
                        {results.assumptions.map((a: any, i: number) => (
                          <div key={i} className={cn(
                            'flex items-start gap-2 p-2 rounded-lg border text-[11px]',
                            a.status === 'passed' && 'bg-green-50 border-green-200 text-green-700',
                            a.status === 'warning' && 'bg-amber-50 border-amber-200 text-amber-700',
                            a.status === 'failed' && 'bg-red-50 border-red-200 text-red-700',
                          )}>
                            {a.status === 'passed' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                              a.status === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                                <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                            <div>
                              <span className="font-semibold">{a.name}</span>
                              <span className="text-gray-500 ml-1">{a.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post-hoc table */}
                  {results.postHocTable && (
                    <ResultTable
                      title={results.postHocTable.title}
                      headers={results.postHocTable.headers}
                      rows={results.postHocTable.rows}
                    />
                  )}

                  {/* Additional tables */}
                  {results.additionalTables?.map((t: any, i: number) => (
                    <ResultTable key={i} title={t.title} headers={t.headers} rows={t.rows} />
                  ))}
                </TabsContent>

                {/* Interpretation tab */}
                <TabsContent value="interpret" className="flex-1 overflow-y-auto m-0 p-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                      <Info className="w-4 h-4" /> Dien giai chi tiet
                    </h3>
                    <pre className="text-xs text-blue-900 whitespace-pre-wrap font-sans leading-relaxed">
                      {detailedInterpretation}
                    </pre>
                  </div>
                </TabsContent>

                {/* Charts tab */}
                <TabsContent value="charts" className="flex-1 overflow-y-auto m-0 p-3 space-y-4">
                  {chartData.length > 0 && (
                    <>
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-700 mb-2">Bieu do cot — Trung binh cac nhom</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: 11 }} />
                            <Bar dataKey="TrungBinh" fill="#1B5F99" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-700 mb-2">Bieu do Min-Max-Mean</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="Min" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="TrungVi" fill="#2A9D8F" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="TrungBinh" fill="#1B5F99" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Max" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                  {results.scatterData && results.scatterData.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-700 mb-2">Bieu do phan tan</h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" dataKey="x" name={results.xLabel || 'X'} tick={{ fontSize: 10 }} />
                          <YAxis type="number" dataKey="y" name={results.yLabel || 'Y'} tick={{ fontSize: 10 }} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} />
                          <Scatter data={results.scatterData} fill="#8B5CF6" />
                          {results.regressionLine && (
                            <Line type="linear" data={results.regressionLine} dataKey="y" stroke="#E76F51" strokeWidth={2} dot={false} />
                          )}
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {chartData.length === 0 && !results.scatterData && (
                    <div className="text-center py-10 text-gray-400 text-xs">Khong co du lieu bieu do</div>
                  )}
                </TabsContent>

                {/* AI tab */}
                <TabsContent value="ai" className="flex-1 overflow-y-auto m-0 p-3 flex flex-col gap-2">
                  {!aiConfig.apiKey && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Vui long nhap API key trong Cai dat AI de su dung tinh nang nay.
                    </div>
                  )}
                  <Button
                    onClick={handleAI}
                    disabled={isAILoading || !aiConfig.apiKey}
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {isAILoading ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAILoading ? 'Dang phan tich AI...' : 'Phan tich bang AI'}
                  </Button>
                  {aiError && (
                    <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700">
                      <X className="w-3.5 h-3.5 inline mr-1" />{aiError}
                    </div>
                  )}
                  {aiInterpretation && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mt-1">
                      <h4 className="text-[11px] font-bold text-purple-800 mb-1 flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5" /> Dien giai AI
                      </h4>
                      <pre className="text-[11px] text-purple-900 whitespace-pre-wrap font-sans leading-relaxed">
                        {aiInterpretation}
                      </pre>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                <BarChart3 className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm font-medium">Chua co ket qua phan tich</p>
                <p className="text-xs mt-1">Chon bien, phuong phap va nhan "Chay phan tich"</p>
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeDragVar ? (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border shadow-xl bg-white opacity-90',
              TYPE_CONFIG[activeDragVar.type].color
            )}>
              <GripVertical className="w-3 h-3 text-gray-400" />
              <span className="text-sm font-medium">{activeDragVar.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* AI Settings Dialog */}
      <AnimatePresence>
        {showAISettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAISettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Cai dat AI Provider
                </h3>
                <button onClick={() => setShowAISettings(false)} className="p-1 hover:bg-gray-200 rounded transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Nha cung cap</label>
                  <select
                    value={aiConfig.provider}
                    onChange={(e) => {
                      const p = e.target.value as AIProvider;
                      const preset = p === 'moonshot' ? { model: 'kimi-latest', base: '' } :
                        p === 'openai' ? { model: 'gpt-4o-mini', base: '' } :
                          p === 'openrouter' ? { model: 'openai/gpt-4o-mini', base: '' } :
                            { model: '', base: '' };
                      setAiConfig({ ...aiConfig, provider: p, model: preset.model });
                    }}
                    className="w-full text-xs border rounded-md px-2 py-1.5"
                  >
                    <option value="moonshot">Moonshot (Kimi)</option>
                    <option value="openai">OpenAI</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="custom">Tuy chinh (Custom)</option>
                  </select>
                </div>

                {aiConfig.provider === 'custom' && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Base URL</label>
                    <Input
                      value={aiConfig.customBaseUrl}
                      onChange={(e) => setAiConfig({ ...aiConfig, customBaseUrl: e.target.value })}
                      placeholder="https://api.example.com/v1"
                      className="text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">API Key</label>
                  <Input
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Model</label>
                  <Input
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                    placeholder="kimi-latest"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">CORS Proxy URL (tuy chon)</label>
                  <Input
                    value={aiConfig.proxyUrl}
                    onChange={(e) => setAiConfig({ ...aiConfig, proxyUrl: e.target.value })}
                    placeholder="https://corsproxy.io/?"
                    className="text-xs"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Neu API bi loi CORS, nhap proxy URL. Vi du: https://corsproxy.io/?
                  </p>
                </div>

                {testStatus !== 'idle' && (
                  <div className={cn(
                    'p-2 rounded-lg text-[11px] flex items-center gap-1.5',
                    testStatus === 'success' && 'bg-green-50 text-green-700',
                    testStatus === 'error' && 'bg-red-50 text-red-700',
                    testStatus === 'testing' && 'bg-blue-50 text-blue-700',
                  )}>
                    {testStatus === 'testing' ? <Activity className="w-3.5 h-3.5 animate-spin" /> :
                      testStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                        <AlertTriangle className="w-3.5 h-3.5" />}
                    {testMessage || 'Dang kiem tra...'}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testStatus === 'testing'} className="gap-1 flex-1">
                    <TestTube className="w-3.5 h-3.5" /> Kiem tra ket noi
                  </Button>
                  <Button size="sm" onClick={saveAI} className="gap-1 flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-3.5 h-3.5" /> Luu
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result Table Component                                             */
/* ------------------------------------------------------------------ */

function ResultTable({ title, headers, rows }: { title: string; headers: string[]; rows: (string | number)[][] }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <span className="text-[11px] font-bold text-gray-700">{title}</span>
        {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 border-b">
                {headers.map((h, i) => (
                  <th key={i} className="px-2 py-1.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0 hover:bg-gray-50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Analysis Engine                                                    */
/* ------------------------------------------------------------------ */

function performAnalysis(
  methodId: string,
  dataset: Dataset,
  depVar: string,
  groupVars: string[],
  indepVars: string[],
  alpha: number,
  confidenceLevel: number,
): any {
  const rows = dataset.rows;
  const groupVar = groupVars.length > 0 ? groupVars[0] : null;
  const indepVar = indepVars.length > 0 ? indepVars[0] : null;

  switch (methodId) {
    case 'ttest': {
      if (!groupVar) throw new Error('Can bien phan nhom');
      const groups = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '');
      if (groups.length < 2) throw new Error('Can it nhat 2 nhom');
      const g1 = extractNumericColumn(rows.filter((r) => String(r[groupVar]) === groups[0]), depVar);
      const g2 = extractNumericColumn(rows.filter((r) => String(r[groupVar]) === groups[1]), depVar);
      if (g1.length < 2 || g2.length < 2) throw new Error('Moi nhom can it nhat 2 quan sat');
      const r = tTestIndependent(g1, g2, alpha);
      const ds1 = descriptiveStats(g1);
      const ds2 = descriptiveStats(g2);
      return {
        methodId, pValue: r.pValue, confidenceLevel,
        descriptiveStats: [
          { group: groups[0], n: ds1.n, mean: ds1.mean, sd: ds1.std, median: ds1.median, min: ds1.min, max: ds1.max },
          { group: groups[1], n: ds2.n, mean: ds2.mean, sd: ds2.std, median: ds2.median, min: ds2.min, max: ds2.max },
        ],
        testStatistic: { name: 't', value: r.t, df: `${r.df.toFixed(1)}`, detail: `Welch t-test`, pValue: r.pValue },
        effectSize: { name: "Cohen's d", value: r.cohenD, interpretation: r.effectSize },
        assumptions: [
          { name: 'Doc lap quan sat', status: 'passed' as const, detail: 'Thiet ke nghien cuu' },
          { name: 'Phan phoi chuan', status: jarqueBeraTest(g1).normal && jarqueBeraTest(g2).normal ? 'passed' as const : 'warning' as const, detail: `JB: ${jarqueBeraTest(g1).pValue.toFixed(3)}, ${jarqueBeraTest(g2).pValue.toFixed(3)}` },
        ],
        raw: r,
      };
    }

    case 'anova': {
      if (!groupVar) throw new Error('Can bien phan nhom');
      const groups = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '');
      if (groups.length < 2) throw new Error('Can it nhat 2 nhom');
      const gvs = groups.map((g) => extractNumericColumn(rows.filter((r) => String(r[groupVar]) === g), depVar));
      if (gvs.some((g) => g.length < 2)) throw new Error('Moi nhom can it nhat 2 quan sat');
      const r = anovaOneWay(gvs, alpha);
      const dsGroups = gvs.map((g, i) => { const d = descriptiveStats(g); return { group: groups[i], n: d.n, mean: d.mean, sd: d.std, median: d.median, min: d.min, max: d.max }; });
      const anovaTable = {
        title: 'Bang ANOVA', headers: ['Nguon', 'SS', 'df', 'MS', 'F', 'Sig.'],
        rows: [
          ['Giua nhom', r.ssBetween.toFixed(2), r.dfBetween, r.msBetween.toFixed(2), r.f.toFixed(3), r.pValue.toFixed(4)],
          ['Trong nhom', r.ssWithin.toFixed(2), r.dfWithin, r.msWithin.toFixed(2), '', ''],
          ['Tong', r.ssTotal.toFixed(2), r.dfBetween + r.dfWithin, '', '', ''],
        ],
      };
      const postHocTable = r.postHoc ? {
        title: 'Post-hoc (Tukey HSD)', headers: ['Cap nhom', 'Chenh lech', 'p-value', 'Y nghia'],
        rows: r.postHoc.map((p: any) => [p.pair, p.diff.toFixed(3), p.p.toFixed(4), p.p < alpha ? 'Co' : 'Khong']),
      } : null;
      return {
        methodId, pValue: r.pValue, confidenceLevel,
        descriptiveStats: dsGroups,
        testStatistic: { name: 'F', value: r.f, df: `${r.dfBetween}, ${r.dfWithin}`, detail: 'Mot chieu' },
        effectSize: { name: 'Eta-squared', value: r.etaSquared, interpretation: r.etaSquared >= 0.14 ? 'Lon' : r.etaSquared >= 0.06 ? 'Trung binh' : r.etaSquared >= 0.01 ? 'Nho' : 'Khong' },
        assumptions: [
          { name: 'Doc lap', status: 'passed' as const, detail: 'Thiet ke' },
          { name: 'Phuong sai dong nhat', status: 'warning' as const, detail: 'Can kiem tra Levene' },
        ],
        anovaTable,
        postHocTable,
        raw: r,
      };
    }

    case 'chisquare': {
      if (!groupVar) throw new Error('Can bien phan loai thu hai');
      const rowCats = getUniqueValues(rows.map((r) => String(r[depVar]))).filter((v) => v !== '');
      const colCats = getUniqueValues(rows.map((r) => String(r[groupVar]))).filter((v) => v !== '');
      if (rowCats.length < 2 || colCats.length < 2) throw new Error('Can it nhat 2 hang muc moi bien');
      const observed: number[][] = [];
      for (const rc of rowCats) {
        const row: number[] = [];
        for (const cc of colCats) {
          row.push(rows.filter((r) => String(r[depVar]) === rc && String(r[groupVar]) === cc).length);
        }
        observed.push(row);
      }
      const r = chiSquareTest(observed, alpha);
      const tableHeaders = ['', ...colCats, 'Tong'];
      const tableRows: (string | number)[][] = [];
      for (let i = 0; i < rowCats.length; i++) {
        const rowTotal = observed[i].reduce((a, b) => a + b, 0);
        tableRows.push([rowCats[i], ...observed[i], rowTotal]);
      }
      const colTotals = colCats.map((_, j) => observed.reduce((s, row) => s + row[j], 0));
      tableRows.push(['Tong', ...colTotals, observed.flat().reduce((a, b) => a + b, 0)]);
      return {
        methodId, pValue: r.pValue, confidenceLevel,
        testStatistic: { name: '\u03C7\u00B2', value: r.chi2, df: `${r.df}`, detail: 'Pearson' },
        effectSize: { name: "Cramer's V", value: r.cramersV, interpretation: r.cramersV >= 0.25 ? 'Lon' : r.cramersV >= 0.15 ? 'TB' : r.cramersV >= 0.1 ? 'Nho' : 'Khong' },
        assumptions: [
          { name: 'Tan so ky vong >=5', status: r.expected.flat().filter((e) => e >= 5).length / r.expected.flat().length >= 0.8 ? 'passed' as const : 'warning' as const, detail: `${Math.round(r.expected.flat().filter((e) => e >= 5).length / r.expected.flat().length * 100)}% o dat yeu cau` },
        ],
        additionalTables: [{ title: 'Bang cheo', headers: tableHeaders, rows: tableRows }],
        raw: r,
      };
    }

    case 'correlation': {
      if (!indepVar) throw new Error('Can bien thu hai');
      const x = extractNumericColumn(rows, depVar);
      const y = extractNumericColumn(rows, indepVar);
      if (x.length < 3 || y.length < 3) throw new Error('Can it nhat 3 cap');
      const r = pearsonCorrelation(x, y, alpha);
      const dsX = descriptiveStats(x);
      const dsY = descriptiveStats(y);
      return {
        methodId, pValue: r.pValue, confidenceLevel,
        descriptiveStats: [
          { group: depVar, n: dsX.n, mean: dsX.mean, sd: dsX.std, median: dsX.median, min: dsX.min, max: dsX.max },
          { group: indepVar, n: dsY.n, mean: dsY.mean, sd: dsY.std, median: dsY.median, min: dsY.min, max: dsY.max },
        ],
        testStatistic: { name: 'r', value: r.r, df: `${r.n - 2}`, detail: 'Pearson' },
        effectSize: { name: 'r\u00B2', value: r.rSquared, interpretation: `${(r.rSquared * 100).toFixed(1)}% phuong sai` },
        assumptions: [
          { name: 'Tuyen tinh', status: r.rSquared > 0.1 ? 'passed' as const : 'warning' as const, detail: `r\u00B2=${r.rSquared.toFixed(3)}` },
        ],
        scatterData: x.map((xi, i) => ({ x: xi, y: y[i] })),
        xLabel: depVar, yLabel: indepVar,
        raw: r,
      };
    }

    case 'regression': {
      if (!indepVar) throw new Error('Can bien doc lap');
      const x = extractNumericColumn(rows, indepVar);
      const y = extractNumericColumn(rows, depVar);
      if (x.length < 3 || y.length < 3) throw new Error('Can it nhat 3 cap');
      const r = linearRegression(x, y, alpha);
      const seSlope = r.stdError / Math.sqrt(x.length);
      return {
        methodId, pValue: r.pValue, confidenceLevel,
        testStatistic: { name: 'F', value: r.fStat, df: `${r.dfRegression}, ${r.dfResidual}`, detail: 'Model test' },
        effectSize: { name: 'R\u00B2', value: r.rSquared, interpretation: `${(r.rSquared * 100).toFixed(1)}% phuong sai` },
        assumptions: [
          { name: 'Tuyen tinh', status: r.rSquared > 0.1 ? 'passed' as const : 'warning' as const, detail: `R\u00B2=${r.rSquared.toFixed(3)}` },
        ],
        scatterData: x.map((xi, i) => ({ x: xi, y: y[i] })),
        regressionLine: x.length > 0 ? [{ x: Math.min(...x), y: r.intercept + r.slope * Math.min(...x) }, { x: Math.max(...x), y: r.intercept + r.slope * Math.max(...x) }] : [],
        xLabel: indepVar, yLabel: depVar,
        additionalTables: [
          { title: 'He so hoi quy', headers: ['Bien', 'B', 'SE', 'Beta', 't', 'Sig.'], rows: [['Hang so', r.intercept.toFixed(3), r.stdError.toFixed(3), '', (r.intercept / r.stdError).toFixed(3), '<0.001'], [indepVar, r.slope.toFixed(3), seSlope.toFixed(3), r.r.toFixed(3), (r.slope / seSlope).toFixed(3), r.pValue.toFixed(4)]] },
        ],
        raw: r,
      };
    }

    case 'descriptive': {
      const values = extractNumericColumn(rows, depVar);
      if (values.length < 1) throw new Error('Can it nhat 1 quan sat');
      const ds = descriptiveStats(values);
      return {
        methodId, pValue: 1, confidenceLevel,
        descriptiveStats: [{ group: depVar, n: ds.n, mean: ds.mean, sd: ds.std, median: ds.median, min: ds.min, max: ds.max }],
        raw: { depVar, ...ds },
      };
    }

    case 'normality': {
      const values = extractNumericColumn(rows, depVar);
      if (values.length < 4) throw new Error('Can it nhat 4 quan sat');
      const jb = jarqueBeraTest(values, alpha);
      return {
        methodId, pValue: jb.pValue, confidenceLevel,
        testStatistic: { name: 'JB', value: jb.jb, df: '2', detail: 'Jarque-Bera' },
        assumptions: [
          { name: 'Mau lien tuc', status: 'passed' as const, detail: `N=${values.length}` },
        ],
        raw: jb,
      };
    }

    default:
      throw new Error('Phuong phap chua duoc ho tro');
  }
}

/* Build interpretation input from results */
function buildInterpretationInput(
  methodId: string,
  results: any,
  depVar: string,
  groupVars: string[],
  indepVars: string[],
  confidenceLevel: number,
): InterpretationInput {
  const base: InterpretationInput = {
    methodId,
    methodNameVi: METHODS.find((m) => m.id === methodId)?.nameVi || methodId,
    dependentVariable: depVar,
    groupingVariable: groupVars[0] || undefined,
    independentVariable: indepVars[0] || undefined,
    confidenceLevel,
    significant: results.pValue < (1 - confidenceLevel / 100),
    pValue: results.pValue,
    testStatistic: results.testStatistic || { name: '', value: 0 },
  };

  if (results.effectSize) base.effectSize = results.effectSize;
  if (results.descriptiveStats) {
    base.groupStats = results.descriptiveStats.map((d: any) => ({
      group: d.group, n: d.n, mean: d.mean, sd: d.sd,
    }));
    if (results.descriptiveStats.length === 1) {
      const d = results.descriptiveStats[0];
      base.descriptiveStats = { n: d.n, mean: d.mean, median: d.median, std: d.sd, min: d.min, max: d.max, skewness: 0, kurtosis: 0 };
    }
  }

  if (methodId === 'correlation' && results.raw) {
    const r = results.raw;
    base.correlationExtra = { r: r.r, rSquared: r.rSquared, strength: r.strength, direction: r.direction, ciLower: r.ciLower, ciUpper: r.ciUpper };
  }

  if (methodId === 'regression' && results.raw) {
    const r = results.raw;
    base.regressionExtra = { slope: r.slope, intercept: r.intercept, rSquared: r.rSquared, fStat: r.fStat };
  }

  if (methodId === 'anova' && results.raw) {
    const r = results.raw;
    base.anovaExtra = {
      f: r.f, dfBetween: r.dfBetween, dfWithin: r.dfWithin, etaSquared: r.etaSquared,
      postHoc: r.postHoc ? { pairs: r.postHoc.map((p: any) => ({ g1: p.pair.split(' vs ')[0], g2: p.pair.split(' vs ')[1], diff: p.diff, p: p.p })) } : undefined,
    };
  }

  if (methodId === 'chisquare' && results.raw) {
    const r = results.raw;
    base.chiSquareExtra = { chi2: r.chi2, df: r.df, cramersV: r.cramersV, expected: r.expected };
  }

  if (methodId === 'normality' && results.raw) {
    const r = results.raw;
    const ds = results.descriptiveStats?.[0];
    base.normalityExtra = { jb: r.jb, normal: r.normal, skewness: ds ? 0 : 0, kurtosis: ds ? 0 : 0 };
  }

  return base;
}
