import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUniqueConstraintError } from '@/lib/prismaErrors';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  try {
    const destination = await prisma.destination.update({
      where: { id: params.id },
      data: {
        slug: body.slug,
        name: body.name,
        country: body.country,
        continent: body.continent,
        shortDescription: body.shortDescription || '',
        description: body.description || '',
        image: body.image || '',
        gallery: body.gallery || [],
        price: parseFloat(body.price),
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
    return NextResponse.json({ destination });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: 'Ya existe un destino con ese slug' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo actualizar el destino' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.destination.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo eliminar el destino' }, { status: 400 });
  }
}
