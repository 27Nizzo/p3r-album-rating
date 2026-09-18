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


    if (!albumId || albumId === 'default') {
      return NextResponse.json(
        {error: 'Select a valid album for the review!'},
        {status: 400}
      );
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

export async function GET() {
  try {
    const session = await auth();
    let currentUser = null;

    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
    }

    const rawReviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    });

    const reviews = rawReviews.map((rev) => ({
      id: rev.id,
      albumId: rev.albumId,
      albumTitle: rev.albumTitle,
      artistName: rev.artistName,
      coverUrl: rev.coverUrl,
      releaseYear: rev.releaseYear,
      rating: rev.rating,
      comment: rev.comment,
      createdAt: rev.createdAt,
      user: rev.user,
      likesCount: rev.likes.length,
      isLikedByMe: currentUser ? rev.likes.some((l) => l.userId === currentUser.id) : false,
    }));

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao procurar reviews:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}