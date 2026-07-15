import { prisma } from './prisma';

export async function triggerWebhook(jobId: string) {
  const webhookUrl = process.env.PDI_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[Webhook] PDI_WEBHOOK_URL not configured in environment variables. Skipping trigger.');
    return;
  }

  try {
    // Fetch full job detail with vehicle, branch, inspector, and approver details
    const fullJob = await prisma.pdiJob.findUnique({
      where: { id: jobId },
      include: {
        vehicle: {
          include: {
            branch: true,
          },
        },
        inspector: { select: { name: true, employeeId: true } },
        approver: { select: { name: true, employeeId: true } },
      },
    });

    if (!fullJob) {
      console.warn(`[Webhook] Job not found for ID: ${jobId}`);
      return;
    }

    const payload = {
      event: 'pdi.job_approved',
      jobId: fullJob.id,
      jobNumber: fullJob.jobNumber,
      pdiType: fullJob.pdiType,
      status: fullJob.status,
      approvedAt: fullJob.approvedAt ? fullJob.approvedAt.toISOString() : null,
      completedAt: fullJob.completedAt ? fullJob.completedAt.toISOString() : null,
      startedAt: fullJob.startedAt ? fullJob.startedAt.toISOString() : null,
      notes: fullJob.notes,
      vehicle: {
        vin: fullJob.vehicle.vin,
        modelCode: fullJob.vehicle.modelCode,
        modelName: fullJob.vehicle.modelName,
        colorCode: fullJob.vehicle.colorCode,
        colorName: fullJob.vehicle.colorName,
        currentStatus: fullJob.vehicle.currentStatus,
        lotNumber: fullJob.vehicle.lotNumber,
        warehouse: fullJob.vehicle.warehouse,
        floorplan: fullJob.vehicle.floorplan,
        branch: fullJob.vehicle.branch ? {
          id: fullJob.vehicle.branch.id,
          code: fullJob.vehicle.branch.code,
          name: fullJob.vehicle.branch.name,
        } : null,
      },
      inspector: fullJob.inspector ? {
        employeeId: fullJob.inspector.employeeId,
        name: fullJob.inspector.name,
      } : null,
      approver: fullJob.approver ? {
        employeeId: fullJob.approver.employeeId,
        name: fullJob.approver.name,
      } : null,
    };

    console.log(`[Webhook] Sending PDI approval notification to ${webhookUrl}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PDI_WEBHOOK_SECRET || 'pdi-webhook-secret-token-2026'}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (res.ok) {
          console.log(`[Webhook] Successfully notified other team for job ${fullJob.jobNumber}`);
        } else {
          const text = await res.text();
          console.error(`[Webhook] Failed response from receiver: Status ${res.status}. Body: ${text}`);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error(`[Webhook] Error sending HTTP request:`, err.message);
      });

  } catch (err: any) {
    console.error(`[Webhook] Failed to process webhook trigger:`, err.message);
  }
}
