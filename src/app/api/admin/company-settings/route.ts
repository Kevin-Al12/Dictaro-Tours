import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const settings =
    (await prisma.companySettings.findUnique({ where: { id: 'default' } })) ??
    (await prisma.companySettings.create({ data: { id: 'default' } }));

  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const settings = await prisma.companySettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      legalName: body.legalName || "D'Itaros Tours",
      rnc: body.rnc || null,
      address: body.address || null,
      itbisRate: body.itbisRate !== undefined ? parseFloat(body.itbisRate) : 0.18,
      ncfProvider: body.ncfProvider || null,
      logoUrl: body.logoUrl || null,
    },
    update: {
      legalName: body.legalName || "D'Itaros Tours",
      rnc: body.rnc || null,
      address: body.address || null,
      ...(body.itbisRate !== undefined ? { itbisRate: parseFloat(body.itbisRate) } : {}),
      ncfProvider: body.ncfProvider || null,
      logoUrl: body.logoUrl || null,
    },
  });

  return NextResponse.json({ settings });
}
