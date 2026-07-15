import { prisma } from './prisma';

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
      vin: job.vehicleVin,          // เลขตัวถังรถยนต์
      pdiType: job.pdiType,         // ขั้นตอนตรวจ: INCOMING, LONG_TERM, PRE_DELIVERY
      status: job.status,           // สถานะล่าสุด: APPROVED
      updatedAt: job.approvedAt ? job.approvedAt.toISOString() : new Date().toISOString(), // วันเวลาที่อัปเดตสถานะ
    };

    console.log(`[Webhook] Sending PDI status update for VIN ${job.vehicleVin} to ${webhookUrl}...`);

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
