import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { startIncomingPdi } from '@/modules/vehicles/service';

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { vins } = body;

    if (!vins || !Array.isArray(vins) || vins.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameter: vins' }, { status: 400 });
    }

    const count = await startIncomingPdi(vins);

    return NextResponse.json({
      success: true,
      message: `Started incoming PDI for ${count} vehicles.`,
      jobsCount: count,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error starting incoming PDI:', error);
    return safeErrorResponse(error);
  }
}
