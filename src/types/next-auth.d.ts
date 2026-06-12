import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      employeeId: string;
      branchId: string;
      branchCode: string;
      branchName: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: string;
    employeeId: string;
    branchId: string;
    branchCode: string;
    branchName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    employeeId: string;
    branchId: string;
    branchCode: string;
    branchName: string;
  }
}
