"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Loader2, FolderKanban, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  clientName: z.string().min(2, 'Client name is required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  type: z.enum(['WEBSITE_DEVELOPMENT', 'SEO', 'APP_DEVELOPMENT', 'SOCIAL_MEDIA', 'BRANDING', 'OTHER']),
  startDate: z.string().min(1, 'Start date is required'),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

interface ProjectCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  designation: string | null;
  avatar: string | null;
  role: string;
}

export default function ProjectCreateModal({
  open,
  onClose,
  onSuccess,
}: ProjectCreateModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'WEBSITE_DEVELOPMENT' },
  });

  const selectedType = watch('type');

  // Fetch employees for multi-select
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    },
    enabled: open,
  });

  // Reset on close
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedEmployees([]);
      setCoverImageUrl('');
    }
  }, [open, reset]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be under 5MB');
      return;
    }

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'project-covers');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setCoverImageUrl(data.url);
      toast.success('Cover image uploaded');
    } catch {
      toast.error('Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          coverImage: coverImageUrl || undefined,
          assigneeIds: selectedEmployees,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create project');
      }

      toast.success('Project created successfully!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-modal max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                New Project
              </h2>
              <p className="text-xs text-zinc-400">Fill in the details to create a project</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-lg">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="create-project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Two column: Title + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-title" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  Project Title *
                </Label>
                <Input
                  id="proj-title"
                  {...register('title')}
                  placeholder="e.g. WebWynk Redesign"
                  className="text-sm"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-type" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  Project Type *
                </Label>
                <Select
                  defaultValue="WEBSITE_DEVELOPMENT"
                  onValueChange={(v) => setValue('type', v as FormData['type'])}
                >
                  <SelectTrigger id="proj-type" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEBSITE_DEVELOPMENT">🌐 Website Development</SelectItem>
                    <SelectItem value="SEO">📈 SEO</SelectItem>
                    <SelectItem value="APP_DEVELOPMENT">📱 App Development</SelectItem>
                    <SelectItem value="SOCIAL_MEDIA">📣 Social Media</SelectItem>
                    <SelectItem value="BRANDING">🎨 Branding</SelectItem>
                    <SelectItem value="OTHER">📁 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Web dev info banner */}
            {selectedType === 'WEBSITE_DEVELOPMENT' && (
              <div className="flex items-start gap-2.5 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-3">
                <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  Employees assigned to this project will be able to submit website dev credentials (URL, login, password).
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                Description
              </Label>
              <Textarea
                id="proj-desc"
                {...register('description')}
                placeholder="Brief description of the project scope..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Two column: Client name + email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-client" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  Client Name *
                </Label>
                <Input
                  id="proj-client"
                  {...register('clientName')}
                  placeholder="e.g. Acme Corp"
                  className="text-sm"
                />
                {errors.clientName && (
                  <p className="text-xs text-destructive">{errors.clientName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-client-email" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  Client Email
                </Label>
                <Input
                  id="proj-client-email"
                  {...register('clientEmail')}
                  type="email"
                  placeholder="client@company.com"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Two column: Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-start" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  Start Date *
                </Label>
                <Input
                  id="proj-start"
                  {...register('startDate')}
                  type="date"
                  className="text-sm"
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-due" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  Due Date
                </Label>
                <Input
                  id="proj-due"
                  {...register('dueDate')}
                  type="date"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                Cover Image
              </Label>
              <div className="flex items-center gap-3">
                {coverImageUrl ? (
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('')}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : null}
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs text-zinc-500 dark:text-zinc-400">
                  {uploadingCover ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {uploadingCover ? 'Uploading...' : 'Upload cover image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                  />
                </label>
              </div>
            </div>

            {/* Assign Employees */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                Assign Employees
                {selectedEmployees.length > 0 && (
                  <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                    ({selectedEmployees.length} selected)
                  </span>
                )}
              </Label>
              <div className="max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                {employees.length === 0 ? (
                  <div className="p-3 text-center text-xs text-zinc-400">No employees found</div>
                ) : (
                  employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        selectedEmployees.includes(emp.id)
                          ? 'bg-indigo-50 dark:bg-indigo-500/10'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center',
                          selectedEmployees.includes(emp.id)
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-border'
                        )}
                      >
                        {selectedEmployees.includes(emp.id) && (
                          <span className="text-white text-[10px]">✓</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate block">
                          {emp.name}
                        </span>
                        <span className="text-xs text-zinc-400 truncate block">
                          {emp.designation || emp.role} · {emp.email}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/20 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="text-sm">
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            disabled={isSubmitting || uploadingCover}
            id="create-project-submit-btn"
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
