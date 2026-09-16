import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;

    if (!albumId) {
      return NextResponse.json({ error: 'ID do álbum ausente' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { albumId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    return NextResponse.json({ averageRating, totalReviews });
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas do álbum:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}