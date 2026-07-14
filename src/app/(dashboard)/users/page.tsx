import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Strict restriction: only MASTER role can access this page
  if (session.user?.role !== 'MASTER') {
    redirect('/');
  }

  let dbUsers: any[] = [];
  let dbBranches: any[] = [];

  try {
    dbUsers = await prisma.user.findMany({
      include: { branch: true },
      orderBy: { createdAt: 'desc' },
    });

    dbBranches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to load users page data:', error);
  }

  return (
    <UsersClient
      initialUsers={dbUsers}
      branches={dbBranches}
    />
  );
}
