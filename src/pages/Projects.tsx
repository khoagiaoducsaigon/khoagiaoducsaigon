import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import {
  PlusIcon,
  Trash2Icon,
  FolderOpenIcon,
  SearchIcon,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: string;
}

const initialProjects: Project[] = [
  {
    id: '1',
    name: 'Phân tích doanh số Q1',
    description: 'Dự án phân tích doanh số bán hàng quý 1',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Khảo sát khách hàng',
    description: 'Thu thập và phân tích phản hồi khách hàng',
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Dự báo xu hướng 2023',
    description: 'Phân tích xu hướng thị trường năm 2023',
    status: 'archived',
    createdAt: '2023-06-10',
  },
];

const statusLabels: Record<string, string> = {
  active: 'Đang hoạt động',
  archived: 'Đã lưu trữ',
  completed: 'Hoàn thành',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  completed: 'secondary',
  archived: 'destructive',
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useLocalStorage<Project[]>('statspro-projects', initialProjects);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' as Project['status'] });

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên dự án');
      return;
    }
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProjects((prev) => [newProject, ...prev]);
    setForm({ name: '', description: '', status: 'active' });
    setIsCreateOpen(false);
    toast.success('Đã tạo dự án mới');
  };

  const confirmDelete = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!projectToDelete) return;
    setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
    setIsDeleteOpen(false);
    setProjectToDelete(null);
    toast.success('Đã xóa dự án');
  };

  const openEdit = (project: Project) => {
    setProjectToEdit(project);
    setForm({ name: project.name, description: project.description, status: project.status });
    setIsEditOpen(true);
  };

  const handleEdit = () => {
    if (!projectToEdit || !form.name.trim()) {
      toast.error('Vui lòng nhập tên dự án');
      return;
    }
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectToEdit.id
          ? { ...p, name: form.name.trim(), description: form.description.trim(), status: form.status }
          : p
      )
    );
    setIsEditOpen(false);
    setProjectToEdit(null);
    setForm({ name: '', description: '', status: 'active' });
    toast.success('Đã cập nhật dự án');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-heading-xl text-primary-900 mb-1">Dự Án</h1>
            <p className="text-body-md text-neutral-500">
              Quản lý các dự án phân tích dữ liệu của bạn
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="size-4" />
            Tạo dự án
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Projects Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpenIcon className="size-12 text-neutral-300 mb-4" />
            <p className="text-neutral-500 text-lg font-medium">Chưa có dự án nào</p>
            <p className="text-neutral-400 text-sm mt-1">
              {search ? 'Không tìm thấy dự án phù hợp' : 'Bấm "Tạo dự án" để bắt đầu'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên dự án</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {project.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(project); }}>
                            <Pencil className="size-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); confirmDelete(project); }}
                          >
                            <Trash2Icon className="size-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo dự án mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo dự án phân tích mới.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tên dự án *</Label>
              <Input
                id="name"
                placeholder="Nhập tên dự án"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn về dự án"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Project['status'] }))}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="active">Đang hoạt động</option>
                <option value="completed">Hoàn thành</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>Tạo dự án</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa dự án</DialogTitle>
            <DialogDescription>Cập nhật thông tin dự án.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên dự án *</Label>
              <Input
                id="edit-name"
                placeholder="Nhập tên dự án"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                placeholder="Mô tả ngắn về dự án"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Trạng thái</Label>
              <select
                id="edit-status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Project['status'] }))}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="active">Đang hoạt động</option>
                <option value="completed">Hoàn thành</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa dự án "{projectToDelete?.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
