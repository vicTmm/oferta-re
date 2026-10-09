const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}
export function createIngestionHandler(expectedHash: string, invoke: (name: string, payload: Record<string, unknown>) => Promise<{data: unknown; error: unknown}>) {
return async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return json({ error: 'unauthorized' }, 401);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  if (!constantTimeEqual(hash, expectedHash)) return json({ error: 'unauthorized' }, 401);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error:'unsupported_media_type' }, 415);
  // Limita também corpos transferidos sem Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return json({ error:'empty_body' }, 400);
  let bytes = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    bytes += value.byteLength;
    if (bytes > 2_000_000) { await reader.cancel(); return json({ error:'payload_too_large' }, 413); }
    chunks.push(value);
  }
  const body = new Uint8Array(bytes); let offset = 0;
  chunks.forEach(chunk => { body.set(chunk, offset); offset += chunk.length; });
  let input;
  try { input = JSON.parse(new TextDecoder().decode(body)); } catch { return json({ error:'invalid_json' }, 400); }
  if (!input || !['publish_susep_collection','record_susep_failure'].includes(input.function) || typeof input.payload !== 'object' || input.payload === null || Array.isArray(input.payload)) return json({ error:'invalid_request' }, 400);
  const { data, error } = await invoke(input.function, input.payload);
  if (error) return json({ error:'publication_rejected' }, 422);
  return json({ run_id:data });
};
}
