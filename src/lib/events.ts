const ENDPOINT = process.env.EXPO_PUBLIC_EVENT_ENDPOINT ?? '/api/event';

export type AppEvent = 'onboarding_requested' | 'talent_confirmed_setup' | 'talent_approved';

/** 'sent' = reached the automation, 'logged' = received but no webhook configured, 'failed' = not delivered. */
export type EventResult = 'sent' | 'logged' | 'failed';

export async function fireEvent(event: AppEvent, data: Record<string, unknown>): Promise<EventResult> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    });
    if (!res.ok) return 'failed';
    const json = await res.json().catch(() => null);
    return json?.forwarded ? 'sent' : 'logged';
  } catch {
    return 'failed';
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function listWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
