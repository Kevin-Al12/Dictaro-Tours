import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/adminAuth';
import { CLIENT_SESSION_COOKIE, verifyClientSession } from '@/lib/clientAuth';

const PUBLIC_CLIENT_API_PATHS = ['/api/cliente/login', '/api/cliente/registro', '/api/cliente/logout'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const admin = await verifyAdminSession(session);
    if (admin) return NextResponse.next();

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (PUBLIC_CLIENT_API_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/cliente') || pathname.startsWith('/api/cliente')) {
    const session = req.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    const client = await verifyClientSession(session);
    if (client) return NextResponse.next();

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/cliente/:path*', '/api/cliente/:path*'],
};
