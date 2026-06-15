import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { parseFile, type ParsedData } from '@/lib/fileParsers';
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  FileText,
  Trash2,
  Database,
  X,
  Check,
  Table as TableIcon,
  ArrowUpDown,
  FolderOpen,
  Eye,
  Plus,
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
  projectId?: string;
  projectName?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACCEPTED_EXTS = ['csv', 'xlsx', 'xls', 'json', 'tsv', 'txt'];
const ACCEPT_STRING = '.csv,.xlsx,.xls,.json,.tsv,.txt';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Data() {
  const [projects] = useLocalStorage<Project[]>('statspro-projects', []);
  const [globalDatasets, setGlobalDatasets] = useLocalStorage<Dataset[]>('statspro-global-data', []);

  /* -- Force refresh key for project datasets -- */
  const [refreshKey, setRefreshKey] = useState(0);

  /* -- tabs -- */
  const [activeTab, setActiveTab] = useState('all');

  /* -- import dialog -- */
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<'global' | string>('global');

  /* -- drag & drop state -- */
  const [isDragging, setIsDragging] = useState(false);

  /* -- uploaded file state -- */
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string; rows: number; cols: number } | null>(null);
  const [previewData, setPreviewData] = useState<ParsedData | null>(null);
  const [allSheets, setAllSheets] = useState<{
    sheets: ParsedData[];
    sheetNames: string[];
    defaultSheet: number;
  } | null>(null);
  const [selectedSheet, setSelectedSheet] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* -- preview dialog -- */
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);

  /* -- inline edit state (managed via previewDataset) -- */

  /* -- Collect all datasets from all projects -- */
  const allProjectDatasets: Dataset[] = [];
  projects.forEach((project) => {
    const key = `statspro-datasets-${project.id}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: Dataset[] = JSON.parse(raw);
        parsed.forEach((ds) => {
          allProjectDatasets.push({
            ...ds,
            projectId: project.id,
            projectName: project.name,
          });
        });
      }
    } catch { /* ignore */ }
  });

  const allDatasets = [...globalDatasets.map((ds) => ({ ...ds, projectId: undefined, projectName: 'Du lieu chung' })), ...allProjectDatasets];

  /* -- Group by project -- */
  const datasetsByProject = new Map<string, Dataset[]>();
  datasetsByProject.set('Du lieu chung', globalDatasets.map((ds) => ({ ...ds, projectId: undefined, projectName: 'Du lieu chung' })));
  projects.forEach((project) => {
    const projectDatasets = allProjectDatasets.filter((ds) => ds.projectId === project.id);
    if (projectDatasets.length > 0) {
      datasetsByProject.set(project.name, projectDatasets);
    }
  });

  /* ---------------------------------------------------------------- */
  /*  Actions                                                          */
  /* ---------------------------------------------------------------- */

  const resetUpload = useCallback(() => {
    setUploadedFile(null);
    setPreviewData(null);
    setAllSheets(null);
    setSelectedSheet(0);
  }, []);

  const openImport = (target: 'global' | string = 'global') => {
    setImportTarget(target);
    resetUpload();
    setIsImportOpen(true);
  };

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

      if (importTarget === 'global') {
        setGlobalDatasets((prev) => [...prev, newDataset]);
        window.dispatchEvent(new Event('storage'));
        toast.success(`Da nhap ${previewData.rows.length} dong vao Du lieu chung`);
      } else {
        const key = `statspro-datasets-${importTarget}`;
        try {
          const raw = localStorage.getItem(key);
          const existing: Dataset[] = raw ? JSON.parse(raw) : [];
          existing.push(newDataset);
          localStorage.setItem(key, JSON.stringify(existing));
          /* Force re-render so project datasets are re-read */
          setRefreshKey((k) => k + 1);
          window.dispatchEvent(new Event('storage'));
          toast.success(`Da nhap ${previewData.rows.length} dong vao du an`);
        } catch (err) {
          toast.error('Khong the luu du lieu vao du an');
          console.error('Save error:', err);
          return;
        }
      }

      setIsImportOpen(false);
      resetUpload();
    } catch (err) {
      toast.error('Loi khi nhap du lieu');
      console.error('Import error:', err);
    }
  }, [previewData, uploadedFile, importTarget, setGlobalDatasets, resetUpload]);

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

  const handleSheetChange = useCallback(
    (index: number) => {
      setSelectedSheet(index);
      if (allSheets) {
        setPreviewData(allSheets.sheets[index]);
      }
    },
    [allSheets]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ACCEPTED_EXTS.includes(ext)) {
        toast.error('Dinh dang file khong duoc ho tro. Vui long chon CSV, Excel, JSON, TSV hoac TXT');
        return;
      }
      handleParsedDataFromFile(file);
    },
    [handleParsedDataFromFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleParsedDataFromFile(file);
      }
      e.target.value = '';
    },
    [handleParsedDataFromFile]
  );

  const handleDeleteGlobalDataset = (id: string) => {
    setGlobalDatasets((prev) => prev.filter((d) => d.id !== id));
    toast.success('Da xoa bo du lieu');
  };

  const updateDatasetRows = useCallback((datasetId: string, projectId: string | undefined, newRows: Record<string, any>[], newHeaders?: string[]) => {
    if (projectId) {
      const key = `statspro-datasets-${projectId}`;
      try {
        const raw = localStorage.getItem(key);
        const existing: Dataset[] = raw ? JSON.parse(raw) : [];
        const updated = existing.map((d) =>
          d.id === datasetId
            ? { ...d, rows: newRows, headers: newHeaders || d.headers, rowCount: newRows.length, colCount: (newHeaders || d.headers).length }
            : d
        );
        localStorage.setItem(key, JSON.stringify(updated));
      } catch { /* ignore */ }
      setRefreshKey((k) => k + 1);
    } else {
      setGlobalDatasets((prev) =>
        prev.map((d) =>
          d.id === datasetId
            ? { ...d, rows: newRows, headers: newHeaders || d.headers, rowCount: newRows.length, colCount: (newHeaders || d.headers).length }
            : d
        )
      );
    }
    window.dispatchEvent(new Event('storage'));
  }, [setGlobalDatasets]);

  const handleCellEdit = useCallback((dataset: Dataset, rowIndex: number, col: string, value: string) => {
    const newRows = [...dataset.rows];
    const numVal = Number(value);
    newRows[rowIndex] = { ...newRows[rowIndex], [col]: isNaN(numVal) || value.trim() === '' ? value : numVal };
    const updatedDataset = { ...dataset, rows: newRows };
    setPreviewDataset(updatedDataset);
    updateDatasetRows(dataset.id, dataset.projectId, newRows);
  }, [updateDatasetRows]);

  const handleAddRow = useCallback((dataset: Dataset) => {
    const newRow: Record<string, any> = {};
    dataset.headers.forEach((h) => { newRow[h] = ''; });
    const newRows = [...dataset.rows, newRow];
    const updatedDataset = { ...dataset, rows: newRows, rowCount: newRows.length };
    setPreviewDataset(updatedDataset);
    updateDatasetRows(dataset.id, dataset.projectId, newRows);
    toast.success('Da them dong moi');
  }, [updateDatasetRows]);

  const handleDeleteRow = useCallback((dataset: Dataset, rowIndex: number) => {
    const newRows = dataset.rows.filter((_, i) => i !== rowIndex);
    const updatedDataset = { ...dataset, rows: newRows, rowCount: newRows.length };
    setPreviewDataset(updatedDataset);
    updateDatasetRows(dataset.id, dataset.projectId, newRows);
    toast.success('Da xoa dong');
  }, [updateDatasetRows]);

  const filteredDatasets = activeTab === 'all' ? allDatasets : activeTab === 'global' ? globalDatasets.map((ds) => ({ ...ds, projectName: 'Du lieu chung' as string | undefined })) : allProjectDatasets.filter((ds) => ds.projectId === activeTab);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <AppLayout>
      {/* Hidden refresh key consumer to force re-render */}
      <span key={refreshKey} className="hidden" />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 mb-2">Du Lieu</h1>
            <p className="text-base text-neutral-500">
              Quan ly va nhap du lieu phan tich tu tat ca cac du an
            </p>
          </div>
          <Button variant="outline" size="lg" onClick={() => openImport('global')} className="h-12 px-5">
            <Upload className="size-5 mr-2" />
            Nhap du lieu chung
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card>
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                <Database className="size-7 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{allDatasets.length}</p>
                <p className="text-sm text-muted-foreground">Tong so bo du lieu</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center">
                <FolderOpen className="size-7 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Du an</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center">
                <FileText className="size-7 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{globalDatasets.length}</p>
                <p className="text-sm text-muted-foreground">Du lieu chung</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1 p-2">
            <TabsTrigger value="all" className="text-sm px-4 py-2">
              <Database className="size-4 mr-2" />
              Tat ca
            </TabsTrigger>
            <TabsTrigger value="global" className="text-sm px-4 py-2">
              <FileText className="size-4 mr-2" />
              Du lieu chung
            </TabsTrigger>
            {projects.map((project) => {
              const count = allProjectDatasets.filter((ds) => ds.projectId === project.id).length;
              return count > 0 ? (
                <TabsTrigger key={project.id} value={project.id} className="text-sm px-4 py-2">
                  <FolderOpen className="size-4 mr-2" />
                  {project.name}
                </TabsTrigger>
              ) : null;
            })}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredDatasets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-card shadow-sm">
                <Database className="size-16 text-neutral-300 mb-5" />
                <p className="text-neutral-500 text-xl font-medium mb-2">Chua co du lieu</p>
                <p className="text-neutral-400 text-base mt-1 max-w-sm mb-6">
                  {activeTab === 'all' ? 'Chua co bo du lieu nao trong he thong' : activeTab === 'global' ? 'Chua co du lieu chung nao' : 'Du an nay chua co du lieu'}
                </p>
                <Button size="lg" className="h-12 px-6" onClick={() => openImport(activeTab === 'all' || activeTab === 'global' ? 'global' : activeTab)}>
                  <Upload className="size-5 mr-2" />
                  Nhap du lieu
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* If showing all, group by project */}
                {activeTab === 'all' ? (
                  Array.from(datasetsByProject.entries()).map(([projectName, datasets]) => (
                    datasets.length > 0 && (
                      <div key={projectName}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-semibold text-neutral-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {projectName}
                            <Badge variant="secondary" className="text-xs">{datasets.length}</Badge>
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {datasets.map((ds) => (
                            <DatasetCard key={ds.id} dataset={ds} onPreview={setPreviewDataset} onDelete={projectName === 'Du lieu chung' ? handleDeleteGlobalDataset : undefined} />
                          ))}
                        </div>
                      </div>
                    )
                  ))
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDatasets.map((ds) => (
                      <DatasetCard
                        key={ds.id}
                        dataset={ds}
                        onPreview={setPreviewDataset}
                        onDelete={activeTab === 'global' ? handleDeleteGlobalDataset : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Import Dialog */}
      <Dialog
        open={isImportOpen}
        onOpenChange={(open) => {
          setIsImportOpen(open);
          if (!open) resetUpload();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">Nhap du lieu</DialogTitle>
            <DialogDescription className="text-sm">
              {importTarget === 'global'
                ? 'Nhap du lieu chung khong lien ket voi du an nao'
                : `Nhap du lieu vao du an: ${projects.find((p) => p.id === importTarget)?.name}`}
              . Ho tro CSV, Excel, JSON, TSV.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-6 py-4">
              {/* Target selector */}
              <div>
                <Label className="mb-3 block text-sm font-medium">Luu vao</Label>
                <Select value={importTarget} onValueChange={(v) => setImportTarget(v as 'global' | string)}>
                  <SelectTrigger className="h-12 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Du lieu chung</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drag & Drop Zone */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={
                    'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ' +
                    (isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-neutral-300 hover:border-neutral-400')
                  }
                >
                  <motion.div
                    animate={{ scale: isDragging ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Upload className="size-14 text-neutral-400 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-base font-semibold mb-1">
                    Keo tha file vao day hoac bam de chon file
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Toi da 10MB
                  </p>

                  {/* Format icons */}
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <FormatBadge icon={<FileSpreadsheet className="size-4" />} label=".xlsx" color="text-green-600 bg-green-50" />
                    <FormatBadge icon={<FileSpreadsheet className="size-4" />} label=".xls" color="text-green-600 bg-green-50" />
                    <FormatBadge icon={<ArrowUpDown className="size-4" />} label=".csv" color="text-blue-600 bg-blue-50" />
                    <FormatBadge icon={<FileJson className="size-4" />} label=".json" color="text-orange-600 bg-orange-50" />
                    <FormatBadge icon={<FileText className="size-4" />} label=".tsv" color="text-gray-600 bg-gray-50" />
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_STRING}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </motion.div>

              {/* File Info Card */}
              <AnimatePresence>
                {uploadedFile && previewData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getFileIcon(uploadedFile.type)}
                            <CardTitle className="text-lg">{uploadedFile.name}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetUpload();
                            }}
                            className="size-9"
                          >
                            <X className="size-5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* Stats */}
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline" className="text-sm px-3 py-1">{uploadedFile.type}</Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1">{uploadedFile.size}</Badge>
                          <Badge variant="secondary" className="text-sm px-3 py-1">{uploadedFile.rows} dong</Badge>
                          <Badge variant="secondary" className="text-sm px-3 py-1">{uploadedFile.cols} cot</Badge>
                        </div>

                        {/* Sheet selector for Excel */}
                        {allSheets && allSheets.sheetNames.length > 1 && (
                          <div className="flex items-center gap-3">
                            <Label className="text-sm whitespace-nowrap font-medium">Sheet:</Label>
                            <Select
                              value={String(selectedSheet)}
                              onValueChange={(v) => handleSheetChange(Number(v))}
                            >
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {allSheets.sheetNames.map((name, idx) => (
                                  <SelectItem key={idx} value={String(idx)}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Preview table */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <TableIcon className="size-5 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Xem truoc {Math.min(previewData.rows.length, 20)} / {previewData.rows.length} dong
                            </span>
                          </div>
                          <div className="rounded-md border overflow-hidden">
                            <ScrollArea className="h-[280px]">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {previewData.headers.map((h) => (
                                      <TableHead key={h} className="text-sm whitespace-nowrap py-3 px-4">
                                        {h}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {previewData.rows.slice(0, 20).map((row, idx) => (
                                    <TableRow key={idx}>
                                      {previewData.headers.map((h) => (
                                        <TableCell key={h} className="text-sm py-2 px-4">
                                          {typeof row[h] === 'number'
                                            ? Number(row[h]).toLocaleString('vi-VN')
                                            : String(row[h] ?? '')}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </div>
                        </div>

                        {/* Confirm buttons */}
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" size="lg" className="flex-1 h-12" onClick={resetUpload}>
                            <X className="size-5 mr-2" />
                            Huy
                          </Button>
                          <Button size="lg" className="flex-1 h-12" onClick={confirmImport}>
                            <Check className="size-5 mr-2" />
                            Nhap du lieu
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

      {/* Preview Dialog with Inline Edit */}
      <Dialog open={!!previewDataset} onOpenChange={() => setPreviewDataset(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg">Chinh sua du lieu: {previewDataset?.name}</DialogTitle>
                <DialogDescription className="text-sm">
                  {previewDataset?.rowCount} dong &middot; {previewDataset?.colCount} cot
                  {previewDataset?.projectName && ` \u00b7 Du an: ${previewDataset.projectName}`}
                  {' '}\u00b7 Nhan vao o de chinh sua
                </DialogDescription>
              </div>
              <Button size="lg" className="h-12 px-4 gap-2" onClick={() => previewDataset && handleAddRow(previewDataset)}>
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
                            <EditableCell
                              value={row[h]}
                              onChange={(val) => handleCellEdit(previewDataset, idx, h, val)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-sm py-2 px-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRow(previewDataset, idx)}
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
    </AppLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  EditableCell Component                                             */
/* ------------------------------------------------------------------ */

function EditableCell({ value, onChange }: { value: any; onChange: (v: string) => void }) {
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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FormatBadge({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium ' +
        color
      }
    >
      {icon}
      {label}
    </span>
  );
}

function getFileIcon(type: string) {
  const t = type.toLowerCase();
  if (t === 'xlsx' || t === 'xls')
    return <FileSpreadsheet className="size-6 text-green-600" />;
  if (t === 'json') return <FileJson className="size-6 text-orange-600" />;
  if (t === 'csv') return <ArrowUpDown className="size-6 text-blue-600" />;
  return <FileText className="size-6 text-gray-600" />;
}

function DatasetCard({
  dataset,
  onPreview,
  onDelete,
}: {
  dataset: Dataset;
  onPreview: (ds: Dataset) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {getFileIcon(dataset.fileType)}
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{dataset.name}</h3>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{dataset.fileType}</Badge>
                <span className="text-sm text-muted-foreground">{dataset.rowCount} dong</span>
                <span className="text-sm text-muted-foreground">{dataset.colCount} cot</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(dataset.uploadedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="icon-sm" className="size-9" onClick={() => onPreview(dataset)}>
              <Eye className="size-5 text-muted-foreground" />
            </Button>
            {onDelete && (
              <Button variant="ghost" size="icon-sm" className="size-9 text-destructive hover:text-destructive" onClick={() => onDelete(dataset.id)}>
                <Trash2 className="size-5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
