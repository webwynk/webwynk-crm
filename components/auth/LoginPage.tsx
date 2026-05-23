"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type RoleType = 'EMPLOYEE' | 'HR' | 'ADMIN';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<RoleType>('EMPLOYEE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Styling configurations per role accent
  const roleStyles = {
    EMPLOYEE: {
      accent: '#10b981', // Emerald
      bgLight: 'from-emerald-50/50 via-zinc-50 to-zinc-100/50',
      tabColor: 'text-emerald-600 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10',
      btnHover: 'hover:bg-emerald-600',
      btnBg: 'bg-emerald-500',
      focusRing: 'focus-visible:ring-emerald-500',
    },
    HR: {
      accent: '#0ea5e9', // Sky Blue
      bgLight: 'from-sky-50/50 via-zinc-50 to-zinc-100/50',
      tabColor: 'text-sky-600 border-sky-500 bg-sky-50/30 dark:bg-sky-500/10',
      btnHover: 'hover:bg-sky-600',
      btnBg: 'bg-sky-500',
      focusRing: 'focus-visible:ring-sky-500',
    },
    ADMIN: {
      accent: '#6366f1', // Indigo
      bgLight: 'from-indigo-50/50 via-zinc-50 to-zinc-100/50',
      tabColor: 'text-indigo-600 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10',
      btnHover: 'hover:bg-indigo-600',
      btnBg: 'bg-indigo-500',
      focusRing: 'focus-visible:ring-indigo-500',
    },
  };

  const handleTabChange = (role: RoleType) => {
    setActiveTab(role);
    // Auto-fill convenience during development for seeded accounts
    if (process.env.NODE_ENV === 'development') {
      if (role === 'ADMIN') {
        setEmail('admin@webwynk.com');
      } else if (role === 'HR') {
        setEmail('hr@webwynk.com');
      } else {
        setEmail('employee@webwynk.com');
      }
    } else {
      setEmail('');
    }
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Signed in successfully');
        // Let Next.js handle redirection based on auth middleware
        window.location.href = '/';
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#f8f9fc] dark:bg-[#0c0e14]">
      {/* Dynamic Background Radial Gradients */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 dark:opacity-20 transition-all duration-700" 
        style={{
          background: `radial-gradient(circle, ${roleStyles[activeTab].accent} 0%, transparent 70%)`
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 dark:opacity-20 transition-all duration-700" 
        style={{
          background: `radial-gradient(circle, ${roleStyles[activeTab].accent} 0%, transparent 70%)`
        }}
      />

      <div className="w-full max-w-[420px] z-10 flex flex-col items-center">
        {/* Logo and branding */}
        <div className="text-center mb-8 flex flex-col items-center select-none">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-500 text-white"
              style={{ backgroundColor: roleStyles[activeTab].accent }}
            >
              <span className="font-bold text-lg tracking-wider">W</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
              Web<span style={{ color: roleStyles[activeTab].accent }}>Wynk</span>
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Internal CRM — Agency Management Platform
          </p>
        </div>

        {/* Login Card Wrapper */}
        <Card className="w-full border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl rounded-2xl shadow-card p-2">
          <CardHeader className="pb-4">
            {/* Custom Tab Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
              {(['EMPLOYEE', 'HR', 'ADMIN'] as RoleType[]).map((role) => {
                const isActive = activeTab === role;
                const Icon = {
                  EMPLOYEE: User,
                  HR: Users,
                  ADMIN: Shield,
                }[role];

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleTabChange(role)}
                    className={`relative flex flex-col items-center justify-center py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 outline-none ${
                      isActive 
                        ? roleStyles[role].tabColor + ' shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4">
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              {activeTab === 'ADMIN' ? 'Admin Portal' : activeTab === 'HR' ? 'HR Portal' : 'Employee Login'}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              Enter your credentials to continue
            </CardDescription>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@webwynk.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={`bg-white/50 dark:bg-zinc-900/50 rounded-lg border-zinc-200 dark:border-zinc-850 h-10 ${roleStyles[activeTab].focusRing}`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password font-medium text-zinc-700 dark:text-zinc-300">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={`bg-white/50 dark:bg-zinc-900/50 rounded-lg border-zinc-200 dark:border-zinc-850 h-10 ${roleStyles[activeTab].focusRing}`}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-semibold transition-all duration-300 h-10 rounded-lg shadow-sm border-0 select-none ${roleStyles[activeTab].btnBg} ${roleStyles[activeTab].btnHover} active:scale-98`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-8 font-medium">
          © {new Date().getFullYear()} WebWynk Agency. All rights reserved.
        </p>
      </div>
    </div>
  );
}
