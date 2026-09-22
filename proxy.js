import { NextResponse } from 'next/server';

/**
 * Gate the admin area behind HTTP Basic auth.
 *
 * Runs at the edge before any admin page or admin API route renders, so the
 * content management surface is never publicly reachable. Credentials come
 * from ADMIN_USER / ADMIN_PASSWORD; if either is unset the area is sealed
 * shut rather than left open.
 */
export function proxy(request) {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    return new NextResponse(
      'Admin area is not configured. Set ADMIN_USER and ADMIN_PASSWORD.',
      { status: 503 }
    );
  }

  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    let decoded = '';
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = '';
    }
    const separator = decoded.indexOf(':');
    const suppliedUser = separator === -1 ? '' : decoded.slice(0, separator);
    const suppliedPassword = separator === -1 ? '' : decoded.slice(separator + 1);

    if (safeEqual(suppliedUser, user) && safeEqual(suppliedPassword, password)) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="EMS Admin", charset="UTF-8"' },
  });
}

/** Length-independent comparison, to avoid leaking the secret via timing. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
