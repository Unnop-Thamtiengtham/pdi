import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import * as bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Employee ID or Email', type: 'text', placeholder: 'EMP-12345 or email@pdi.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please fill in both fields.');
        }

        // Search by employeeId or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { employeeId: credentials.username },
              { email: credentials.username },
            ],
            isActive: true,
          },
          include: {
            branch: true,
          },
        });

        if (!user) {
          throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        // Guard against null/empty passwordHash to prevent bcrypt crash
        if (!user.passwordHash) {
          throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        const isValid = bcrypt.compareSync(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          branchId: user.branchId,
          branchCode: user.branch?.code || null,
          branchName: user.branch?.name || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
        token.branchId = (user as any).branchId;
        token.branchCode = (user as any).branchCode;
        token.branchName = (user as any).branchName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          employeeId: token.employeeId as string,
          branchId: token.branchId as string,
          branchCode: token.branchCode as string,
          branchName: token.branchName as string,
        } as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
