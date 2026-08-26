import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao procurar críticas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { albumId, albumTitle, artistName, coverUrl, releaseYear, rating, comment } = body;

    if (!albumTitle || !rating || !comment) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        albumId: albumId || 'custom',
        albumTitle,
        artistName,
        coverUrl: coverUrl || '',
        releaseYear: releaseYear || 'N/A',
        rating: Number(rating),
        comment,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao guardar crítica' }, { status: 500 });
  }
}