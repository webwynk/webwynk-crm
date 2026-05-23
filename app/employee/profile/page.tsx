"use client";

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  User,
  Mail,
  Briefcase,
  Phone,
  BookOpen,
  Lock,
  Camera,
  Loader2,
  Check,
} from 'lucide-react';
import PageWrapper from '@/components/shared/PageWrapper';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export default function EmployeeProfilePage() {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [name, setName] = useState(session?.user?.name || '');
  const [phone, setPhone] = useState(session?.user?.phone || '');
  const [designation, setDesignation] = useState(session?.user?.designation || '');
  const [bio, setBio] = useState(session?.user?.bio || '');
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB.');
        return;
      }

      setAvatarPreview(URL.createObjectURL(file));

      // Upload file directly
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to upload image');
        }

        const data = await res.json();
        setAvatarUrl(data.url);
        toast.success('Avatar uploaded successfully!');
      } catch (err) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : 'Error uploading file';
        toast.error(errMsg);
        setAvatarPreview(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/employees/${session.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          phone: phone || undefined,
          designation: designation || undefined,
          bio: bio || undefined,
          avatar: avatarUrl || undefined,
          password: newPassword ? newPassword : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update session values client-side
      await update({
        name: name || session.user.name,
        phone: phone || session.user.phone,
        designation: designation || session.user.designation,
        avatar: avatarUrl || session.user.avatar,
        bio: bio || session.user.bio,
      });

      toast.success('Profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = getInitials(name || session?.user?.name || 'User');

  return (
    <PageWrapper>
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal information, contact numbers, and security credentials"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Photo upload card */}
        <Card className="premium-card border border-border p-6 shadow-card flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-6 w-full text-left">
            Profile Photo
          </h3>

          <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
            <Avatar className="w-32 h-32 ring-4 ring-emerald-50 dark:ring-emerald-500/10 cursor-pointer">
              <AvatarImage
                src={avatarPreview || avatarUrl || undefined}
                className="object-cover"
              />
              <AvatarFallback className="bg-zinc-100 text-zinc-800 text-3xl font-extrabold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] text-white/90 font-medium">Change Photo</span>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="text-center mt-4 max-w-xs space-y-1">
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {name || session?.user?.name}
            </p>
            <p className="text-[10px] text-zinc-400 font-medium">
              {session?.user?.email}
            </p>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 pt-2">
              Allowed file types: JPG, PNG or WebP. Max size: 5MB.
            </p>
          </div>
        </Card>

        {/* Right Side: Form details */}
        <Card className="lg:col-span-2 premium-card border border-border bg-card rounded-2xl p-6 shadow-card">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-6 pb-3 border-b border-border">
            Edit Personal Profile
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    id="fullname"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="pl-9 h-9 text-sm focus-visible:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Email Address - Read Only */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ''}
                    className="pl-9 h-9 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 text-zinc-450 cursor-not-allowed select-none"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Designation */}
              <div className="space-y-1.5">
                <Label htmlFor="designation" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                  Designation
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    id="designation"
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Developer, Web Designer"
                    className="pl-9 h-9 text-sm focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="pl-9 h-9 text-sm focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                Short Biography / Intro
              </Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about what you do..."
                  rows={3}
                  className="pl-9 text-sm focus-visible:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Change Password Block */}
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                Change Password (Optional)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="h-9 text-sm focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="h-9 text-sm focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || isUploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-5 flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Profile Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageWrapper>
  );
}
