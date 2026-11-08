import { createHash, timingSafeEqual } from 'node:crypto';

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff'
};

function reply(status, extraHeaders = {}) {
  return new Response(null, { status, headers: { ...headers, ...extraHeaders } });
}

function digest(value) {
  return createHash('sha256').update(value).digest();
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return reply(405, { Allow: 'POST' });

    const password = process.env.GALLERY_PASSWORD;
    if (!password) return reply(503);

    const requestUrl = new URL(request.url);
    const origin = request.headers.get('Origin');
    if (origin && origin !== requestUrl.origin) return reply(403);
    if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return reply(415);

    const body = await request.json().catch(() => null);
    if (typeof body?.password !== 'string' || body.password.length > 128) return reply(400);
    if (!timingSafeEqual(digest(password), digest(body.password))) return reply(401);

    const image = requestUrl.searchParams.get('image');
    if (image === null) return reply(204);
    if (!/^(1[4-9]|2[0-2])$/.test(image)) return reply(404);

    try {
      const base = process.env.GALLERY_PRIVATE_BASE_URL || 'https://gbe88.uk/P2/';
      const upstreamUrl = new URL(`${image}.webp`, base.endsWith('/') ? base : `${base}/`);
      const token = process.env.GALLERY_PRIVATE_BASE_URL && process.env.GALLERY_PRIVATE_TOKEN;
      const upstream = await fetch(upstreamUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        redirect: 'error',
        signal: AbortSignal.timeout(10_000)
      });

      if (!upstream.ok || upstream.headers.get('Content-Type')?.split(';')[0] !== 'image/webp') {
        await upstream.body?.cancel();
        return reply(502);
      }
      return new Response(upstream.body, {
        headers: { ...headers, 'Content-Type': 'image/webp' }
      });
    } catch {
      return reply(502);
    }
  }
};
