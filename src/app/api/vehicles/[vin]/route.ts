import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { safeErrorResponse } from '@/lib/api-error';
import { updateVehicle } from '@/modules/vehicles/service';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  const session = await requireAuth(req);
  if (!session) return unauthorizedResponse();

  try {
    const { vin } = await params;
    const editorName = session.user?.name || 'Unknown User';
    const body = await req.json();

    const result = await updateVehicle(vin, body, editorName);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error updating vehicle details:', error);
    return safeErrorResponse(error);
  }
}
