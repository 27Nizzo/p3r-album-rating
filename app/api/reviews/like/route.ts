import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/authOptions';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Precisas de ter a sessão iniciada para dar like.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
    }

    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'ID da review em falta.' }, { status: 400 });
    }

    // Verificar se já deu like
    const existingLike = await prisma.reviewLike.findUnique({
      where: {
        userId_reviewId: {
          userId: user.id,
          reviewId,
        },
      },
    });

    if (existingLike) {
      // Remover like
      await prisma.reviewLike.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ liked: false }, { status: 200 });
    } else {
      // Adicionar like
      await prisma.reviewLike.create({
        data: {
          userId: user.id,
          reviewId,
        },
      });

      // --- LÓGICA DE AFINIDADE DE CONFIDANTS ---
      try {
        const review = await prisma.review.findUnique({
          where: { id: reviewId },
          select: { userId: true },
        });

        if (review && review.userId && review.userId !== user.id) {
          const targetUserId = review.userId;

          const existingConnection = await prisma.userConnection.findFirst({
            where: {
              status: 'ACCEPTED',
              OR: [
                { senderId: user.id, receiverId: targetUserId },
                { senderId: targetUserId, receiverId: user.id },
              ],
            },
          });

          if (existingConnection) {
            const { addAffinityPoints } = await import('@/lib/confidantRanks');
            const { newRank, newAffinity, rankedUp } = addAffinityPoints(
              existingConnection.rank,
              existingConnection.affinity,
              2 // +2 pontos por Like
            );

            await prisma.userConnection.update({
              where: { id: existingConnection.id },
              data: { rank: newRank, affinity: newAffinity },
            });

            if (rankedUp) {
              await prisma.notification.create({
                data: {
                  userId: targetUserId,
                  title: `RANK UP! (RANK ${newRank})`,
                  message: `A tua ligação com ${user.name || 'o teu Confidant'} subiu para RANK ${newRank}!`,
                  type: 'CONFIDANT_RANK_UP',
                },
              });
            }
          }
        }
      } catch (err) {
        console.error('Erro ao adicionar afinidade por like:', err);
      }

      return NextResponse.json({ liked: true }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Erro ao processar like:', error);
    return NextResponse.json({ error: 'Erro interno ao processar like.' }, { status: 500 });
  }
}