import { prisma } from '@/lib/prisma';
import dns from 'dns/promises';

/**
 * Checks if a resolved IP address belongs to loopback, private, or link-local ranges.
 */
function isPrivateIp(ip: string): boolean {
  // IPv4 Loopback (127.0.0.0/8)
  if (ip.startsWith('127.')) return true;

  // IPv4 Private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    const secondOctet = parseInt(parts[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  // IPv4 Link-local / AWS / DO Metadata Server (169.254.0.0/16)
  if (ip.startsWith('169.254.')) return true;

  // IPv6 Loopback (::1)
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;

  // IPv6 Link-local (fe80::/10)
  if (ip.toLowerCase().startsWith('fe80:')) return true;

  // IPv6 Unique Local Address (fc00::/7)
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;

  return false;
}

/**
 * Validates if the target URL is safe against SSRF attacks.
 */
async function isSafeUrl(urlStr: string): Promise<boolean> {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    // Resolve hostname to IP
    const lookup = await dns.lookup(url.hostname);
    return !isPrivateIp(lookup.address);
  } catch {
    return false;
  }
}

export async function triggerWebhook(jobId: string) {
  try {
    // Fetch PDI job details
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

    const payload = {
      event: 'pdi.status_update',
      vin: job.vehicleVin,
      pdiType: job.pdiType,
      status: job.status,
      updatedAt: job.approvedAt ? job.approvedAt.toISOString() : new Date().toISOString(),
    };

    // Query active webhooks from DB
    const activeWebhooks = await prisma.webhookSetting.findMany({
      where: { isActive: true },
    });

    const webhooksToSend: Array<{ url: string; secret: string | null; id?: string }> = activeWebhooks.map(w => ({
      id: w.id,
      url: w.url,
      secret: w.secret,
    }));

    // Fallback to process.env config if no webhooks exist in DB (ensuring backward compatibility)
    if (webhooksToSend.length === 0) {
      const fallbackUrl = process.env.PDI_WEBHOOK_URL;
      if (fallbackUrl) {
        webhooksToSend.push({
          url: fallbackUrl,
          secret: process.env.PDI_WEBHOOK_SECRET || null,
        });
      }
    }

    if (webhooksToSend.length === 0) {
      console.log('[Webhook] No active webhooks found in DB or environment. Skipping.');
      return;
    }

    // Trigger dispatches asynchronously and await all of them to complete
    const dispatches = webhooksToSend.map((hook) => dispatchSingleWebhook(hook, payload));
    await Promise.all(dispatches);

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Webhook] Failed to process webhook trigger:`, errMsg);
  }
}

async function dispatchSingleWebhook(
  hook: { id?: string; url: string; secret: string | null },
  payload: { event: string; vin: string; pdiType: string; status: string; updatedAt: string }
) {
  const { id, url, secret } = hook;

  // SSRF Protection filter
  const isSafe = await isSafeUrl(url);
  if (!isSafe) {
    console.error(`[Webhook] Blocked unsafe target URL (SSRF Prevention): ${url}`);
    if (id) {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: payload.event,
          status: 400,
          requestBody: JSON.stringify(payload),
          responseBody: 'Blocked by SSRF protection filter (loopback/private IP).',
        },
      });
    }
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (secret) {
    headers['Authorization'] = `Bearer ${secret}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const status = res.status;
    const responseBody = await res.text();

    if (res.ok) {
      console.log(`[Webhook] Successfully notified ${url} for VIN ${payload.vin}`);
    } else {
      console.error(`[Webhook] Failed response from ${url}: Status ${status}. Body: ${responseBody}`);
    }

    if (id) {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: payload.event,
          status,
          requestBody: JSON.stringify(payload),
          responseBody: responseBody.slice(0, 1000),
        },
      });
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errMsg = err instanceof Error ? err.message : 'Network error or timeout';
    console.error(`[Webhook] Error sending HTTP request to ${url}:`, errMsg);

    if (id) {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: id,
          event: payload.event,
          status: 0, // 0 status indicates connection / timeout failure
          requestBody: JSON.stringify(payload),
          responseBody: errMsg,
        },
      });
    }
  }
}
