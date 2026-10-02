import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUniqueConstraintError } from '@/lib/prismaErrors';

export async function GET() {
  const destinations = await prisma.destination.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ destinations });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, name, country, continent, price } = body;

  if (!slug || !name || !country || !continent || price === undefined) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  try {
    const destination = await prisma.destination.create({
      data: {
        id: `dest-${Date.now()}`,
        slug,
        name,
        country,
        continent,
        shortDescription: body.shortDescription || '',
        description: body.description || '',
        image: body.image || '',
        gallery: body.gallery || [],
        price: parseFloat(price),
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        duration: body.duration || '',
        departureDates: body.departureDates || [],
        includes: body.includes || [],
        excludes: body.excludes || [],
        highlights: body.highlights || [],
        rating: body.rating ? parseFloat(body.rating) : 0,
        reviews: body.reviews ? parseInt(body.reviews, 10) : 0,
        available: body.available ? parseInt(body.available, 10) : 0,
        featured: Boolean(body.featured),
        tag: body.tag || null,
        lat: parseFloat(body.lat) || 0,
        lng: parseFloat(body.lng) || 0,
      },
    });
    return NextResponse.json({ destination }, { status: 201 });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: 'Ya existe un destino con ese slug' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo crear el destino' }, { status: 500 });
  }
}
