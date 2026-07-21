import { prisma } from '@/lib/prisma';

export async function triggerWebhook(jobId: string) {
  const webhookUrl = process.env.PDI_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[Webhook] PDI_WEBHOOK_URL not configured in environment variables. Skipping trigger.');
    return;
  }

  try {
    // Fetch only essential PDI job details for status updates
    const job = await prisma.pdiJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        jobNumber: true,
        pdiType: true,
        status: true,
        approvedAt: true,
        vehicleVin: true,
      },
    });

    if (!job) {
      console.warn(`[Webhook] Job not found for ID: ${jobId}`);
      return;
    }

    // Lightweight status update payload
    const payload = {
      event: 'pdi.status_update',
      vin: job.vehicleVin,
      pdiType: job.pdiType,
      status: job.status,
      updatedAt: job.approvedAt ? job.approvedAt.toISOString() : new Date().toISOString(),
    };

    console.log(`[Webhook] Sending PDI status update for VIN ${job.vehicleVin} to ${webhookUrl}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const webhookSecret = process.env.PDI_WEBHOOK_SECRET;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (webhookSecret) {
      headers['Authorization'] = `Bearer ${webhookSecret}`;
    }

    fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (res.ok) {
          console.log(`[Webhook] Successfully notified other team for VIN ${job.vehicleVin}`);
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
