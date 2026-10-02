import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const excursions = await prisma.excursion.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ excursions });
}
