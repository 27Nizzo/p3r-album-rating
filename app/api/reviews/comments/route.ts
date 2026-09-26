import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/authOptions';

// GET: Obter comentários de uma review
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID em falta.' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao obter comentários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST: Adicionar novo comentário
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Precisas de ter a sessão iniciada para comentar.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
    }

    const { reviewId, text } = await request.json();

    if (!reviewId || !text || !text.trim()) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        reviewId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // --- LÓGICA DE AFINIDADE DE CONFIDANTS ---
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { userId: true },
      });

      if (review && review.userId !== user.id) {
        const existingConnection = await prisma.userConnection.findFirst({
          where: {
            status: 'ACCEPTED',
            OR: [
              { senderId: user.id, receiverId: review.userId },
              { senderId: review.userId, receiverId: user.id },
            ],
          },
        });

        if (existingConnection) {
          const { addAffinityPoints } = await import('@/lib/confidantRanks');
          const { newRank, newAffinity, rankedUp } = addAffinityPoints(
            existingConnection.rank,
            existingConnection.affinity,
            3 // +3 pontos por Comentário
          );

          await prisma.userConnection.update({
            where: { id: existingConnection.id },
            data: { rank: newRank, affinity: newAffinity },
          });

          if (rankedUp) {
            await prisma.notification.create({
              data: {
                userId: review.userId,
                title: `RANK UP! (RANK ${newRank})`,
                message: `A tua ligação com ${user.name || 'o teu Confidant'} subiu para RANK ${newRank}!`,
                type: 'CONFIDANT_RANK_UP',
              },
            });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar afinidade por comentário:', err);
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar comentário:', error);
    return NextResponse.json({ error: 'Erro interno ao criar comentário.' }, { status: 500 });
  }
}

// DELETE: Apagar comentário próprio
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
    }

    const { commentId } = await request.json();

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.userId !== user.id) {
      return NextResponse.json({ error: 'Comentário não encontrado ou sem permissões.' }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao apagar comentário:', error);
    return NextResponse.json({ error: 'Erro ao apagar comentário.' }, { status: 500 });
  }
}