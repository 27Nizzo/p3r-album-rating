import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/authOptions';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Precisas de ter a sessão iniciada para avaliar um álbum.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { albumId, albumTitle, artistName, coverUrl, releaseYear, rating, comment } = body;

    if (!albumId || !rating || !comment) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    // Cria a review conectando diretamente ao Utilizador na BD pelo Email
    const newReview = await prisma.review.create({
      data: {
        albumId,
        albumTitle,
        artistName,
        coverUrl,
        releaseYear,
        rating: Number(rating),
        comment,
        user: {
          connect: {
            email: session.user.email,
          },
        },
      },
    });

    return NextResponse.json({ review: newReview }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar crítica:', error);
    return NextResponse.json({ error: 'Erro interno ao submeter crítica.' }, { status: 500 });
  }
}