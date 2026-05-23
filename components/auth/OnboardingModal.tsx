"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { KeyRound, Camera, User, ArrowRight, Check, Loader2 } from 'lucide-react';
import { uploadFileToSupabase } from '@/lib/upload';
import { toast } from 'sonner';

export default function OnboardingModal() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [designation, setDesignation] = useState(session?.user?.designation || '');
  const [bio, setBio] = useState('');

  if (!session?.user?.isFirstLogin) {
    return null;
  }

  const role = session.user.role;
  
  // Dynamic color theme based on role
  const roleColors = {
    ADMIN: {
      primary: '#6366f1',
      bg: 'bg-[#6366f1]',
      text: 'text-[#6366f1]',
      hover: 'hover:bg-[#4f46e5]',
      border: 'border-[#6366f1]',
      focus: 'focus-visible:ring-[#6366f1]',
    },
    HR: {
      primary: '#0ea5e9',
      bg: 'bg-[#0ea5e9]',
      text: 'text-[#0ea5e9]',
      hover: 'hover:bg-[#0284c7]',
      border: 'border-[#0ea5e9]',
      focus: 'focus-visible:ring-[#0ea5e9]',
    },
    EMPLOYEE: {
      primary: '#10b981',
      bg: 'bg-[#10b981]',
      text: 'text-[#10b981]',
      hover: 'hover:bg-[#059669]',
      border: 'border-[#10b981]',
      focus: 'focus-visible:ring-[#10b981]',
    },
  }[role] || {
    primary: '#6366f1',
    bg: 'bg-[#6366f1]',
    text: 'text-[#6366f1]',
    hover: 'hover:bg-[#4f46e5]',
    border: 'border-[#6366f1]',
    focus: 'focus-visible:ring-[#6366f1]',
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be under 2MB.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    let avatarUrl = session.user.avatar || null;

    try {
      // 1. Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${session.user.id}/avatar-${Date.now()}.${fileExt}`;
        avatarUrl = await uploadFileToSupabase(avatarFile, 'avatars', filePath);
      }

      // 2. Submit onboarding info
      const res = await fetch(`/api/employees/${session.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          avatar: avatarUrl,
          designation: designation || undefined,
          bio: bio || undefined,
          isFirstLogin: false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit details');
      }

      toast.success('Onboarding complete!');

      // 3. Update session client-side
      await update({
        isFirstLogin: false,
        avatar: avatarUrl,
        designation: designation || undefined,
      });

      // 4. Force refresh to reload layouts
      window.location.reload();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during onboarding.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeOut' as const },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' as const },
    }),
  };

  return (
    <Dialog open={true}>
      <DialogContent 
        className="max-w-[440px] p-6 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-2xl shadow-2xl focus:outline-none"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center">
          {/* Header */}
          <div className="text-center w-full mb-6">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome to WebWynk CRM
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Let&apos;s set up your profile to get started
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8 w-full max-w-[280px]">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
                    s < step
                      ? `${roleColors.bg} border-transparent text-white`
                      : s === step
                      ? `${roleColors.border} ${roleColors.text} bg-white dark:bg-zinc-900 font-bold border-2`
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 bg-transparent'
                  }`}
                >
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-300 ${
                      s < step ? roleColors.bg : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Steps Content container */}
          <div className="relative w-full overflow-hidden min-h-[250px] mb-6 flex flex-col justify-between">
            <AnimatePresence mode="wait" custom={step}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4 w-full"
                >
                  <div className="flex justify-center mb-2">
                    <div className={`p-3 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 ${roleColors.text}`}>
                      <KeyRound className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Reset Password</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Please update your temporary password to secure your account.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`bg-zinc-50/50 dark:bg-zinc-900/50 ${roleColors.focus}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`bg-zinc-50/50 dark:bg-zinc-900/50 ${roleColors.focus}`}
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={1}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4 w-full flex flex-col items-center"
                >
                  <div className="text-center mb-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Upload Profile Photo</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Add an avatar so the team can recognize you.</p>
                  </div>
                  
                  <div className="relative group cursor-pointer mt-4">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="avatar-upload" className="cursor-pointer block">
                      {avatarPreview ? (
                        <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 shadow-md">
                          <Image
                            src={avatarPreview}
                            alt="Avatar preview"
                            fill
                            sizes="112px"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className={`w-28 h-28 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center hover:border-zinc-400 dark:hover:border-zinc-650 transition-colors`}>
                          <Camera className="w-6 h-6 text-zinc-400 dark:text-zinc-600 mb-1" />
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-medium">Upload File</span>
                        </div>
                      )}
                    </label>
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">Max 2MB (JPG, PNG, WebP)</p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={1}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4 w-full"
                >
                  <div className="flex justify-center mb-2">
                    <div className={`p-3 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 ${roleColors.text}`}>
                      <User className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Professional Details</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Let&apos;s check your designation and bio info.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      placeholder="e.g. UX Designer, Project Lead"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className={`bg-zinc-50/50 dark:bg-zinc-900/50 ${roleColors.focus}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Describe what you do in few sentences..."
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className={`bg-zinc-50/50 dark:bg-zinc-900/50 ${roleColors.focus} resize-none`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between w-full mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={handlePrevStep}
                disabled={loading}
                className="text-zinc-500 dark:text-zinc-400"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                onClick={handleNextStep}
                className={`${roleColors.bg} ${roleColors.hover} text-white flex items-center gap-1.5`}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className={`${roleColors.bg} ${roleColors.hover} text-white flex items-center gap-1.5`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Set Up
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
