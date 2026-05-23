import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.designation = user.designation;
        token.avatar = user.avatar;
        token.isFirstLogin = user.isFirstLogin;
        token.phone = user.phone;
        token.bio = user.bio;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as 'ADMIN' | 'HR' | 'EMPLOYEE';
        session.user.id = token.id as string;
        session.user.designation = token.designation as string | undefined;
        session.user.avatar = token.avatar as string | null | undefined;
        session.user.isFirstLogin = token.isFirstLogin as boolean | undefined;
        session.user.phone = token.phone as string | null | undefined;
        session.user.bio = token.bio as string | null | undefined;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as 'ADMIN' | 'HR' | 'EMPLOYEE' | undefined;
      
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnHR = nextUrl.pathname.startsWith('/hr');
      const isOnEmployee = nextUrl.pathname.startsWith('/employee');
      const isApiAuth = nextUrl.pathname.startsWith('/api/auth');

      if (isApiAuth) return true;

      if (isOnAdmin || isOnHR || isOnEmployee) {
        if (isLoggedIn) {
          if (isOnAdmin && role !== 'ADMIN') return false;
          if (isOnHR && role !== 'HR' && role !== 'ADMIN') return false;
          if (isOnEmployee && role !== 'EMPLOYEE') return false;
          return true; // Authorized
        }
        return false; // Redirect unauthenticated users to login page
      }

      // If user is logged in and is on the root login page, redirect them to their dashboard
      if (isLoggedIn && nextUrl.pathname === '/') {
        if (role === 'ADMIN') return Response.redirect(new URL('/admin/dashboard', nextUrl));
        if (role === 'HR') return Response.redirect(new URL('/hr/dashboard', nextUrl));
        if (role === 'EMPLOYEE') return Response.redirect(new URL('/employee/dashboard', nextUrl));
      }

      return true;
    },
  },
  providers: [], // Add providers in auth.ts to keep config edge-compatible
} satisfies NextAuthConfig;
