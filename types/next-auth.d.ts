import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    designation?: string | null;
    avatar?: string | null;
    isFirstLogin?: boolean;
    phone?: string | null;
    bio?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'HR' | 'EMPLOYEE';
      designation?: string | null;
      avatar?: string | null;
      isFirstLogin?: boolean;
      phone?: string | null;
      bio?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    designation?: string | null;
    avatar?: string | null;
    isFirstLogin?: boolean;
    phone?: string | null;
    bio?: string | null;
  }
}

