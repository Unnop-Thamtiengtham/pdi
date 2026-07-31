import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import WebhooksClient from './WebhooksClient';

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only MASTER and SUPER_ADMIN roles are allowed to access settings
  const userRole = session.user?.role;
  if (userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN') {
    redirect('/');
  }

  let initialWebhooks: Array<{
    id: string;
    name: string;
    url: string;
    secret: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  try {
    initialWebhooks = await prisma.webhookSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to load webhooks from database:', error);
  }

  // Format date fields to plain string for safe client prop passing
  const webhooks = initialWebhooks.map((w) => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }));

  return (
    <WebhooksClient initialWebhooks={webhooks} />
  );
}
