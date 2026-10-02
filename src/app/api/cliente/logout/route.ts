import { NextResponse } from 'next/server';
import { CLIENT_SESSION_COOKIE } from '@/lib/clientAuth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(CLIENT_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
