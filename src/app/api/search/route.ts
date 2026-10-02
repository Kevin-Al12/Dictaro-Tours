import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q          = searchParams.get('q')?.toLowerCase() || '';
  const continent  = searchParams.get('continente') || '';
  const maxBudget  = parseInt(searchParams.get('presupuesto') || '0');
  const passengers = parseInt(searchParams.get('personas') || '1');

  const [destinations, hotels, excursions] = await Promise.all([
    prisma.destination.findMany(),
    prisma.hotel.findMany(),
    prisma.excursion.findMany(),
  ]);

  const filteredDest = destinations.filter((d) => {
    if (q && !d.name.toLowerCase().includes(q) && !d.country.toLowerCase().includes(q)) return false;
    if (continent && d.continent !== continent) return false;
    if (maxBudget && d.price * passengers > maxBudget) return false;
    return true;
  });

  return NextResponse.json({
    destinations: filteredDest,
    hotels: hotels.filter((h) => !q || h.name.toLowerCase().includes(q) || h.department.toLowerCase().includes(q)),
    excursions: excursions.filter((e) => !q || e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)),
    total: filteredDest.length,
  });
}
