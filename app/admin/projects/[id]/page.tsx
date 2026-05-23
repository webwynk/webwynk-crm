"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Loader2,
  Globe,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit,
  ExternalLink,
  Plus,
  Shield,
  FileText,
  Users,
  Calendar,
  Layers,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDate, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import ProjectChat from '@/components/chat/ProjectChat';

interface UserDetail {
  id: string;
  name: string;
  avatar: string | null;
  designation: string | null;
  email: string;
  role: string;
}

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  clientName: string;
  clientEmail: string | null;
  type: string;
  status: string;
  coverImage: string | null;
  startDate: string;
  dueDate: string | null;
  progress: number;
  assignments: Array<{
    id: string;
    user: UserDetail;
  }>;
  createdBy: { id: string; name: string };
  credentials?: {
    id: string;
    devUrl: string;
    username: string;
    password: string;
    notes: string | null;
  } | null;
}

export default function AdminProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  // Form states for Credentials
  const [devUrl, setDevUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch Project Details
  const { data: project, isLoading, error } = useQuery<ProjectDetail>({
    queryKey: ['admin-project', id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Forbidden: Access Denied.');
        }
        throw new Error('Project not found');
      }
      return res.json();
    },
    retry: false,
  });

  // Project Update Mutation (Status and Progress)
  const updateProjectMutation = useMutation({
    mutationFn: async (payload: { status?: string; progress?: number }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update project');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-project', id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Something went wrong');
    },
  });

  // Save/Update Credentials Mutation
  const saveCredentialsMutation = useMutation({
    mutationFn: async (credentialsData: {
      devUrl: string;
      username: string;
      password: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/projects/${id}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentialsData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save credentials');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Credentials saved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-project', id] });
      setIsCredentialsModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Something went wrong');
    },
  });

  const handleOpenCredentialsModal = () => {
    if (project?.credentials) {
      setDevUrl(project.credentials.devUrl);
      setUsername(project.credentials.username);
      setPassword(project.credentials.password);
      setNotes(project.credentials.notes || '');
    } else {
      setDevUrl('');
      setUsername('');
      setPassword('');
      setNotes('');
    }
    setIsCredentialsModalOpen(true);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devUrl || !username || !password) {
      toast.error('Development URL, Username, and Password are required');
      return;
    }
    saveCredentialsMutation.mutate({ devUrl, username, password, notes });
  };

  const handleStatusChange = (status: string) => {
    updateProjectMutation.mutate({ status });
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = parseInt(e.target.value, 10);
    if (isNaN(progress)) return;
    updateProjectMutation.mutate({ progress });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </PageWrapper>
    );
  }

  if (error || !project) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-zinc-850 dark:text-zinc-200 mb-1">
              Project Not Found or Access Denied
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
              {error instanceof Error ? error.message : 'You do not have permission to view this project.'}
            </p>
            <Button
              variant="outline"
              className="mt-6 border-zinc-200 hover:bg-zinc-100 gap-2 h-9"
              onClick={() => router.push('/admin/projects')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const isWebDev = project.type === 'WEBSITE_DEVELOPMENT';

  return (
    <PageWrapper>
      {/* Back Link */}
      <div className="mb-4">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-455 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
      </div>

      {/* Header Panel */}
      <div className="premium-card relative bg-card border border-border rounded-2xl overflow-hidden shadow-card p-6 mb-6">
        {/* Cover backdrop */}
        {project.coverImage && (
          <div className="absolute inset-0 z-0 h-full w-full opacity-10 pointer-events-none">
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              sizes="100vw"
              className="w-full h-full object-cover blur-[2px]"
            />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {project.type.replace('_', ' ')}
              </span>
              <StatusBadge status={project.status} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {project.title}
            </h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
              Client: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{project.clientName}</span>
              {project.clientEmail && ` (${project.clientEmail})`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shrink-0">
            {/* Progress Adjuster */}
            <div className="space-y-1.5 pr-2 border-r border-zinc-200 dark:border-zinc-850">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <span>Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-xs">{project.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={project.progress}
                onChange={handleProgressChange}
                disabled={updateProjectMutation.isPending}
                className="w-32 accent-indigo-600 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
              />
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">Status</span>
              <Select
                value={project.status}
                onValueChange={(val) => val && handleStatusChange(val)}
                disabled={updateProjectMutation.isPending}
              >
                <SelectTrigger className="w-32 h-8 text-xs font-semibold bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-border">
                  <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="text-xs">In Progress</SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs">Completed</SelectItem>
                  <SelectItem value="ON_HOLD" className="text-xs">On Hold</SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Date Meta Row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 pt-4 border-t border-border/60 text-xs text-zinc-500 dark:text-zinc-400 relative z-10">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Started: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatDate(project.startDate)}</span></span>
          </div>
          {project.dueDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Due Date: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatDate(project.dueDate)}</span></span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Created By: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{project.createdBy.name}</span></span>
          </div>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column (Guidelines + Description + Credentials) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="premium-card border border-border bg-card rounded-2xl p-6 shadow-card">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Project Details & Description
            </h2>
            <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
              {project.description || (
                <span className="italic text-zinc-400 dark:text-zinc-500">No project description provided.</span>
              )}
            </div>
          </div>

          {/* Credentials Block (Only for Website Development projects) */}
          {isWebDev ? (
            <div className="premium-card border border-border bg-card rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-500" />
                  Development Credentials
                </h2>
                {project.credentials && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleOpenCredentialsModal}
                    className="h-8 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400 gap-1.5"
                  >
                    <Edit className="w-3 h-3" />
                    Edit Details
                  </Button>
                )}
              </div>

              {project.credentials ? (
                <div className="space-y-4">
                  {/* Credentials Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5">
                    {/* URL */}
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Staging Link</span>
                      <a
                        href={
                          project.credentials.devUrl.startsWith('http')
                            ? project.credentials.devUrl
                            : `https://${project.credentials.devUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-full"
                      >
                        {project.credentials.devUrl}
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>

                    {/* Username */}
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Username</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {project.credentials.username}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(project.credentials!.username, 'Username')}
                          className="w-5 h-5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0 text-zinc-400 hover:text-zinc-650"
                        >
                          {copiedField === 'Username' ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Password</span>
                      <div className="flex items-center justify-between gap-1.5 mt-0.5 bg-background border border-border/80 px-2 py-0.5 rounded-lg">
                        <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">
                          {showPassword ? project.credentials.password : '••••••••'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setShowPassword(!showPassword)}
                            className="w-5 h-5 text-zinc-400 hover:text-zinc-650 rounded"
                          >
                            {showPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(project.credentials!.password, 'Password')}
                            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-700 h-6 px-1.5 gap-0.5"
                          >
                            {copiedField === 'Password' ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {project.credentials.notes && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                        Access Notes
                      </span>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap font-medium">
                        {project.credentials.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Globe className="w-8 h-8 text-zinc-350 dark:text-zinc-650 mb-2.5" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    No development credentials set up yet
                  </p>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 max-w-xs mb-4">
                    Provide the development link and login credentials for this project to share access details with your assignees.
                  </p>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 h-8 px-4"
                    onClick={handleOpenCredentialsModal}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Set Up Credentials
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="premium-card border border-border bg-card rounded-2xl p-6 shadow-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-zinc-500 dark:text-zinc-450" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Standard Project Guidelines
                </h3>
                <p className="text-[11px] text-zinc-505 dark:text-zinc-400 leading-relaxed mt-0.5">
                  This project is designated as a <span className="font-semibold">{project.type.replace('_', ' ')}</span> project. Development credentials are specifically reserved for website development projects.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Team Members) */}
        <div className="space-y-6">
          <div className="premium-card border border-border bg-card rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-4 pb-3 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Project Team ({project.assignments.length})
            </h2>

            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {project.assignments.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-4 text-center">No team members assigned.</p>
              ) : (
                project.assignments.map((assignment) => {
                  const isCreator = assignment.user.id === project.createdBy.id;
                  const initials = getInitials(assignment.user.name);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="w-8 h-8 ring-1 ring-border">
                          <AvatarImage
                            src={assignment.user.avatar || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-zinc-150 text-zinc-800 text-[10px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 block truncate leading-tight">
                            {assignment.user.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">
                            {assignment.user.designation || assignment.user.role}
                          </span>
                        </div>
                      </div>
                      {isCreator && (
                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Lead
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Chat Section */}
      <div className="mt-6">
        <ProjectChat projectId={id} accent="indigo" />
      </div>

      {/* Credentials Dialog */}
      <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
        <DialogContent className="max-w-[480px] p-6 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
              {project.credentials ? 'Edit Credentials' : 'Set Up Credentials'}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-450">
              Provide the live development URL and credentials for teammates to access dev services.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCredentials} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label htmlFor="url" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                Development Link <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                type="text"
                placeholder="e.g. dev.mywebsite.com or https://staging.domain.com"
                value={devUrl}
                onChange={(e) => setDevUrl(e.target.value)}
                className="h-9 text-sm focus-visible:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. admin or dev@webwynk.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-9 text-sm focus-visible:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pass" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pass"
                  type="text"
                  placeholder="Secret password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-sm focus-visible:ring-indigo-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                Access Notes / Settings (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add special setup instructions, port numbers, key directories, or databases details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="text-sm focus-visible:ring-indigo-500 resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCredentialsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 text-xs font-semibold h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveCredentialsMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 flex items-center gap-1.5"
              >
                {saveCredentialsMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Credentials
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
