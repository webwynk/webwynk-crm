"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, UserPlus, Loader2, Copy, Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  role: z.enum(['HR', 'EMPLOYEE']),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EmployeeCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CreatedEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  tempPassword: string;
}

export default function EmployeeCreateModal({
  open,
  onClose,
  onSuccess,
}: EmployeeCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedEmployee | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'EMPLOYEE' },
  });

  const handleClose = () => {
    reset();
    setCreated(null);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create employee');
      }

      const newEmployee = await res.json();
      setCreated(newEmployee);
      toast.success('Employee account created!');
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create employee');
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
        onClick={!created ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-modal max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-50 dark:bg-sky-500/10 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {created ? 'Account Created!' : 'Add Employee'}
              </h2>
              <p className="text-xs text-zinc-400">
                {created ? 'Share credentials with the new member' : 'Create a new team member account'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-lg">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {created ? (
            // ─── Success State ──────────────────────────────────
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                  {created.name}&apos;s account is ready!
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Share these credentials securely. The employee will be prompted to change their password on first login.
                </p>
              </div>

              <div className="space-y-3">
                <CredentialRow label="Email" value={created.email} />
                <CredentialRow label="Temp Password" value={created.tempPassword} highlight />
                <CredentialRow label="Role" value={created.role} />
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
                ⚠️ This temp password will not be shown again. Copy it now and share securely.
              </div>
            </div>
          ) : (
            // ─── Create Form ───────────────────────────────────
            <form id="create-employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="emp-name" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    Full Name *
                  </Label>
                  <Input
                    id="emp-name"
                    {...register('name')}
                    placeholder="e.g. Aryan Sharma"
                    className="text-sm"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="emp-email" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    Work Email *
                  </Label>
                  <Input
                    id="emp-email"
                    {...register('email')}
                    type="email"
                    placeholder="aryan@webwynk.com"
                    className="text-sm"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emp-phone" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    Phone
                  </Label>
                  <Input
                    id="emp-phone"
                    {...register('phone')}
                    placeholder="+91 9876543210"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emp-role" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    Role *
                  </Label>
                  <Select
                    defaultValue="EMPLOYEE"
                    onValueChange={(v) => setValue('role', v as 'HR' | 'EMPLOYEE')}
                  >
                    <SelectTrigger id="emp-role" className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">👤 Employee</SelectItem>
                      <SelectItem value="HR">🤝 HR Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="emp-designation" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    Designation
                  </Label>
                  <Input
                    id="emp-designation"
                    {...register('designation')}
                    placeholder="e.g. Frontend Developer"
                    className="text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="emp-bio" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                    Bio
                  </Label>
                  <Textarea
                    id="emp-bio"
                    {...register('bio')}
                    placeholder="Brief description of skills and role..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/20 flex justify-end gap-2">
          {created ? (
            <Button
              onClick={handleClose}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="text-sm">
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-employee-form"
                disabled={isSubmitting}
                id="create-employee-submit-btn"
                className="text-sm bg-sky-600 hover:bg-sky-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      'flex items-center justify-between rounded-xl px-3 py-2.5 border',
      highlight
        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
        : 'bg-zinc-50 dark:bg-zinc-900/40 border-border'
    )}>
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className={cn(
          'text-sm font-mono font-semibold mt-0.5',
          highlight
            ? 'text-indigo-700 dark:text-indigo-300'
            : 'text-zinc-900 dark:text-zinc-50'
        )}>
          {value}
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </button>
    </div>
  );
}
