import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/adminRoles';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ['emitida', 'pagada_parcial'] } },
    include: { client: true },
    orderBy: { issueDate: 'asc' },
  });

  const now = Date.now();
  const receivables = invoices
    .map((inv) => {
      const balance = Math.round((inv.total - inv.amountPaid) * 100) / 100;
      const referenceDate = inv.dueDate ?? inv.issueDate;
      const daysOld = Math.floor((now - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const bucket = daysOld <= 30 ? '0-30' : daysOld <= 60 ? '31-60' : '61+';
      return {
        id: inv.id,
        number: inv.number,
        clientId: inv.clientId,
        clientName: inv.client.name,
        total: inv.total,
        amountPaid: inv.amountPaid,
        balance,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        daysOld,
        bucket,
      };
    })
    .filter((r) => r.balance > 0.01);

  const byClientMap = new Map<string, { clientName: string; total: number; invoices: typeof receivables }>();
  for (const r of receivables) {
    if (!byClientMap.has(r.clientId)) {
      byClientMap.set(r.clientId, { clientName: r.clientName, total: 0, invoices: [] });
    }
    const entry = byClientMap.get(r.clientId)!;
    entry.total = Math.round((entry.total + r.balance) * 100) / 100;
    entry.invoices.push(r);
  }
  const byClient = Object.fromEntries(byClientMap);

  const sumBucket = (bucket: string) =>
    Math.round(receivables.filter((r) => r.bucket === bucket).reduce((s, r) => s + r.balance, 0) * 100) / 100;

  const summary = {
    total: Math.round(receivables.reduce((s, r) => s + r.balance, 0) * 100) / 100,
    bucket0_30: sumBucket('0-30'),
    bucket31_60: sumBucket('31-60'),
    bucket61plus: sumBucket('61+'),
  };

  return NextResponse.json({ receivables, byClient, summary });
}
