import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { getUrgentJobCount } from '@/modules/notifications/service';

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  try {
    const userRole = session.user?.role;
    const userBranchId = session.user?.branchId;
    const isBranchRestricted = userRole !== 'MASTER' && userRole !== 'SUPER_ADMIN' && userBranchId;

    const result = await getUrgentJobCount(isBranchRestricted ? userBranchId : undefined);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json({ count: 0, jobs: [] });
  }
}
